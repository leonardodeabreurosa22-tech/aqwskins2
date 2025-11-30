import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { lootboxRateLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import lootboxController from '../controllers/lootbox.controller.js';

const router = express.Router();

/**
 * @route   GET /api/v1/lootboxes
 * @desc    Get all active lootboxes
 * @access  Public
 */
router.get('/', asyncHandler(lootboxController.getAllLootboxes));

/**
 * @route   GET /api/v1/lootboxes/live-drops
 * @desc    Get recent lootbox openings (live drops)
 * @access  Public
 */
router.get('/live-drops', asyncHandler(lootboxController.getLiveDrops));

/**
 * @route   GET /api/v1/lootboxes/:id
 * @desc    Get lootbox details
 * @access  Public
 */
router.get('/:id', asyncHandler(lootboxController.getLootboxDetails));

/**
 * @route   POST /api/v1/lootboxes/:id/open
 * @desc    Open a lootbox
 * @access  Private
 */
router.post(
  '/:id/open',
  authenticate,
  lootboxRateLimiter,
  asyncHandler(lootboxController.openLootbox)
);

/**
 * @route   GET /api/v1/lootboxes/openings/history
 * @desc    Get user's opening history
 * @access  Private
 */
router.get(
  '/openings/history',
  authenticate,
  asyncHandler(lootboxController.getOpeningHistory)
);

export default router;
