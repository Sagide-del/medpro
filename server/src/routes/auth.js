import { Router } from 'express';
import { login, register, me, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.post('/login', validate({ email: ['required', 'email'], password: 'required' }), login);
router.post('/register', validate({ fullName: 'required', email: ['required', 'email'], password: 'required' }), register);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

export default router;
