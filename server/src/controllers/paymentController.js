import { Payment } from '../models/Payment.js';
import { Worksheet } from '../models/Worksheet.js';
import { FlashcardDeck } from '../models/FlashcardDeck.js';
import { MedicalGraphic } from '../models/MedicalGraphic.js';
import { ElibraryResource } from '../models/ElibraryResource.js';
import { Notification } from '../models/Notification.js';
import { StudentSubscription } from '../models/StudentSubscription.js';
import { Institution } from '../models/Institution.js';
import {
  stkPush,
  parseCallback,
  ACCESS_DURATION_HOURS,
  ASSESSMENT_SUBSCRIPTION_PRICE_KES,
  ASSESSMENT_SUBSCRIPTION_MONTHS,
} from '../services/paymentService.js';
import { asyncHandler } from '../utils/helpers.js';

const MODELS = { worksheet: Worksheet, flashcard_deck: FlashcardDeck, graphic: MedicalGraphic, elibrary_resource: ElibraryResource };
const ID_FIELD = { worksheet: 'worksheet_id', flashcard_deck: 'deck_id', graphic: 'graphic_id', elibrary_resource: 'resource_id' };

export const purchase = asyncHandler(async (req, res) => {
  const { itemType, itemId, phone } = req.body;
  if (!MODELS[itemType]) return res.status(400).json({ error: 'itemType must be worksheet, flashcard_deck, graphic, or elibrary_resource.' });

  const item = await MODELS[itemType].findById(itemId);
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  const alreadyUnlocked = await Payment.hasActiveAccess(req.user.sub, itemType, item[ID_FIELD[itemType]]);
  if (alreadyUnlocked) return res.status(409).json({ error: 'You already have access to this item.' });

  const stk = await stkPush({
    phone,
    amount: item.price,
    accountRef: item.title,
    description: `MedPro ${itemType}`,
  });

  const txn = await Payment.createPending({
    studentId: req.user.sub,
    institutionId: req.user.institutionId,
    itemType,
    itemId: item[ID_FIELD[itemType]],
    transactionType: itemType,
    amount: item.price,
    phone,
    mpesaCheckoutId: stk.checkoutRequestId,
  });

  // In local/dev mode without real Daraja credentials, auto-complete so the flow is testable end-to-end.
  if (stk.simulated) {
    await Payment.markCompleted(stk.checkoutRequestId, { mpesaCode: `SIM${Date.now().toString().slice(-8)}` });
    await Payment.grantAccess(req.user.sub, itemType, item[ID_FIELD[itemType]], ACCESS_DURATION_HOURS[itemType] || 48);
    await MODELS[itemType].incrementPurchases(item[ID_FIELD[itemType]]);
  }

  res.status(201).json({ transaction: txn, checkoutRequestId: stk.checkoutRequestId, simulated: !!stk.simulated });
});

export const mpesaCallback = asyncHandler(async (req, res) => {
  const result = parseCallback(req.body);
  // Always ack Safaricom with ResultCode 0 so they stop retrying, regardless of our internal handling.
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  if (!result) return;

  const txn = await Payment.findByCheckoutId(result.checkoutRequestId);
  if (!txn) return;

  if (result.success) {
    await Payment.markCompleted(result.checkoutRequestId, { mpesaCode: result.mpesaReceipt });
    if (txn.transaction_type === 'student_subscription') {
      await StudentSubscription.create({ studentId: txn.student_id, amount: txn.amount, months: ASSESSMENT_SUBSCRIPTION_MONTHS });
    } else {
      await Payment.grantAccess(txn.student_id, txn.item_type, txn.item_id, ACCESS_DURATION_HOURS[txn.item_type] || 48);
      if (MODELS[txn.item_type]) await MODELS[txn.item_type].incrementPurchases(txn.item_id);
    }
    await Notification.create({
      userId: txn.student_id,
      type: 'payment',
      title: 'Purchase confirmed',
      message: `Your payment of Ksh ${txn.amount} was successful.`,
    });
  } else {
    await Payment.markFailed(result.checkoutRequestId);
    await Notification.create({
      userId: txn.student_id,
      type: 'payment',
      title: 'Payment failed',
      message: result.resultDesc || 'Your M-Pesa payment could not be completed.',
    });
  }
});

export const paymentStatus = asyncHandler(async (req, res) => {
  const txn = await Payment.findByCheckoutId(req.params.checkoutId);
  if (!txn) return res.status(404).json({ error: 'Transaction not found.' });
  res.json({ status: txn.status, transaction: txn });
});

export const myPurchaseHistory = asyncHandler(async (req, res) => {
  const rows = await Payment.historyForStudent(req.user.sub);
  res.json({ transactions: rows });
});

// Whether this student can currently open assessments — either through their
// own Ksh 500/month subscription, or for free because their institution has
// an active site-license subscription.
export const subscriptionStatus = asyncHandler(async (req, res) => {
  const personal = await StudentSubscription.findActive(req.user.sub);
  if (personal) {
    return res.json({ active: true, source: 'personal', expiresAt: personal.expires_at, price: ASSESSMENT_SUBSCRIPTION_PRICE_KES });
  }
  const viaInstitution = await Institution.hasActiveSubscription(req.user.institutionId);
  if (viaInstitution) {
    return res.json({ active: true, source: 'institution', expiresAt: null, price: ASSESSMENT_SUBSCRIPTION_PRICE_KES });
  }
  res.json({ active: false, source: null, expiresAt: null, price: ASSESSMENT_SUBSCRIPTION_PRICE_KES });
});

export const subscribeToAssessments = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const amount = ASSESSMENT_SUBSCRIPTION_PRICE_KES;

  const stk = await stkPush({
    phone,
    amount,
    accountRef: 'MedPro Subscription',
    description: 'MedPro assessments',
  });

  const txn = await Payment.createPending({
    studentId: req.user.sub,
    institutionId: req.user.institutionId,
    itemType: 'subscription',
    itemId: null,
    transactionType: 'student_subscription',
    amount,
    phone,
    mpesaCheckoutId: stk.checkoutRequestId,
  });

  if (stk.simulated) {
    await Payment.markCompleted(stk.checkoutRequestId, { mpesaCode: `SIM${Date.now().toString().slice(-8)}` });
    await StudentSubscription.create({ studentId: req.user.sub, amount, months: ASSESSMENT_SUBSCRIPTION_MONTHS });
  }

  res.status(201).json({ transaction: txn, checkoutRequestId: stk.checkoutRequestId, simulated: !!stk.simulated });
});
