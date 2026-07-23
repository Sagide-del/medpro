# MedProHub Stage 11 Report

Report date: July 23, 2026

## Subscription architecture

- Preserved the live subscription and payment foundation:
  - `student_subscriptions`
  - `institution_subscriptions`
  - `revenue_transactions`
  - existing M-Pesa callback route and payment history flows
- Added structured SaaS subscription layers on top of the live system:
  - `subscription_plans`
  - `subscription_events`
  - `payment_attempts`
- Introduced plan-driven subscription logic for:
  - `Student Monthly` at `KES 300` for `30 days`
  - `Institution Annual Licence` at `KES 15,000` for `365 days`
- Added provider-agnostic subscription orchestration in `server/src/services/paymentService.js` with:
  - `initiatePayment()`
  - `verifyPayment()`
  - `activateSubscription()`
  - `handleCallback()`
- Preserved M-Pesa support under that orchestration layer rather than rebuilding the payment stack.
- Added a shared subscription access resolver for student and institution coverage states:
  - `active`
  - `expired`
  - `pending`
  - `cancelled`
- Added reminder metadata preparation for:
  - `7 days before expiry`
  - `3 days before expiry`
  - `1 day before expiry`
  - post-expiry state handling

## Features completed

- Completed premium access integration for:
  - Clinical Reference Cards
  - Assignments
  - Clinical Simulations
  - Assessments
- Restricted student premium access through the shared subscription resolver while preserving existing routes.
- Returned subscription metadata when premium access is denied so the frontend can show renewal prompts.
- Updated the student subscription page to show:
  - current plan
  - `KES 300/month`
  - payment status
  - expiry date
  - renewal action
  - student plan benefits
- Updated the institution admin licence page to show:
  - licence status
  - expiry date
  - students covered
  - teachers covered
  - renewal action
- Expanded the super admin subscription management view to show:
  - plans
  - subscriber summary
  - subscription revenue
  - payment history

## Files changed

Backend:

- `database/migration_007_subscription_refinement.sql`
- `server/scripts/migrate.js`
- `server/src/index.js`
- `server/src/controllers/assessmentController.js`
- `server/src/controllers/clinicalReferenceCardController.js`
- `server/src/controllers/paymentController.js`
- `server/src/controllers/subscriptionController.js`
- `server/src/middleware/subscriptionAccess.js`
- `server/src/models/Institution.js`
- `server/src/models/Payment.js`
- `server/src/models/PaymentAttempt.js`
- `server/src/models/StudentSubscription.js`
- `server/src/models/SubscriptionEvent.js`
- `server/src/models/SubscriptionPlan.js`
- `server/src/routes/assignmentWorkflow.js`
- `server/src/routes/clinicalReferenceCards.js`
- `server/src/routes/simulationEngine.js`
- `server/src/routes/subscriptions.js`
- `server/src/services/paymentService.js`
- `server/src/services/subscriptionAccess.js`

Frontend:

- `client/src/components/admin/Institutions.jsx`
- `client/src/components/reference-cards/ClinicalReferenceCardsBrowser.jsx`
- `client/src/components/student/Assignments.jsx`
- `client/src/components/student/Payments.jsx`
- `client/src/components/student/Simulations.jsx`
- `client/src/components/student/SubscriptionPrompt.jsx`
- `client/src/components/superadmin/RevenueAnalytics.jsx`
- `client/src/services/api.js`

## Database migrations

Registered:

- `migration_007_subscription_refinement.sql`

This migration adds:

- `subscription_plans`
- `subscription_events`
- `payment_attempts`

It also seeds or updates:

- `student_monthly`
- `institution_annual`

No existing production payment, subscription, graphics, flashcard, or revenue tables were deleted or renamed.

## Payment changes

- Replaced hardcoded student subscription pricing with plan-driven pricing from `subscription_plans`.
- Preserved the live `/api/payments/mpesa/callback` route and layered plan verification around it.
- Added payment-attempt tracking for subscription renewals.
- Added duplicate-completion protection by avoiding repeated transition of already-completed pending transactions.
- Added amount verification, transaction-reference checks, and phone ownership checks for subscription activations.
- Preserved existing purchase and content-access behavior for non-subscription payment flows.
- Added subscription routes:
  - `GET /api/subscriptions/plans`
  - `PATCH /api/subscriptions/plans/:id`
  - `GET /api/subscriptions/student/current`
  - `POST /api/subscriptions/student/renew`
  - `GET /api/subscriptions/institution/current`
  - `POST /api/subscriptions/institution/renew`
  - `GET /api/subscriptions/admin/overview`

## Access control changes

- Added shared subscription middleware and resolver for premium student access.
- Applied premium subscription restrictions to:
  - `GET /api/clinical-reference-cards`
  - `GET /api/clinical-reference-cards/:id`
  - `GET /api/assignment-workflow/student/assignments`
  - `GET /api/assignment-workflow/student/assignments/:id`
  - `POST /api/assignment-workflow/student/assignments/:id/start`
  - `POST /api/assignment-workflow/student/assignments/:id/submit`
  - `GET /api/assignment-workflow/student/assignments/:id/results`
  - `POST /api/simulations/attempts`
  - `POST /api/simulations/attempts/:id/complete`
  - `GET /api/simulations/my-results`
  - `GET /api/simulations/my-results/latest`
- Updated assessment access checks to use the new shared subscription resolver.
- Updated frontend premium views to show renewal prompts using returned subscription metadata.

## Testing results

Frontend:

- `npm run build` completed successfully on July 23, 2026

Backend:

- `node --check` completed successfully for the Stage 11 backend files changed in this pass on July 23, 2026

Notes:

- An initial PowerShell loop-based syntax-check command was malformed by shell expansion and produced false `Cannot find module ... .FullName` errors.
- Validation was rerun directly against the changed backend files and passed.
- Frontend build completed successfully with an existing chunk-size warning only.

## Known limitations

- `migration_007_subscription_refinement.sql` was created and registered, but it was not applied to a live production database in this session.
- Reminder support is prepared through subscription reminder metadata and expiry-state resolution, but no background scheduler or outbound reminder job was deployed in this pass.
- The super admin subscription management experience was implemented by expanding the existing revenue view rather than creating a brand-new sidebar route.
- Existing non-subscription content purchases remain intact; Stage 11 focused on SaaS subscription refinement rather than replacing all legacy premium purchase flows.
- Frontend production build still reports a large chunk-size warning, which remains a performance optimization task rather than a build failure.
