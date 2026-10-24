# Kenya EMS worksheet course

Super admins manage JSON worksheets at `/superadmin/kenya-ems-cases`. The sidebar has a dedicated Kenya EMS Cases entry; the older `/admin/kenya-ems-cases` page redirects here. Upload a JSON file or paste `{ "cases": [...] }`, preview each worksheet, save drafts, and publish after explicit source and clinical review. Students use `/student/learn/kenya-ems`.

Each case has a stable `case_code` and `level` (`EMT`, `Paramedic`, or `Nursing`). Importing that code in the same track updates its existing case. New codes append unless `order_number` is provided. Order numbers are unique within a track; include both cases in one import to swap their order. Invalid batches roll back together. Case content edits increment a revision while preserving previous attempts. Drafts are never visible in the course.

## JSON shape

```json
{
  "cases": [{
    "case_code": "KE-EMT-EXAMPLE-01",
    "level": "EMT",
    "incident_name": "Instructor-reviewed incident",
    "source": "Source attribution or report URL",
    "verified_facts": "Attributed incident facts; shown as reported facts.",
    "scene_context": "The learner's scene briefing.",
    "patient": {"findings": "Clinically reviewed simulated findings"},
    "completion_rule": "submission",
    "tables": [{
      "table_key": "assessment",
      "title": "Primary assessment",
      "columns": ["Finding", "Interpretation"],
      "reference_answer": "Instructor's reference discussion; hidden until submission.",
      "rows": [{"prompt": "Airway", "scoring": "reflection"}]
    }]
  }]
}
```

`title` also accepts `incident_name`; `program` accepts `level`; `reported_facts` accepts `verified_facts`. Patient details are explicitly labelled as simulated. Supported patient keys are age, sex, findings, history, chief_complaint, and observations. Worksheet table keys and optional row keys must be safe unique identifiers. There are up to 20 tables per case, 30 rows per table, and four response columns. Imports are limited to 1,000 cases and 8 MB. Each response cell is limited to 4,000 characters.

A row can supply `hidden_answer`; otherwise the table's `reference_answer` supplies its reference discussion. Required rows default to true. The student receives only the briefing, column labels and prompts before submitting. Answer keys, scoring keywords and accepted answers stay on the server. References are returned only in that student's submitted attempt, never in the course list or another student's worksheet.

## Completion and progression

The default `completion_rule: "submission"` requires every required cell to be filled before submission. Submission completes this educational worksheet, reveals its reference answers, and unlocks the next published case in the student's own track. Written reasoning is not assigned a fictional automated score. Draft responses save in the background and can also be saved explicitly.

For configured objective criteria, a row can use `scoring: "exact_match"` with `hidden_answer` or `accepted_answers`, or `scoring: "keyword_match"` with an explicit `keywords` array. Keywords are never inferred from clinical prose. A case using `completion_rule: "pass"` and `passing_score` must have automatic scoring configured for every row before it can be published. A keyword-match row without explicit keywords remains unscored in a submission-based worksheet, matching the need for reflective review in the supplied example.

Later cases may show locked titles, but their contents, draft endpoints and submit endpoints reject access until all previous published case revisions are completed. Editing a prerequisite and publishing a new revision requires that version to be completed before advancing; prior attempts remain stored. Completing the final case shows the end-of-course state. Administrative unpublication retains attempts.

## Existing incident reports

Previously published `kenya_cases` artifacts are migrated into source-attributed reflection worksheets, maintaining the previous material without exposing the whole incident library at once. New AI incident publications enter this same sequential course. The generic published-content feed no longer returns full Kenya case content, and the old published-cases student URL redirects to the course. Source-linked cases follow their originating publication's availability. Book-generated Clinical Case Scenarios remain a separate destination.

The startup schema adds `ke_cases`, revision-specific drafts, and idempotent student attempts. Course edits and submissions use PostgreSQL locks so publication, ordering and completion cannot race to skip prerequisites.

## Validation

Integration tests cover draft/publication review, stable-code updates, track isolation, direct locked-case access, partial worksheet rejection, saved drafts, answer privacy, idempotent submissions, revisions and retained attempts. A real local browser/database workflow imported the four supplied cases, rendered all six tables per worksheet at a 390px viewport, saved responses, submitted the first EMT case, revealed reference answers, and unlocked its next case. The Paramedic course retained its independent locks. User-supplied incident and clinical claims were preserved as draft material, not independently verified or automatically published to production.


Repository growth: each upload accepts up to 1,000 cases / 8 MB. New case codes append to the existing track. Cases absent from an upload are never deleted or unpublished. Matching track and case code explicitly update that case; saving an updated case as a draft unpublishes only that updated case. Saved drafts can be selected across repository pages and published after review. For larger collections, upload successive files.

The case manager defaults to append mode (`appendNew: true`): new cases receive the next available track position and existing cases keep their positions, even when uploaded order numbers restart at 1. Disable this option to apply explicit JSON ordering. Invalid batches report the case index/code and save nothing.
