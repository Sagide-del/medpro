# Deploying MedPro to Railway

This sets up three Railway services in one project — a managed Postgres, the
API (`server/`), and the static client (`client/`) — plus S3 for file
uploads, since Railway's own container disk is wiped on every redeploy.

## 1. Create the project and Postgres

1. [railway.com/new](https://railway.com/new) → **Empty Project**.
2. `+ Create` → **Database** → **Add PostgreSQL**. Railway provisions it and
   exposes `DATABASE_URL`, `PGHOST`, `PGPORT`, etc. for other services in the
   project to reference — you never type the connection string by hand.

## 2. Create the `api` service

1. `+ Create` → **GitHub Repo** → select this repo. Name the service `api`.
2. Service **Settings**:
   - **Root Directory**: `server`
   - **Config File Path**: `server/railway.json` (Railway's config-as-code
     file doesn't follow Root Directory, so this needs the full repo-relative
     path — this file already sets the Dockerfile builder and a health check
     at `/api/test`)
   - Railway detects `server/Dockerfile` automatically once Root Directory is set.
3. Service **Variables** — add each of these (values from `server/.env.example`
   unless noted):
   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DB_SSL=true
   CLIENT_ORIGIN=https://${{client.RAILWAY_PUBLIC_DOMAIN}}
   JWT_SECRET=<generate a long random string>
   JWT_EXPIRES_IN=12h
   MPESA_ENV=sandbox            # switch to "production" once Safaricom approves go-live
   MPESA_CONSUMER_KEY=...
   MPESA_CONSUMER_SECRET=...
   MPESA_SHORTCODE=...
   MPESA_PASSKEY=...
   MPESA_CALLBACK_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api/payments/mpesa/callback
   AT_API_KEY=...
   AT_USERNAME=...
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_ID=...
   LOG_LEVEL=info
   ```
   The `${{Postgres.DATABASE_URL}}` and `${{client.RAILWAY_PUBLIC_DOMAIN}}` values
   are [Railway reference variables](https://docs.railway.com/variables#referencing-another-services-variable) —
   they auto-update if the referenced service's domain or credentials ever change,
   so you don't hand-copy them.
4. Add the S3 variables (step 4 below) before the first real deploy.
5. Click **Deploy**.

## 3. Create the `client` service

1. `+ Create` → **GitHub Repo** → same repo again. Name it `client`.
2. Service **Settings**:
   - **Root Directory**: `client`
   - **Config File Path**: `client/railway.json`
3. Service **Settings → Networking**: click **Generate Domain** on `api`
   *first*, then come back and add this build variable to `client`:
   ```
   VITE_API_BASE_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api
   ```
   This is a **build-time** value — Vite bakes it into the JS bundle, so it
   must be set before `client`'s first (or next) deploy, not after.
4. Click **Deploy**, then **Generate Domain** for `client` too.
5. Go back to `api`'s variables and confirm `CLIENT_ORIGIN` resolves to the
   real `client` domain (it will, via the reference variable) — then redeploy
   `api` once so CORS picks it up.

## 4. File uploads: S3

Local disk (`server/uploads/`) does not survive a Railway redeploy, so uploads
go to S3 instead — scales past a single container and has no realistic size cap
(the videos route alone allows up to 200MB per file, well past what a Railway
Volume's free-tier 0.5GB would hold).

1. Create an S3 bucket (any AWS region — `eu-west-1`/`af-south-1` if you want
   it closer to Kenya, but region doesn't affect functionality).
2. Bucket → **Permissions**: allow public read on objects (this is what makes
   worksheets/graphics/videos/elibrary/logbook/research files viewable via a
   direct URL, matching how the app already serves `/uploads` locally), or put
   CloudFront in front of it and keep the bucket private.
3. Create an IAM user scoped to just this bucket, with a policy granting
   `s3:PutObject` and `s3:GetObject` on `arn:aws:s3:::your-bucket-name/*`.
   Generate an access key for it.
4. Add to the `api` service's **Variables**:
   ```
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_PUBLIC_URL=          # optional CloudFront domain; leave blank to use the bucket's own URL
   ```
   `server/src/services/storage.js` switches every upload route (worksheets,
   videos, graphics, elibrary, logbook, research) to S3 the moment
   `AWS_S3_BUCKET` is set — no other code changes needed, and nothing is
   written to the container's local disk once this is configured.
5. Deploy/redeploy `api`, then upload a test file as `super_admin` from the
   client and confirm the returned URL points at your bucket (or CloudFront
   domain) rather than `/uploads/...`.

(If you'd rather not set up AWS at all for a first test deploy, `api` →
**Settings → Volumes → Add Volume** mounted at `/app/uploads` works as a
fallback — but it's capped at 0.5GB on Free/Trial plans and doesn't survive
redeploys as cleanly, so treat it as temporary.)

## 5. Set up the database (one time)

Railway doesn't auto-run SQL migrations for you. From your machine, with the
[Railway CLI](https://docs.railway.com/guides/cli) installed and linked
(`railway login`, `railway link`):

```bash
cd server
npm install
railway run npm run migrate            # schema + all 3 migrations
# or, to also load demo accounts/content:
railway run npm run migrate -- --seed
```

This runs `server/scripts/migrate.js` locally with Railway's `DATABASE_URL`
(and `DB_SSL`) injected — no `psql` install required, which matters most if
you're deploying from Windows. See `README.md` → "Deploying to production"
for why the files must run in that exact order.

## 6. Verify

- `https://<api-domain>/api/test` should return the MedPro API health JSON.
- `https://<client-domain>/` should load the app and be able to log in with
  a seeded demo account (if you ran `--seed`).
- Log in as `super_admin`, upload a worksheet/graphic file, and confirm its
  URL points at your S3 bucket (or CloudFront domain).

## Notes

- **Costs**: `api` + `client` + Postgres is 3 Railway services. S3 is billed
  separately by AWS — pennies a month at this scale (a few GB of PDFs/images
  and occasional 200MB videos) — and avoids Railway's per-GB volume pricing
  and the 0.5GB/5GB volume size caps entirely.
- **Custom domain**: add it under either service's Settings → Networking →
  Custom Domain, per [Railway's guide](https://docs.railway.com/guides/static-hosting#configure-a-custom-domain).
  If you point a custom domain at `client`, update `MPESA_CALLBACK_URL` and
  `CLIENT_ORIGIN` on `api` to match (Daraja needs a stable public HTTPS URL
  for the callback).
- **Redeploys**: pushing to your connected branch redeploys both services
  automatically; the database is untouched unless you re-run `npm run migrate`.
