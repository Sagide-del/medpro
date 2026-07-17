import { ElibraryResource } from '../models/ElibraryResource.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/helpers.js';


/**
 * Student/public library listing
 * Shows only published resources
 */
export const listResources = asyncHandler(async (req, res) => {

  const isAdmin = req.user?.role === 'super_admin';

  const rows = await ElibraryResource.list({

    status: isAdmin && req.query.status
      ? req.query.status
      : 'published',

    category: req.query.category,

    resourceType: req.query.resourceType,

    search: req.query.search

  });


  res.json({
    resources: rows
  });

});



/**
 * Get single resource
 */
export const getResource = asyncHandler(async (req,res)=>{


  const resource = await ElibraryResource.findById(req.params.id);


  if(!resource){

    return res.status(404).json({
      error:'Resource not found.'
    });

  }


  const free = Number(resource.price) <= 0;


  let unlocked =
    free ||
    req.user?.role !== 'student';



  if(!unlocked && req.user?.role === 'student'){

    unlocked =
      await Payment.hasActiveAccess(
        req.user.sub,
        'elibrary_resource',
        resource.resource_id
      );

  }



  res.json({

    resource: unlocked
      ? resource
      : {
          ...resource,
          file_url:null
        },

    unlocked

  });


});



/**
 * Super Admin creates resource
 */
export const createResource = asyncHandler(async(req,res)=>{


  if(!req.body.title){

    return res.status(400).json({
      error:'Title is required.'
    });

  }


  const resource =
    await ElibraryResource.create({

      ...req.body,

      uploadedBy:req.user.sub

    });



  res.status(201).json({
    resource
  });


});



/**
 * Super Admin edits resource metadata
 */
export const updateResource = asyncHandler(async(req,res)=>{


  const resource =
    await ElibraryResource.update(
      req.params.id,
      req.body
    );


  if(!resource){

    return res.status(404).json({
      error:'Resource not found.'
    });

  }


  res.json({
    resource
  });


});



/**
 * Upload PDF and thumbnail
 */
export const setResourceFiles = asyncHandler(async(req,res)=>{


  const resource =
    await ElibraryResource.setFiles(
      req.params.id,
      req.body
    );


  res.json({
    resource
  });


});



/**
 * Publish resource
 */
export const publishResource = asyncHandler(async(req,res)=>{


  const resource =
    await ElibraryResource.setStatus(
      req.params.id,
      'published'
    );


  res.json({
    resource
  });


});



/**
 * Move back to draft
 */
export const unpublishResource = asyncHandler(async(req,res)=>{


  const resource =
    await ElibraryResource.setStatus(
      req.params.id,
      'draft'
    );


  res.json({
    resource
  });


});



/**
 * Delete resource
 */
export const deleteResource = asyncHandler(async(req,res)=>{


  await ElibraryResource.delete(
    req.params.id
  );


  res.status(204).end();


});



/**
 * Student free download
 */
export const downloadFreeResource =
asyncHandler(async(req,res)=>{


  const resource =
    await ElibraryResource.findById(
      req.params.id
    );


  if(!resource){

    return res.status(404).json({
      error:'Resource not found.'
    });

  }



  if(Number(resource.price)>0){

    return res.status(403).json({
      error:'This resource requires purchase.'
    });

  }



  await ElibraryResource.incrementDownloads(
    resource.resource_id
  );


  res.json({
    resource
  });


});