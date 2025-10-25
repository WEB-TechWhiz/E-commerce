import express from 'express';
const router = express.Router();

import authController from "../controllers/authController.js"
import {protect} from "../middleware/auth.js"

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

export default  router;
