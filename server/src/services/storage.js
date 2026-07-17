// File storage abstraction — S3 in any real deployment, local disk in local dev.
//
// Local disk (server/uploads/*) is wiped on every redeploy on Railway (and
// most PaaS): the container filesystem is rebuilt from the image each time.
// Set AWS_S3_BUCKET (+ AWS_REGION and credentials) to switch every upload
// route below to S3 instead — no other code changes needed, `urlFor()` hides
// the difference. Leave AWS_S3_BUCKET unset to keep using local disk (fine
// for local development, NOT fine for production on Railway).
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const BUCKET = process.env.AWS_S3_BUCKET;
const REGION = process.env.AWS_REGION || 'us-east-1';
export const usingS3 = Boolean(BUCKET) && BUCKET !== 'your-bucket-name';

let s3Client = null;
let multerS3 = null;

if (usingS3) {
  // Lazy/dynamic import so `@aws-sdk/client-s3` and `multer-s3` are only
  // required to be installed/working when S3 is actually configured — local
  // dev without AWS credentials never touches this branch.
  const { S3Client } = await import('@aws-sdk/client-s3');
  ({ default: multerS3 } = await import('multer-s3'));
  s3Client = new S3Client({ region: REGION });
  logger.info(`File storage: S3 (bucket "${BUCKET}", region "${REGION}").`);
} else {
  logger.warn(
    'File storage: local disk (server/uploads/). Fine for local dev only — ' +
      'set AWS_S3_BUCKET before deploying, or uploads will be lost on every redeploy.'
  );
}

function randomFilename(originalName) {
  const ext = path.extname(originalName || '');
  return `${crypto.randomUUID()}${ext}`;
}

/** Public URL for an object key, via a CDN/custom domain in front of the bucket if set. */
function publicS3Url(key) {
  const base = process.env.AWS_S3_PUBLIC_URL || `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
  return `${base.replace(/\/$/, '')}/${key}`;
}

/**
 * Returns a configured multer instance for the given folder (e.g. "worksheets",
 * "videos"), plus a matching `urlFor(file)` to turn a multer file object into
 * the public URL to store in the database — regardless of which backend is active.
 */
export function createUploader(folder, multerOptions = {}) {
  if (usingS3) {
    const upload = multer({
      ...multerOptions,
      storage: multerS3({
        s3: s3Client,
        bucket: BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (_req, file, cb) => cb(null, `${folder}/${randomFilename(file.originalname)}`),
      }),
    });
    // file.location is multer-s3's own bucket-URL construction; prefer a
    // CDN/custom domain in front of the bucket (AWS_S3_PUBLIC_URL) when set.
    const urlFor = (file) => (file ? (process.env.AWS_S3_PUBLIC_URL ? publicS3Url(file.key) : file.location) : null);
    return { upload, urlFor };
  }

  const upload = multer({ ...multerOptions, dest: `uploads/${folder}/` });
  return { upload, urlFor: (file) => (file ? `/uploads/${folder}/${file.filename}` : null) };
}
