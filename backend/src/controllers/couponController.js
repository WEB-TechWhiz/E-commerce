 import Coupon from '../models/Coupon.js';

// Create a new coupon (admins only)
const createCoupon = async (req, res) => {
  try {
    const couponData = req.body;
    const coupon = await Coupon.create(couponData);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all coupons (admins only)
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Validate if a coupon code is valid (for users)
 const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired coupon' });
    }

    res.json({ valid: true, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply coupon discount calculation (for users)
 const applyCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired coupon' });
    }

    const discountAmount = coupon.calculateDiscount(amount);
    res.json({ discount: discountAmount, newTotal: amount - discountAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a coupon by ID (admins only)
const deleteCoupon = async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
     createCoupon,
     getCoupons,
     validateCoupon,
     applyCoupon,
     deleteCoupon,
}