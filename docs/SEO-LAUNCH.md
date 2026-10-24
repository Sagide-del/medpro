# MedProHub search launch

Canonical website: https://www.medprohub.co.ke/

## Deploy and validate

From `client`, run `npm ci` and `npm run build`. Publish **dist**, not the source directory. The build pre-renders the public home page and creates noindex authentication shells. The included Vercel configuration routes `/login` and `/register` to those shells. Other static hosts should serve `login.html` for `/login` and `register.html` for `/register`, then use the SPA fallback for portal routes. Serve existing assets, robots.txt, and sitemap.xml before that fallback.

After deployment confirm:

- `/` returns 200 with the home page heading and clinical study copy in View Source, even without JavaScript.
- `/robots.txt` is plain text and `/sitemap.xml` is XML, both 200.
- `/login` and `/register` contain `noindex, follow` in View Source.
- The preferred canonical is `https://www.medprohub.co.ke/`; redirect HTTP and the non-www hostname to the equivalent HTTPS www URL using the host's domain settings.
- Login still calls the correct production API. Preserve the deployment's current `VITE_API_BASE_URL` and API routing.

The sitemap includes the homepage and the EMT, Paramedic, and Nursing revision pages. Account and authenticated portal pages are not acquisition landing pages. Robots rules are crawler guidance, not access control; server authentication remains required.

## Google Search Console ownership and submission

No Google Search Console integration or Google credentials are available in this coding environment. Submission has not been performed.

1. Open https://search.google.com/search-console using the Google account that should own the website.
2. Add a **Domain property** for `medprohub.co.ke`.
3. Copy Google's exact TXT record into the domain's DNS settings. Leave the existing records intact. Return to Search Console and verify ownership after DNS propagation.
4. Once the build is live and the checks above pass, submit `https://www.medprohub.co.ke/sitemap.xml` in **Sitemaps**.
5. Inspect `https://www.medprohub.co.ke/` in **URL Inspection**, test the live URL, and request indexing.
6. Monitor Page indexing and Performance. Submission requests crawling; Google controls indexing, timing, and ranking.

If DNS access is unavailable, use a URL-prefix property for `https://www.medprohub.co.ke/` and Google's HTML-file verification method. Place the exact supplied verification file in `client/public`, redeploy, then verify. Do not put Google passwords or account tokens into repository files.

## Content scope

The home page describes all three study tracks. Nursing is explicitly a starter fundamentals bank, not a full curriculum or licensing exam course. Accreditation, guaranteed exam results, testimonials, and invented usage statistics are not claimed. Keep future public topic pages useful and unique and include them in the sitemap when published.

## Maintaining the public acquisition pages

Edit `client/src/data/publicSeo.js` for the home page metadata and the EMT, Paramedic, and Nursing landing-page titles, descriptions, topic lists, and copy. The build pre-renders all four pages and generates the sitemap from this one configuration. Nursing begins with eight fundamentals questions in four modules, not a full licensing-exam course.

For Google URL-prefix HTML-tag verification, set the **public, non-secret** build variable `GOOGLE_SITE_VERIFICATION` to the exact token supplied by Google and redeploy. The build adds its meta tag to public and account HTML. Do not use a Google access token or password for this setting. After the deployed tag is visible in View Source, click Verify in your Google account, submit the sitemap, and request indexing for the four public URLs. An empty platform credential configuration cannot grant access to your Google property.

Validation: `npm --prefix client run build`, `node --test client/tests/seo.test.mjs`, and `node --test server/tests/nursing-pathway.test.mjs`. The bundled API startup migration creates the nursing modules and starter questions idempotently while retaining existing EMT and Paramedic content.

The owner-provided Google HTML verification file is installed at `client/public/google9c2cc643b1b10eac.html` and must remain accessible at `https://www.medprohub.co.ke/google9c2cc643b1b10eac.html`. Its exact contents are preserved. Use the HTML-file method in Search Console and click Verify after deployment. This file supports ownership verification; it does not authenticate this coding session to the Google account or submit the sitemap automatically.
