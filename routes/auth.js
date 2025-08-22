const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const loginLimiter = require("../middleware/rateLimiter"); // import the middleware

const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../validations/userValidation");

// Register route
router.post("/register",loginLimiter, validate(registerSchema), authController.register);

// Login route with rate limiter
router.post("/login/sendOTP",loginLimiter, validate(loginSchema), authController.login);
router.post("/login/verifyOPT", authController.verifyOtpThenLogin);

// Forgot password
router.post("/forgot-password",loginLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

// Reset password
router.post("/reset-password",loginLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
