# MEDPROHUB IntaSend Debug Report

Date: July 23, 2026

## Root Cause

The production `401` on IntaSend checkout creation came from the integration layer in [server/src/services/intasendService.js](C:\Users\Frank\Desktop\medpro EMTs\server\src\services\intasendService.js).

Primary issues found:

- The checkout request used the wrong public-key header name.
  - Previous header: `X-IntaSend-Public-Key-API`
  - Corrected header: `X-IntaSend-Public-API-Key`

- The checkout request sent an `Authorization: Bearer ...` header during checkout creation.
  - This was removed from the checkout creation request.
  - The production checkout flow should use the IntaSend checkout endpoint with the correct public API key header.

- The production base URL handling was too loose.
  - The integration now resolves mode-aware API base URLs and trims env values safely.

- Environment variable formatting risk existed.
  - Added trimming for IntaSend env values to avoid whitespace-related auth failures in Railway variables.

## Files Changed

- [server/src/services/intasendService.js](C:\Users\Frank\Desktop\medpro EMTs\server\src\services\intasendService.js)

## Integration Fixes Applied

### 1. Endpoint handling

Added mode-aware endpoint resolution:

- Production default: `https://api.intasend.com/api/v1`
- Sandbox default: `https://sandbox.intasend.com/api/v1`

Checkout path used:

- `/checkout/`

### 2. Header correction

Removed the checkout request bearer authorization header and corrected the IntaSend public API key header.

Current request headers:

- `Content-Type: application/json`
- `X-IntaSend-Public-API-Key: <trimmed public key>`

### 3. Environment variable handling

Verified code expectations:

- `INTASEND_PUBLIC_KEY`
- `INTASEND_SECRET_KEY`
- `INTASEND_MODE`
- `INTASEND_BASE_URL`
- `INTASEND_REDIRECT_URL`
- `INTASEND_HOST_URL`
- `INTASEND_WEBHOOK_SECRET`

Safety improvements:

- Added `trimEnv()` to remove accidental whitespace from Railway environment variables
- Added explicit mode detection
- Added mode-aware endpoint selection

### 4. Safe debugging logs added

Added logs that do not expose secrets.

Logged fields:

```json
{
  "intasendConfigured": true,
  "hasPublicKey": true,
  "mode": "production",
  "endpoint": "https://api.intasend.com/api/v1/checkout/"
}
```

And request-shape validation logs:

```json
{
  "amount": 300,
  "currency": "KES",
  "hasEmail": true,
  "hasPhone": true,
  "referenceId": "student-sub-..."
}
```

Not logged:

- secret keys
- tokens
- raw credentials

### 5. Request payload validation

Before sending the request, the integration now logs presence of:

- amount
- currency
- email
- phone
- reference ID

This makes production debugging possible from Railway logs without leaking credentials.

## Verification Results

### Frontend

Command:

```powershell
npm run build
```

Result:

- PASS

Notes:

- Build completed successfully.
- Existing Vite chunk-size warning remains.

### Backend

Commands:

```powershell
node --check server/src/services/intasendService.js
node --check server/src/controllers/subscriptionController.js
```

Result:

- PASS
- PASS

## Remaining Steps For Production Payment Testing

1. In Railway, verify the production environment variables are present and correctly pasted:
   - `INTASEND_PUBLIC_KEY`
   - `INTASEND_SECRET_KEY`
   - `INTASEND_MODE=production`
   - optional custom `INTASEND_BASE_URL` only if intentionally overriding

2. Confirm the actual deployed values have no leading or trailing spaces.

3. Redeploy the service so the new IntaSend integration code is live.

4. Trigger one real student subscription payment attempt in production.

5. Inspect Railway logs for the new safe debug output:
   - `intasendConfigured`
   - `hasPublicKey`
   - `mode`
   - `endpoint`
   - `amount`
   - `currency`
   - `hasEmail`
   - `hasPhone`
   - `referenceId`

6. If IntaSend still rejects the request, compare the returned production response body against the current IntaSend checkout API requirements and confirm the specific account-level requirement being enforced.

7. After successful checkout creation, verify the webhook reaches:
   - `POST /api/payments/intasend/webhook`

## Remaining Risk

- This fix corrects the authentication and request-shape issues identified in the integration layer.
- Final production confirmation still depends on live IntaSend credentials, live merchant account configuration, and a real production checkout attempt.

## Final Status

Status: Debugging fix completed

Deployment:

- Not deployed

Stopped after report creation as requested.
