import express from 'express';
import { manualVerifyUser, refreshUserData } from '../controllers/dev.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

// Development-only routes
router.post('/manual-verify', isAuthenticated, manualVerifyUser);
router.get('/refresh-user', isAuthenticated, refreshUserData);

export default router;