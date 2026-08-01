import { Router } from 'express';
import {
  createTemplate,
  deleteTemplate,
  listHistory,
  listTemplates,
  scheduleCommunication,
  sendEmailCampaign,
  sendSmsCampaign,
  updateTemplate,
} from '../controllers/adminCommunicationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/templates', listTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

router.get('/history', listHistory);
router.post('/send-email', sendEmailCampaign);
router.post('/send-sms', sendSmsCampaign);
router.post('/schedule', scheduleCommunication);

export default router;
