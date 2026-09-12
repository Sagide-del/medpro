# Content integration status

## Connected in this change

- AI publishing destinations include all three psychometric areas and resource libraries.
- The existing admin master-content bank retains published records, sources, destinations, and pathways.
- Study Guides, Drug Reference, Clinical Protocols, and Cheat Sheets read published records and open their content.
- Psychometric area buttons open the corresponding published feed. Responses persist for review; no automatic or diagnostic score is claimed.
- Student feeds refresh on page entry and window focus and exclude drafts and the other pathway.
- Required publishing schema is bundled in server startup migrations.

## Still requiring implementation

- Question Bank publication must materialize approved questions into the MCQ session model or migrate sessions to the master bank.
- Psychometric grading, reviewed results, timed sessions, and resume support.
- Published audio/video asset upload and playback. Text scripts are not playable episodes.
- Dynamic Kenya cases, resource hub counts, notes, flashcards, and diagrams.
- Admin response-review controls and unpublish/version workflows.
- Dashboard and performance aggregation from verified attempts.
- Planner history and memory tables need pathway isolation; current uniqueness is user/topic, not user/program/topic.
- Planner uses fixed topics, a heuristic recall formula, and average performance; it does not implement FSRS, Random Forest, or PPO.
- Planner must consume verified results, not ungraded responses. Frontend and backend prediction flags currently default off.

## Authoring workflow

Choose a specific EMT or Paramedic audience, choose the destination, generate from source material, review each item, and publish approved items. Published records appear in the existing admin Content Bank. Connected student libraries read those records from `/api/published-content`.

AI output still requires clinical review before publication. A source citation or approval flag alone does not establish clinical correctness.
