import express from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const couponController = {
  useCoupon: async (req, res) => {
    res.json({ success: true, data: {} });
  },
  getActiveCoupons: async (req, res) => {
    res.json({ success: true, data: { coupons: [] } });
  },
  getCouponDetails: async (req, res) => {
    res.json({ success: true, data: {} });
  }
};

router.post('/use', authenticate, asyncHandler(couponController.useCoupon));
router.get('/active', asyncHandler(couponController.getActiveCoupons));
router.get('/:code', asyncHandler(couponController.getCouponDetails));

export default router;
