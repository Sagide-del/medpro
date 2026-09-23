# Source-grounded publishing and adaptive study planning

## Scope of this release

The existing visual design is retained while resource feeds, assessment responses,
podcast playback and planner actions connect to stored data. An optional admin source
library connects PDF ingestion, multilingual-e5-base embeddings, Chroma retrieval,
DeepSeek draft generation, human review and destination-specific publication.
This is not on-demand student generation or a clinical certification system.

## Storage and authorization

- PostgreSQL `rag_sources` is the authoritative source catalog and durable indexing queue.
  `rag_source_events` records upload, approval, retry and withdrawal actions.
- Original PDFs, model cache and persistent Chroma data are stored on the private
  retrieval service's `/data` volume. Back up this volume and PostgreSQL together.
- Super admins manage global sources. Institution admins manage their institution's
  sources; teachers can upload but cannot approve. Unaffiliated users get a private
  owner scope. Retrieval can access global sources plus the caller's own scope only.
- A request selects exactly EMT or Paramedic; `both` sources require explicit
  classification and clinical review for both scopes. Never infer scope from a filename.
- Source access and `ready` status are checked in PostgreSQL before vector search.
  Chroma metadata is not an authorization boundary.
- Current student publication feeds are global. Institution/private source drafts
  cannot be published into them. This restriction prevents cross-institution leaks.
- Withdrawing a source blocks new retrieval/publication and unpublishes its derived
  content. It retains original PDFs and historical student results for audit.

## Deploy

1. Configure the Node server normally, including its database and DeepSeek credentials.
2. Configure the same strong `RAG_SERVICE_KEY` (32+ random characters) on Node and
   the retrieval service. Do not expose the service port to the internet.
3. Set `RAG_ENABLED=true` and `RAG_SERVICE_URL=http://rag:8010` on Node.
4. With Docker Compose, run `docker compose --profile rag up -d --build`.
   For Railway or another host, create a separate service from `rag/Dockerfile`,
   attach a persistent `/data` volume, and supply `DATABASE_URL` and the private key.
   Point Node's service URL to that service's private address. Commit/push alone
   cannot provision this extra service or volume.
5. Node startup installs the additive source migration. The worker retries database
   availability. First indexing downloads the embedding model and may take minutes.
6. Use one retrieval-service process/replica per Chroma volume. This release uses
   embedded persistent Chroma, not multiple writers sharing a network filesystem.
7. Enable `AI_GENERATOR_V2_ENABLED` for reviewed publishing. To enable adaptive
   planning, set `PLANNER_PREDICTION_ENABLED=true` on Node and build the client with
   `VITE_PLANNER_PREDICTION_ENABLED=true`. Both planner flags default to false.
8. Configure durable S3-compatible supported storage for published media, or retain
   the server uploads directory on persistent storage. Ephemeral local uploads do
   not survive redeployment. The private RAG volume is separate from media storage.

Allow outbound model downloads from Hugging Face and provide several GB of RAM/disk.
Dependencies are pinned; review their security updates before public deployment.
Model name changes require a new collection and complete reindexing.

## Admin workflow

1. Open Master AI Generator. When enabled, the approved source library appears.
2. Upload an authorized, text-searchable PDF with pathway, source type, subject and
   edition/version. Uploads are limited to 20 MB and 500 pages. Use chapters rather
   than complete textbooks. A new edition is a separate immutable source record.
3. Review its classification and clinical suitability, then approve it. Status moves
   `uploaded -> queued -> indexing -> ready`. Error messages explain required action.
4. Preview retrieval with a topic. Subject filtering is exact; All subjects omits it.
5. Enable indexed-source drafts and select the destination and pathway. For the
   Question Bank, select a module, topic, difficulty and MCQ and/or True/False;
   request 10-20 questions. Other supported destinations generate one structured
   artifact per request, with source evidence attached to each section.
6. Review drafts clinically, approve and publish through the existing workflow.
   Each item preserves its source document, PDF page, edition, chunk ID and evidence quote.
7. Confirm filtered student practice and scoring in both pathways after deployment.
8. Use the admin content bank to preview or withdraw published items. Attach actual
   audio, video or images to podcast, skills-video or diagram items. The generator
   produces scripts and briefs, not synthesized audio or playable video files.

## Retrieval and validation

The model is `intfloat/multilingual-e5-base`. Storage always uses `passage: ` and
search always uses `query: `. Embeddings are normalized and compared with cosine
distance. Paragraph-aware token chunks target 350 tokens, with up to 60 tokens of
overlap, below the model's 512-token ceiling. Citations use physical PDF page numbers,
which may differ from printed page labels. Long inputs are rejected, not silently truncated.

No text on a PDF page produces an actionable OCR/blank-page error. Automatic OCR,
table reconstruction, image evidence and scanned-document processing are not shipped.
They need separate extraction quality checks; the service never silently fabricates text.

Question Bank retrieves protocol/research/textbook sources. Grounded generation and
publishing also support all three psychometric areas, Kenya cases, drug references,
clinical protocols, study guides, notes, cheat sheets, podcast scripts, skills-video
scripts, flashcards, mnemonics and diagrams. Sources must match the destination's
source-type requirements. Study plans use verified student performance rather than
AI-generated clinical content. Student filters still query published questions.

Generation rejects missing evidence, invented chunk references, non-verbatim evidence
quotes, duplicate question text, wrong type/difficulty and invalid answer choices.
A separate AI screening pass checks grounding, scope and numerical claims, followed
by required human approval. This is NOT deterministic dosage validation or proof of
clinical accuracy. Those checks and a qualified clinical review process remain necessary.
Failures do not fall back to ungrounded generation or publish automatically.

`RAG_MAX_DISTANCE` defaults to 0.25. Calibrate with representative Kenyan EMT and
Paramedic retrieval test cases before production use; cosine distance is not confidence.
There is no lifetime semantic anti-repetition guarantee or personalized retrieval.

## Responses and planning

Assessment responses are saved with a content snapshot and idempotency token.
Objective choices use deterministic answer-key grading. Rubric-based AI feedback is
explicitly provisional; missing credentials or grading failures leave the saved
response awaiting review. This is educational feedback, not a validated psychological
assessment. Student feeds and histories enforce the selected EMT/Paramedic pathway.

The planner uses `ts-fsrs` for memory updates from server-recorded MCQ attempts,
normalized heuristic priority, observed learning trends and half-hour allocations.
Cardiac, paediatric and obstetric review intervals are shortened threefold.
Prediction caches expire after 24 hours and verified new attempts invalidate them.
Study-block completion persists separately and cannot manufacture mastery scores.
There is no trained Random Forest or PPO model; insufficient history is reported
explicitly rather than presented as a reliable mastery-date prediction.

## Remaining boundaries

- Clinical approval is required before publication; AI screening is not a guarantee.
- Kenya cases are published case readers, not a dynamic-vitals simulation engine.
- Podcast voice synthesis, OCR, image extraction and deterministic dosage checks
  are not implemented by this release.
- Generation runs use the existing job runner; a restart-safe generation worker
  queue and lifetime semantic duplicate detection remain separate follow-up work.
- Local verification does not substitute for a deployed authenticated smoke test
  using real source PDFs, the configured model provider and persistent storage.

## Tests and rollback

Verification on 2026-09-23: client production build, JavaScript syntax checks,
Question Bank publishing/filter tests, published-response tests, 15-destination
routing tests, RAG authorization/evidence tests, adaptive-planner integration tests,
and three Python chunking tests passed. The real e5 smoke test failed with native
Windows access violations while loading model tensors, including after aligning
the local torch version with the Docker image. Docker is unavailable on this host.
Live model generation and a deployed authenticated browser flow are not verified.
Do not enable RAG in production until its real-model smoke test passes there.

- `cd server; node --env-file=.env.txt scripts/verify-rag.js` uses a local database
  with at least one user; fixture writes roll back. Retrieval responses are mocked
  to test authorization independently of embedding quality.
- `cd rag; python -m unittest test_chunking.py` tests prefixes, chunk coverage and identity.
- `cd server; node --env-file=.env.txt scripts/verify-content-routing.js` verifies
  all 15 destinations and rejects missing evidence.
- `cd server; node --env-file=.env.txt scripts/verify-adaptive-planner.js` verifies
  FSRS, verified-attempt idempotency, pathway isolation and persisted scheduling.
- `cd rag; python smoke_retrieval.py` exercises real e5/Chroma with synthetic PDFs;
  it requires model downloads and a compatible native PyTorch runtime.
- Run existing published-content/question-publishing verification and the client build.
- A separate deployed smoke test with real PDFs, e5, Chroma and DeepSeek is required.
- Rollback: set `RAG_ENABLED=false` and restart Node. Existing practice and published
  content remain available; do not drop source tables or the retrieval volume.
- Planner rollback: disable both planner flags and rebuild the client. Keep the
  additive planner tables, stored history and FSRS state for a later re-enable.
