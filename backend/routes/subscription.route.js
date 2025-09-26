import express from 'express';
import {
  createSubscription,
  handleWebhook,
  getSubscriptionStatus,
  cancelSubscription,
  syncSubscription,
  verifyPaymentSuccess
} from '../controllers/subscription.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

router.post('/create', isAuthenticated, createSubscription);
router.get('/status', isAuthenticated, getSubscriptionStatus);
router.post('/cancel', isAuthenticated, cancelSubscription);
router.post('/sync', isAuthenticated, syncSubscription);
router.get('/verify-payment', isAuthenticated, verifyPaymentSuccess);
router.post('/webhook', handleWebhook);

export default router;