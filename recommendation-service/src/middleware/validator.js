import { body, param, query, validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

const trackInteractionValidation = [
  body('userId').notEmpty().isMongoId(),
  body('productId').notEmpty().isMongoId(),
  body('interactionType')
    .notEmpty()
    .isIn(['view', 'click', 'add_to_cart', 'purchase', 'wishlist', 'review', 'search']),
  validate,
];

const userIdValidation = [
  param('userId').notEmpty().isMongoId(),
  validate,
];

const productIdValidation = [
  param('productId').notEmpty().isMongoId(),
  validate,
];

export {
  validate,
  trackInteractionValidation,
  userIdValidation,
  productIdValidation,
};
