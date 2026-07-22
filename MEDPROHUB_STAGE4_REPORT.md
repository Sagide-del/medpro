# MedProHub Stage 4 Report

Report date: 2026-07-22

## Features completed

- Added a new additive teacher-controlled assignment workflow on top of the existing assessment engine.
- Added teacher assignment creation with:
  - title
  - program
  - module
  - topic
  - skill
  - difficulty
  - assignment type
  - number of questions
  - time limit
  - due date
  - assigned class/group
- Added teacher question bank creation and listing for institution-scoped reusable questions.
- Added AI-assisted draft question generation using a local structured generation service with teacher review before assignment creation.
- Added teacher marking queue with submission review, per-answer scoring, comments, and feedback release.
- Added teacher student-performance view with submission counts and average scores.
- Added student assignment experience with:
  - assignment list
  - assignment detail
  - start
  - submit
  - released feedback view
- Added automatic MCQ grading during submission.
- Added AI-style short-answer grading suggestions to assist teacher review.
- Preserved the existing assessment engine, graphics module, flashcards, subscription logic, and payment records.

## Files changed

Backend:

- `database/migration_005_assignment_workflow.sql`
- `server/scripts/migrate.js`
- `server/src/index.js`
- `server/src/models/AssignmentWorkflow.js`
- `server/src/controllers/assignmentWorkflowController.js`
- `server/src/routes/assignmentWorkflow.js`
- `server/src/services/assignmentAiService.js`

Frontend:

- `client/src/App.jsx`
- `client/src/components/teacher/Dashboard.jsx`
- `client/src/components/assignment-workflow/catalog.js`
- `client/src/components/student/Assignments.jsx`
- `client/src/components/teacher/Assignments.jsx`
- `client/src/components/teacher/QuestionBank.jsx`
- `client/src/components/teacher/AiAssignmentGenerator.jsx`
- `client/src/components/teacher/MarkingQueue.jsx`
- `client/src/components/teacher/StudentPerformance.jsx`

## Database migrations

Created:

- `migration_005_assignment_workflow.sql`

This migration adds:

- `question_bank`
- `assignments`
- `assignment_questions`
- `assignment_submissions`
- `assignment_answers`
- `grading_feedback`
- `ai_generation_logs`

It does not delete or rename any existing assessment, graphics, flashcard, payment, or subscription tables.

## Routes added

Teacher workflow:

- `GET /api/assignment-workflow/teacher/groups`
- `GET /api/assignment-workflow/teacher/assignments`
- `GET /api/assignment-workflow/teacher/assignments/:id`
- `POST /api/assignment-workflow/teacher/assignments`
- `GET /api/assignment-workflow/teacher/question-bank`
- `POST /api/assignment-workflow/teacher/question-bank`
- `PATCH /api/assignment-workflow/teacher/question-bank/:id`
- `POST /api/assignment-workflow/teacher/ai-generate`
- `GET /api/assignment-workflow/teacher/submissions`
- `GET /api/assignment-workflow/teacher/submissions/:id`
- `PATCH /api/assignment-workflow/teacher/submissions/:id/grade`
- `GET /api/assignment-workflow/teacher/performance`

Student workflow:

- `GET /api/assignment-workflow/student/assignments`
- `GET /api/assignment-workflow/student/assignments/:id`
- `POST /api/assignment-workflow/student/assignments/:id/start`
- `POST /api/assignment-workflow/student/assignments/:id/submit`
- `GET /api/assignment-workflow/student/assignments/:id/results`

Frontend routes:

- `/teacher/assignments`
- `/teacher/question-bank`
- `/teacher/ai-generator`
- `/teacher/marking-queue`
- `/teacher/student-performance`
- `/student/assignments`
- `/student/assignments/:id`

## Testing performed

Frontend:

- `npm run build` completed successfully on 2026-07-22

Backend:

- `node --check` across `server/src/**/*.js` completed successfully on 2026-07-22

## Known limitations

- The new migration was created and wired into the migration runner, but it was not applied to a live database in this session.
- Teacher login, student login, assignment creation, assignment submission, and marking workflow were not executed end-to-end against a running database-backed app in this session; verification here is based on code integration plus syntax/build success.
- The AI assignment generator is implemented as a local structured generator, not an external LLM integration. It supports review/edit/delete/regenerate workflow, but it is not yet connected to a remote AI provider.
- Institution admin and super admin Stage 4 viewing/oversight dashboards were not expanded in this pass; this implementation focuses on the teacher-controlled workflow requested for Stage 4.
- Student recommendation output for simulations is currently lightweight text guidance rather than a deep recommendation engine tied to stored simulation analytics.
- The existing older `Grade submissions` assessment page remains in place intentionally to avoid breaking existing assessment functionality. The new marking queue is additive.
