import express from 'express';
import { manualVerifyUser, refreshUserData, simulateWebhookCompletion, clearStripeData } from '../controllers/dev.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

// Development-only routes
router.post('/manual-verify', isAuthenticated, manualVerifyUser);
router.post('/simulate-webhook', isAuthenticated, simulateWebhookCompletion);
router.post('/clear-stripe', isAuthenticated, clearStripeData);
router.get('/refresh-user', isAuthenticated, refreshUserData);

export default router;