// controllers/authController.js

const User = require("../models/user");       // User model import
const bcrypt = require("bcryptjs");           // Password hashing
const jwt = require("jsonwebtoken");          // JWT token generation and verification
const nodemailer = require("nodemailer");     // Email sending
const logger = require('../config/logger');   // Logger for info/warnings
const AppError = require('../utils/AppError'); // Custom error class
const catchAsync = require('../utils/catchAsync'); // Async error wrapper
const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer transporter setup for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});


// ======================= REGISTER USER =======================
exports.register = catchAsync(async (req, res, next) => {
  const { username, usergmail, password, role } = req.body;

  // Check if user already exists
  if (await User.findOne({ usergmail })) {
    logger.warn(`Registration failed: Email exists -> ${usergmail}`);
    return next(new AppError("User email already exists", 400));
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // If user uploaded profile image, use filename, else null
  const profileImage = req.file ? req.file.filename : null;

  // Create new user document
  const user = new User({ username, usergmail, password: hashedPassword, role, profileImage });
  await user.save();

  logger.info(`New user registered: ${usergmail} (role: ${role})`);

  // Send welcome email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: usergmail,
    subject: "Welcome in SHAILENDRA CHAUDHARY app",
    html: `<h3>Your name is: ${username}</h3><p>Hi ${username}, welcome!</p><h4>Email: ${usergmail}</h4>`,
  });

  res.status(201).json({ success: true, message: "User registered successfully. Email sent." });
});


// ======================= LOGIN (with OTP) =======================
exports.login = catchAsync(async (req, res, next) => {
  const { usergmail, password } = req.body;

  // Find user in DB
  const user = await User.findOne({ usergmail });
  if (!user) return next(new AppError("Invalid credentials", 400));

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new AppError("Invalid credentials", 400));
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1m",
  });

  // Generate refresh token (long expiry)
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  logger.info(`User logged in with OTP: ${usergmail}`);
  res.json({ success: true, message: "Login successful", token, refreshToken });

});




// ======================= LOGOUT =======================
exports.logout = catchAsync(async (req, res, next) => {
  const { usergmail } = req.body;

  // Find user
  const user = await User.findOne({ usergmail });
  if (!user) return next(new AppError("Invalid credentials", 400));

  // Check if already logged out
  if (!user.refreshToken) return next(new AppError("You are already logout."));

  // Remove refresh token from DB
  user.refreshToken = undefined;
  await user.save();

  logger.info(`Logout successful: ${usergmail}`);

  // Optional: clear cookie if using cookies for refresh token
  res.clearCookie("refreshToken");

  res.json({ success: true, message: "Logout successful" });
});



// ======================= FORGOT PASSWORD (Send OTP via Email + Phone) =======================
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { usergmail, phoneNumber } = req.body; // Accept phone number too

  // Find user
  const user = await User.findOne({ usergmail });
  if (!user) return next(new AppError("User not found", 404));

  // Generate OTP for password reset
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 min expiry
  await user.save();

  // Send OTP via Email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: usergmail,
    subject: "Password Reset OTP",
    text: `Your OTP is ${otp}. Do not share.`,
  });

  // Send OTP via SMS using Twilio
  if (phoneNumber) {
    await client.messages.create({
      body: `Your password reset OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
  }

  logger.info(`OTP sent to email: ${usergmail} and phone: ${phoneNumber || 'N/A'}`);
  res.json({ success: true, message: "OTP sent to email and phone if provided." });
});


// ======================= RESET PASSWORD =======================


exports.resetPassword = catchAsync(async (req, res, next) => {
  const { usergmail, otp, newPassword } = req.body;

  const user = await User.findOne({ usergmail });
  if (!user) return next(new AppError("User not found", 404));

  if (user.otp !== otp) return next(new AppError("OTP invalid", 400));
  if (Date.now() > user.otpExpires) return next(new AppError("OTP expired", 400));

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save();

  logger.info(`Password reset successful: ${usergmail}`);
  res.json({ success: true, message: "Password reset successfully" });
});
