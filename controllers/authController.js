// controllers/authController.js
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

exports.register = catchAsync(async (req, res, next) => {
  const { username, usergmail, password, role } = req.body;

  if (await User.findOne({ usergmail })) {
    logger.warn(`Registration failed: Email exists -> ${usergmail}`);
    return next(new AppError("User email already exists", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const profileImage = req.file ? req.file.filename : null; // file means image 
  console.log(req.file); 


  const user = new User({ username, usergmail, password: hashedPassword, role ,profileImage});
  await user.save();

  logger.info(`New user registered: ${usergmail} (role: ${role})`);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: usergmail,
    subject: "Welcome in SHAILENDRA CHAUDHARY app",
    html: `<h3>Your name is: ${username}</h3><p>Hi ${username}, welcome!</p><h4>Email: ${usergmail}</h4>`,
  });

  res.status(201).json({ success: true, message: "User registered successfully. Email sent." });
});

exports.login = catchAsync(async (req, res, next) => {
  const { usergmail, password } = req.body;
  const user = await User.findOne({ usergmail });
  if (!user) return next(new AppError("Invalid credentials", 400));

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new AppError("Invalid credentials", 400));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: usergmail,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. Expires in 5 minutes.`,
  });

  logger.info(`OTP sent to ${usergmail}`);
  res.json({ success: true, message: "OTP sent to email. Please verify." });
});

exports.verifyOtpThenLogin = catchAsync(async (req, res, next) => {
  const { usergmail, otp } = req.body;
  const user = await User.findOne({ usergmail });
  if (!user) return next(new AppError("User not found", 404));

  if (user.otp !== String(otp)) return next(new AppError("OTP invalid", 400));
  if (user.otpExpires < new Date()) return next(new AppError("OTP expired", 400));

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

  logger.info(`User logged in with OTP: ${usergmail}`);
  res.json({ success: true, message: "Login successful", token });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { usergmail } = req.body;
  const user = await User.findOne({ usergmail });
  if (!user) return next(new AppError("User not found", 404));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 2 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: usergmail,
    subject: "Password Reset OTP",
    text: `Your OTP is ${otp}. Do not share.`,
  });

  logger.info(`OTP sent to email: ${usergmail}`);
  res.json({ success: true, message: "OTP sent to email" });
});

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
