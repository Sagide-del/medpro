# MedPro — EMS/Paramedicine Education Platform

**Developed by SA Technologies**
South C (Bellevue), Red Cross Road, Nairobi · +254 748 519 923 · info@satechnologies.co.ke

MedPro is a full-stack assessment and evaluation platform for Kenyan EMS/paramedicine institutions.
Students take quizzes, exams, and Clinical Judgment scenarios; study flashcard decks with spaced
repetition; work premium worksheets; browse interactive medical graphics; keep a clinical logbook;
and upload skills videos for teacher review. Institutions subscribe, students pay per-item
(worksheets, flashcard decks, and graphics — Ksh 10 each) via M-Pesa STK Push, and admins track
users, institutions, and revenue.

## Stack

| Layer    | Technology                                              |
|----------|----------------------------------------------------------|
| Frontend | React 18 + Vite, React Router, Recharts                  |
| Backend  | Node.js + Express (ES modules), MVC-style structure       |
| Database | PostgreSQL 14+                                            |
| Payments | M-Pesa Daraja API (STK Push) — simulated in local dev      |
| Auth     | JWT (bcrypt password hashing), role-based                  |

## Roles & portals

| Role                | Portal        | Highlights                                                        |
|----------------------|---------------|---------------------------------------------------------------------|
| `student`             | `/student`     | Assessments, worksheets, flashcards, graphics, logbook, videos, groups, payments |
| `teacher`              | `/teacher`     | Create assessments, grade submissions, review logbook/videos, class analytics |
| `institution_admin`   | `/admin`       | Institution profile, user management, revenue (scoped to their institution) |
| `super_admin`          | `/superadmin`  | Institutions, all users, content upload/management, platform-wide revenue analytics |

Public routes: `/` (marketing home), `/login`, `/register` (student self-signup).

## Project structure

```
medpro/
├── database/
│   ├── schema.sql          # Full schema: institutions, users, groups, assessments,
│   │                       #   worksheets, flashcards, graphics, logbook, videos, payments, notifications, audit
│   └── seed.sql            # Demo institutions, one user per role, sample content and transactions
├── server/
│   └── src/
│       ├── index.js          # App entrypoint — mounts all routers
│       ├── config/           # database.js (pg pool), auth.js (JWT/bcrypt helpers)
│       ├── models/           # One file per entity — raw-SQL query wrappers (no ORM)
│       ├── controllers/      # Request handlers, one file per resource
│       ├── middleware/       # auth.js, roleCheck.js, validation.js, audit.js
│       ├── services/         # paymentService.js (M-Pesa), assessmentService.js (grading), analyticsService.js
│       ├── routes/           # One router per resource, mounted under /api/*
│       └── utils/            # logger.js, helpers.js (SM-2 spaced repetition, phone normalization, etc.)
└── client/
    └── src/
        ├── pages/            # Home, Login, Register
        ├── components/
        │   ├── student/      # Dashboard, Assessments, Worksheets, Flashcards, Graphics, Logbook, Videos, Groups, Payments
        │   ├── teacher/      # Dashboard, CreateAssessment, GradeSubmissions, ReviewLogbook, Analytics
        │   ├── admin/        # Dashboard, Institutions, Users, Revenue (institution-scoped)
        │   ├── superadmin/   # Dashboard, Institutions, ContentUpload, FlashcardsManager, WorksheetsManager, GraphicsManager, RevenueAnalytics
        │   └── shared/       # Navbar, Footer, Loading
        ├── context/          # AuthContext
        └── services/         # api.js (fetch wrapper), auth.js
```

## Getting started

### 1. Database

```bash
createdb medpro
psql medpro -f database/schema.sql
psql medpro -f database/seed.sql
```

### 2. API server

```bash
cd server
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, and Daraja credentials
npm install
npm run dev                 # http://localhost:5000
```

M-Pesa credentials can stay as placeholders for local development — purchases auto-complete
without a real Daraja account so the full purchase → unlock flow is testable end-to-end.

### 3. Client

```bash
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api and /uploads to :5000)
```

### Demo logins

All seeded accounts share the password `Password123!`.

| Role               | Email                          |
|---------------------|--------------------------------|
| Super admin          | admin@satechnologies.co.ke     |
| Institution admin    | admin@krcti.ac.ke              |
| Teacher               | prof.maina@krcti.ac.ke         |
| Student                | john.doe@krcti.ac.ke           |

Change these immediately in any shared environment.

## Clinical Judgment scenarios

Scenario-type assessments are scored against the NCSBN Clinical Judgment Measurement Model's six
steps: `recognize_cues`, `analyze_cues`, `prioritize_hypotheses`, `generate_solutions`,
`take_action`, `evaluate_outcomes`. Scenario-step answers are free text, so they're flagged for
teacher review with provisional partial credit rather than auto-graded — `assessmentService.js`
handles this split between auto-graded (MCQ/short-answer) and manually-reviewed (scenario) items.

## Spaced repetition flashcards

`utils/helpers.js` implements the SM-2 algorithm. Each review (`POST /api/flashcards/cards/:id/review`
with a 0–5 quality rating) updates `flashcard_progress.ease_factor`, `interval_days`, and
`next_review_at` per student per card; the study queue (`GET /api/flashcards/:id/study/due`) only
returns cards that are actually due.

## M-Pesa integration

`services/paymentService.js` implements the Daraja STK Push flow:

1. Student calls `POST /api/payments/purchase` with `itemType` (`worksheet` | `flashcard_deck` | `graphic`), `itemId`, and `phone`.
2. Server creates a **pending** transaction and fires an STK Push — the student gets the PIN prompt on their phone.
3. Safaricom calls `POST /api/payments/mpesa/callback` (set `MPESA_CALLBACK_URL` to a public HTTPS URL — use ngrok in development).
4. On success the transaction is marked **completed**, the M-Pesa receipt is stored, and timed content access is granted (48h for worksheets/flashcard decks, 24h for graphics).
5. The client polls `GET /api/payments/status/:checkoutId` to confirm.

With placeholder Daraja credentials (the `.env.example` default), purchases auto-complete locally
instead of calling Safaricom, so the full flow works without a sandbox account.

## API summary

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | /api/auth/login, /register | public | Sign in / student self-registration |
| GET/POST/PATCH/DELETE | /api/assessments | mixed | Quizzes, exams, scenarios — create, publish, attempt, grade |
| GET/POST/PATCH/DELETE | /api/worksheets | mixed | Catalogue, create, publish, submit, grade |
| GET/POST/PATCH/DELETE | /api/flashcards | mixed | Decks, cards, spaced-repetition study/review |
| GET/POST/PATCH/DELETE | /api/graphics | mixed | Interactive medical graphics catalogue and files |
| GET/POST/PATCH | /api/logbook | student, teacher/admin | Entries + teacher review |
| GET/POST/PATCH | /api/videos | student, teacher/admin | Skills video upload + teacher review |
| GET/POST/DELETE | /api/groups | teacher, student | Cohort management |
| POST | /api/payments/purchase | student | STK Push purchase |
| POST | /api/payments/mpesa/callback | Safaricom | Payment confirmation webhook |
| GET/POST/PATCH | /api/institutions | super admin | List, register, subscriptions |
| GET/POST/PATCH/DELETE | /api/users | admin | Search, create, suspend, soft-delete users |
| GET | /api/admin/dashboard | super admin, institution admin | Dashboard vitals + recent activity |
| GET | /api/analytics/* | mixed | Revenue, top content, student/class performance |

Every admin action (uploads, edits, deletions, user management, logins, approvals) is written to
`super_admin_logs` with IP and user agent.

## Roadmap (not yet built)

- Real-time notifications delivery (table + API exist; no push/websocket layer yet)
- Bulk ZIP content upload
- S3/cloud storage for uploads (currently local disk via multer)
- Email renewal reminders for expiring subscriptions
- Automated grading for scenario/Clinical Judgment steps (currently teacher-reviewed)

---
© 2026 MedPro — SA Technologies. All rights reserved.
