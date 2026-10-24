# Book-driven content management

## Strategy

Keep one private, versioned source catalog and one durable content workflow. Uploading the same book separately into every student section loses provenance and makes updates hard to manage.

The existing application already had private PDF indexing, source-grounded generation, draft review, and destination publishing. It lacked deterministic coverage and a durable chapter-generation queue: repeated topic searches could retrieve the same passages, and a one-off request did not track which parts of a book had been covered.

The new book pipeline connects these pieces:

1. **Register the source:** upload a PDF under **Super admin → AI Generator → Approved source library**, with subject (for example, Anatomy and Physiology), edition, source type Textbook, and approved audience. “Shared: EMT, Paramedic, Nursing” is an explicit classification reviewed for all three tracks. The legacy “both” classification still means EMT and Paramedic only.
2. **Approve and index:** an administrator approves the source. The private RAG worker verifies its checksum, extracts text with original PDF page numbers, indexes retrieval passages, and records private ordered passages in PostgreSQL. PDF chapter bookmarks are retained. Books without bookmarks have clearly labelled passage batches; chapter names are not invented. Blank/illustration-only pages are skipped without renumbering citations. Fully scanned books need OCR first. Limits: 50 MB and 2,000 PDF pages.
3. **Prepare coverage:** select the ready book in **Book → question and clinical case pipeline**. Select chapters or a PDF page range, study tracks, target Question Bank modules, and outputs. By default outputs are questions and clinical case scenarios. Module routing can use an existing module or create/reuse a subject-specific module per track. Older indexed sources need **Reindex for book generation** once to populate the ordered passage catalog.
4. **Preview workload:** each batch uses at most eight passages from one chapter and one study track. Choose 5–20 questions per question batch; a clinical batch generates one scenario. The preview shows pages, passages, draft targets, and approximately two model calls per batch. A run is limited to 200 batches; select fewer chapters or a smaller PDF page range for larger books. Page ranges also let books without PDF bookmarks be processed incrementally. No chapters are silently dropped.
5. **Run the queue:** start the bounded run. PostgreSQL claims survive page navigation and service restarts. Workers use row locks and claim tokens, deduplicate draft stems per scope/track/destination, and retain progress. Repeated start requests reuse the same run token. Pausing stops new batches; an already-running batch may finish. Failed batches require an explicit retry. Provider access/rate-limit failures pause the run instead of repeatedly consuming the rest of the queue. A crashed claim can be reclaimed after 15 minutes, with at most two interrupted attempts before it is marked failed.
6. **Review and publish:** generated questions and cases retain page-linked evidence, answers or rubrics, and preliminary model screening. Select reviewed items and confirm clinical review before publishing. Unsupported content fails rather than being fabricated. Partial publication leaves remaining items reviewable. Private/institution sources stay draft-only because the current student feeds are global.
7. **Student destinations:** questions appear in the selected track and subject/module in the Question Bank. Cases appear under **Revision → Clinical Case Scenarios** (`/student/clinical-cases`), using the existing clinical-judgment response and grading workflow. Cases are source-based study activities, not unsupported treatment protocols or a replacement for the separate staged Kenya EMS simulation system.

Source withdrawal pauses its runs, cancels unstarted batches, blocks in-flight publication, and withdraws previously published derivatives. It also releases draft fingerprints so an authorised replacement source can be processed. Saved student results remain intact.

## Runtime prerequisites

The API's existing startup schema check installs `book-generation.sql`; no separate whole-checkout migration is required for this feature. The private RAG service must also be redeployed from the updated `rag/` code. An older RAG worker does not write the ordered passage catalog needed for book coverage.

Configure server-side values securely on the hosting service:

- `RAG_ENABLED=true`
- `RAG_SERVICE_URL` pointing to the private RAG service
- A matching `RAG_SERVICE_KEY` on API and RAG service (at least 32 characters)
- `DEEPSEEK_API_KEY`, plus the supported `DEEPSEEK_MODEL`/`DEEPSEEK_BASE_URL` settings already used by AI Generator
- The shared `DATABASE_URL` for API and RAG service
- Persistent storage for the RAG service's `/data` directory

Do not place provider credentials in React/Vite variables, repository files, or chat. The admin panel reports whether indexing and generation are enabled. Indexing also requires the RAG service's existing model/runtime dependencies. Use the existing opt-in Docker Compose `rag` profile for local service deployment. Run one ingestion worker per persistent Chroma volume.

## Validation and limits of the current verification

- `node --test server/tests/book-generation-plan.test.mjs server/tests/grounded-generation-provider.test.mjs`
- From `server`, against a local development database: `RUN_DB_TESTS=true node --test tests/book-generation-database.test.mjs`
- With RAG dependencies installed: `python -m unittest discover -s rag -p 'test_*.py'`
- `npm --prefix client run build` and `node --test client/tests/*.test.mjs`

The queue/database tests exercise chapter coverage, exact request identity, concurrent claims, pause/resume, publication into both destinations, duplicate suppression, source withdrawal, and scope isolation. Provider tests use a deterministic local HTTP fixture to exercise request formatting, grounding validation, and screening without incurring model charges. Ingestion tests use controlled PDF-reader/vector fixtures to verify page/chapter persistence, blank-page numbering, and checksum rejection. These tests do not establish the clinical accuracy of a real model or prove that a real book has been processed in production. Review a representative chapter before expanding a new source.

For a Railway indexing service, set Root Directory to `rag` and Config File Path to `rag/railway.json`. Attach a persistent volume at `/data`, ensure it is writable by the container's `rag` user, and keep one replica. Configure the shared database and service key, then point the API's `RAG_SERVICE_URL` to the service's private address on port 8010. Do not add a public domain. The service's health endpoint is authenticated, so the deployment configuration does not specify an unauthenticated HTTP health check.

## Content studio workflows

`/superadmin/content` now offers three workspaces: books, Kenya EMS incident reports, and the existing single-draft/review archive. The generator accepts `?workspace=books`, `incidents`, or `advanced`.

Book plans can populate Question Bank, Clinical Case Scenarios, the two additional psychometric areas, Study Guides, Drug Reference, Clinical Protocols, Cheat Sheets, Flashcards, Notes, Mnemonics, diagram briefs, and podcast/video scripts. Questions have selectable easy/medium/hard difficulty and multiple-choice, true/false, or scenario-with-choices formats. A missing medication or other relevant evidence must produce no supported artifact rather than invented content. Review remains required; source procedures do not automatically become approved local protocols. Plans remain capped at 200 tasks, with workload preview before starting. Select chapters or page ranges for larger plans.

Study Plans and Performance consume student activity and verified assessment results. They are not fabricated from uploaded books. Podcasts and videos remain scripts until separate media is attached. Visual flashcards render a designed recall card and, where supported by evidence, an ordered process graphic from validated structured steps. They do not generate anatomical illustrations or audio/video files. Reviewers can inspect each front, back and sequence before publication.

Kenya EMS reports have a dedicated flow: title + track + HTTPS article URL and/or pasted report text → persisted generation job → evidence-linked incident draft → explicit review → publish to `kenya_cases`. Pasted text takes precedence and a supplied URL is retained for attribution. Blocked links require pasted text; URLs alone are never treated as incident evidence. Importing URLs pins validated public DNS addresses, checks every redirect, limits response size and duration, and rejects private networks and credential URLs. Source text remains untrusted data. Incident prompts distinguish reported facts, unknowns, and learning discussion without inventing locations, casualty counts or clinical actions.

The API's shared generation worker claims incident jobs using PostgreSQL row locks, independently of PDF indexing. A generation-provider key is required. Jobs interrupted for more than 15 minutes fail explicitly, keeping their source snapshots in the review archive. They are not silently regenerated or published. The Kenya EMS student menu lists published incident studies, links to their complete reviewed content, and supports EMT, Paramedic, and Nursing tracks.

Question filters use the database's canonical `beginner`, `intermediate`, and `advanced` values. Legacy `basic`/`easy` and `hard` query values normalize consistently. The module-count endpoint applies track, topic, format, difficulty, and publication status before returning matching counts. The UI hides modules without matches and presents a useful empty state. It no longer removes valid API results using an incompatible browser-side difficulty comparison.

The supplied *Manual of Clinical Paramedic Procedures* was inspected locally: 394 PDF pages, 384 with extractable text, 160 bookmarked sections including nested headings. It identifies itself as a 2010 edition. This is a source-compatibility check, not a production upload or a claim that its procedures reflect current local guidance. Start with a selected clinical chapter, classify it as Paramedic, retain the edition, and verify generated clinical content before publication. The PDF and extracted book text are not committed to Git.

Validation covers deterministic generation fixtures through actual PostgreSQL queueing, all supported book destinations, reviewed publication, student feeds, answer/rubric hiding, visual metadata, easy/hard format combinations, incident publication, withdrawal, duplicate handling, and provider failures. Browser checks use API fixtures to exercise the admin workflow and student screens; they do not establish production provider or indexing health.

### Diagnosing “Source retrieval is not enabled”

This error is returned by the Node API before any request is sent to the indexing service. In Railway, open project `chic-passion`, select the production environment, then select **medpro** (the API service). Set `RAG_ENABLED` to exactly `true` and verify `RAG_SERVICE_URL` and `RAG_SERVICE_KEY` are set on this service. Variables placed only on **medpro-rag** are not inherited by medpro. Deploy staged changes/restart the API after saving variables. The flag accepts surrounding whitespace and case differences; false, missing, and malformed values remain disabled.

The authenticated `/api/ai/rag/config` response reports only boolean readiness and actionable missing-setting messages, never service URLs or keys. The content studio disables PDF upload while setup is incomplete and does not label an unreadable library as empty. Its “Check connection / refresh setup” button refreshes API settings and, for super admins, calls `/api/ai/rag/connection-check`. The check makes an authenticated private `/health` request with a ten-second timeout, checks book-coverage compatibility, and distinguishes mismatched keys, network failure, unhealthy service, and outdated worker code. A passing check establishes service/database/index connectivity, not successful model embedding or generation of a real book.

### Failed transfers and Railway private networking

The private service now starts with `python serve.py`, which supplies Uvicorn with an explicit dual-stack socket on port 8010. This accepts both Railway private IPv6 connections and IPv4 Docker connections. Redeploy **medpro-rag** from the updated `rag/Dockerfile`; a manually overridden Railway start command must also use `python serve.py`. The API still uses the private service hostname, not a public domain. This corrects an IPv4-only listener; it does not establish which network/authentication problem occurred in any particular production upload without a connection-check result or logs.

A PDF transfer must receive an explicit storage acknowledgement before the source becomes `uploaded`. Failed transfers now retain a failed source with an actionable diagnostic rather than deleting its registration. Re-uploading the identical PDF with the same classification reuses an unapproved failed registration. The library detects `uploading` entries older than three minutes and marks them interrupted; select the same PDF to retry. Approved sources cannot be overwritten through this route. Upload leases prevent concurrent retries or a late completion from reviving a withdrawn source.

The UI distinguishes “Select PDF to retry upload” (transfer failed before approval) from “Retry indexing” (approved source indexing failed). Authentication rejection, upload registration/database mismatch, request-size rejection, service errors and connectivity failures now have separate messages. An upload error alone does not mean the book has been parsed or indexed. A zero-page source is still at the transfer stage.

Upload recovery tests share a development database with schema-changing integration tests; run those files with `node --test --test-concurrency=1` to avoid concurrent migration DDL against another test's active transactions.

### Indexing throughput and visible progress

The indexing worker now combines passages from multiple PDF pages into batches of up to 32, while preserving each passage's original PDF page and ordinal. Embeddings still use the same multilingual-e5-base model, passage/query prefixes, 512-token check and normalized vectors. Each batch writes its private passages using PostgreSQL executemany rather than one round trip per row. CPU model threads default to two (`RAG_CPU_THREADS`, bounded to 1–8); tune only against the service's actual CPU allocation.

The collection lock no longer covers an entire book or model encoding, so health checks can run while indexing. Extraction, initial model preparation and embedding are reported separately. Source listings include total PDF pages, processed pages and committed passage counts. Model preparation shows an explanation rather than a fictional completion percentage. Keep the persistent `/data` volume so later books reuse downloaded model files.

A 15-second worker heartbeat prevents an active long index from being mistaken for an interrupted task. An index without activity for three minutes is eligible for requeue, replacing the previous thirty-minute delay. Progress updates respect withdrawal/cancellation, and the final ready transition still requires a successful complete index. Generation and publication remain blocked for unfinished sources.

A deterministic 65-page regression fixture verifies three cross-page batches (32, 32, 1), four passage-storage database connections including initial cleanup, complete unique passage coverage, and the final page/chunk counters. This verifies reduced request overhead; it is not a production timing benchmark. First model download and actual Railway CPU/memory allocation still affect elapsed time.

### Student enrollment isolation

Student pages now display the account's enrolled track as read-only. Student-facing track switches have been removed from the shell, question filters, study planner, incident library and settings. Registration still selects enrollment; administrator generation and source routing still support all three tracks.

Authenticated student requests default to the track carried by the signed login token and reject query/body requests for another track with `STUDY_TRACK_MISMATCH`. Historical unassigned accounts retain the existing EMT default. MCQ module lookup/submission and attempt review additionally check the student's enrollment in PostgreSQL. Mock-test lists and sessions are scoped by track; bookmarks and question-bank progress no longer expose another track. Existing browser sessions discard the previous local override and restore the enrollment from their login token, with authorization always enforced on the server. Administrative enrollment changes require a fresh login token.

Validation includes actual signed-token requests for EMT, Paramedic and Nursing, direct access to a foreign module, cross-track publication feeds, mock-test selection and bookmarking. Browser checks cover six student pages for each enrollment and recovery from a stale locally selected track.
