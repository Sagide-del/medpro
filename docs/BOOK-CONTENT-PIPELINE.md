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
