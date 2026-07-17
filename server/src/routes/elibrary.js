import { Router } from 'express';

import {
  listResources,
  getResource,
  createResource,
  updateResource,
  setResourceFiles,
  publishResource,
  unpublishResource,
  deleteResource,
  downloadFreeResource

} from '../controllers/elibraryController.js';


import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { createUploader } from '../services/storage.js';
import { ElibraryResource } from '../models/ElibraryResource.js';


const router = Router();


const { upload, urlFor } =
createUploader('elibrary');



/*
PUBLIC/STUDENT
*/

router.get(
  '/',
  optionalAuth,
  listResources
);


router.get(
  '/:id',
  optionalAuth,
  getResource
);



/*
SUPER ADMIN
*/


router.post(
  '/',
  authenticate,
  requireRole('super_admin'),
  createResource
);



router.patch(
  '/:id',
  authenticate,
  requireRole('super_admin'),
  updateResource
);



router.patch(
  '/:id/publish',
  authenticate,
  requireRole('super_admin'),
  publishResource
);



router.patch(
  '/:id/unpublish',
  authenticate,
  requireRole('super_admin'),
  unpublishResource
);



router.delete(
  '/:id',
  authenticate,
  requireRole('super_admin'),
  deleteResource
);



/*
PDF UPLOAD
*/

router.post(

  '/:id/files',

  authenticate,

  requireRole('super_admin'),

  upload.fields([
    {
      name:'file',
      maxCount:1
    },
    {
      name:'thumbnail',
      maxCount:1
    }
  ]),


  async(req,res)=>{


    const fileUrl =
      urlFor(
        req.files?.file?.[0]
      );


    const thumbnailUrl =
      urlFor(
        req.files?.thumbnail?.[0]
      );



    const resource =
      await ElibraryResource.setFiles(
        req.params.id,
        {
          fileUrl,
          thumbnailUrl
        }
      );


    res.json({
      resource
    });


  }

);



router.post(
  '/:id/download',
  authenticate,
  requireRole('student'),
  downloadFreeResource
);



export default router;