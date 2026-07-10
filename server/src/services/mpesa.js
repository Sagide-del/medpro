// Backward-compatible re-export — use services/paymentService.js for new code.
export { stkPush, parseCallback, ACCESS_DURATION_HOURS } from './paymentService.js';
export { normalizePhone } from '../utils/helpers.js';
