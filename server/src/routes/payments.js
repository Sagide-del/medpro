import { Router } from 'express';
import {
  purchase,
  mpesaCallback,
  intasendWebhook,
  paymentStatus,
  myPurchaseHistory,
  subscriptionStatus,
  subscribeToAssessments,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.post('/purchase', authenticate, requireRole('student'), validate({ itemType: 'required', itemId: 'required', phone: 'required' }), purchase);
router.post('/mpesa/callback', mpesaCallback);
router.post('/intasend/webhook', intasendWebhook);
router.get('/status/:checkoutId', authenticate, paymentStatus);
router.get('/history', authenticate, requireRole('student'), myPurchaseHistory);

router.get('/subscription', authenticate, requireRole('student'), subscriptionStatus);
router.post('/subscribe', authenticate, requireRole('student'), validate({ phone: 'required' }), subscribeToAssessments);

export default router;
