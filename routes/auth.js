const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const authorize = require('../middleware/roleMiddleware');   // role based access
const authenticate = require('../middleware/authMiddleware'); // check JWT
const loginLimiter = require("../middleware/rateLimiter"); // import the middleware
const upload = require("../middleware/upload"); // upload profile image of a user

const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../validations/userValidation");

// Register route
router.post("/register",loginLimiter, upload.fields([{name:"profileImage",maxCount:1},{name:"filePath",maxCount:1}]), validate(registerSchema), authController.register);

// Login route with rate limiter
router.post("/login",loginLimiter, validate(loginSchema), authController.login);

// get Profile image of user using UserId (_id)
router.get("/profileImage/:id",authenticate,authorize('admin'),authController.getProfileImage)

// get fileData from userId
router.get("/fileData/:id",authenticate, authorize("admin"), authController.getFileData);

// logout
router.post("/logout",loginLimiter,authController.logout);


// Forgot password
router.post("/forgot-password",loginLimiter, authController.forgotPassword);

// Reset password
router.post("/reset-password",loginLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
