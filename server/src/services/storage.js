import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';

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


export function createUploader(folder = 'uploads') {

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