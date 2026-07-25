import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const useS3 =
  process.env.AWS_S3_BUCKET &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY;


let s3Client = null;


if (useS3) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  console.log('✅ File storage: AWS S3');
} else {
  console.log('⚠️ File storage: local fallback (AWS credentials missing)');
}


function cleanFilename(filename) {
  return filename
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .toLowerCase();
}


export function createUploader(folder = 'uploads', options = {}) {
  // Reserved for future per-uploader options. multer-s3's `contentType` must
  // be undefined or a function (e.g. multerS3.AUTO_CONTENT_TYPE) — it cannot
  // be a static string like 'application/pdf', or multer-s3 throws
  // "Expected opts.contentType to be undefined or function" on every upload.
  void options;

  let upload;


  if (useS3) {

    upload = multer({

      storage: multerS3({

        s3: s3Client,

        bucket: process.env.AWS_S3_BUCKET,

        contentType: multerS3.AUTO_CONTENT_TYPE,


        key: (req, file, cb) => {

          const filename =
            `${Date.now()}-${cleanFilename(file.originalname)}`;


          cb(
            null,
            `${folder}/${filename}`
          );

        },

      }),


      limits: {
        fileSize: 100 * 1024 * 1024
      }

    });


  } else {


    // Local storage fallback for development

    const diskStorage = multer.diskStorage({

      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },


      filename: (req, file, cb) => {

        const filename =
          `${Date.now()}-${cleanFilename(file.originalname)}`;

        cb(null, filename);

      }

    });


    upload = multer({

      storage: diskStorage,

      limits: {
        fileSize: 100 * 1024 * 1024
      }

    });

  }



  function urlFor(file) {

    if (!file) return null;


    if (useS3) {

      return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.key}`;

    }


    return `/uploads/${file.filename}`;

  }



  return {
    upload,
    urlFor
  };

}


/**
 * Extract the S3 object key from a stored file_url.
 *
 * file_url is saved in the DB as the bucket's own regional URL, e.g.
 * https://bucket-name.s3.region.amazonaws.com/clinical-reference-cards/file.pdf
 * (virtual-hosted style), or, less commonly, the path-style
 * https://s3.region.amazonaws.com/bucket-name/clinical-reference-cards/file.pdf.
 * Also tolerates AWS_S3_PUBLIC_URL (e.g. a CloudFront domain) fronting the bucket.
 * Returns null if the URL doesn't look like an S3 object URL (e.g. a local
 * "/uploads/..." fallback path) — callers should treat that as "not signable".
 */
export function extractS3Key(fileUrl) {
  if (!fileUrl) return null;

  try {
    const parsed = new URL(fileUrl);
    const bucket = process.env.AWS_S3_BUCKET;
    const publicBase = process.env.AWS_S3_PUBLIC_URL;

    if (publicBase) {
      try {
        const publicParsed = new URL(publicBase);
        if (parsed.host === publicParsed.host) {
          return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
        }
      } catch {
        // AWS_S3_PUBLIC_URL isn't a valid URL — ignore and fall through.
      }
    }

    // Virtual-hosted style: bucket-name.s3.region.amazonaws.com/key
    if (bucket && parsed.host.startsWith(`${bucket}.s3.`)) {
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    }

    // Path style: s3.region.amazonaws.com/bucket-name/key
    if (bucket && parsed.host.startsWith('s3.') && parsed.pathname.startsWith(`/${bucket}/`)) {
      return decodeURIComponent(parsed.pathname.replace(`/${bucket}/`, ''));
    }

    return null;
  } catch {
    // Not a parseable absolute URL (e.g. a local "/uploads/xyz.pdf" fallback path).
    return null;
  }
}

/**
 * Generate a temporary signed URL for a private S3 object referenced by a
 * stored file_url. Falls back to returning the original URL unchanged when
 * S3 isn't configured (local-disk dev fallback) or the URL isn't a
 * recognizable S3 object URL — those are already directly reachable.
 */
export async function getSignedPdfUrl(fileUrl, expiresIn = 3600) {
  if (!fileUrl) return null;
  if (!useS3) return fileUrl;

  const key = extractS3Key(fileUrl);
  if (!key) return fileUrl;

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}
