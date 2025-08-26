const User = require("../models/user");
const logger = require('../config/logger'); // <--- logger import

// centralized error
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');


// ====== GET ALL USERS ====== 
exports.getAllUsers = catchAsync(async (req, res, next) => {

  const users = await User.find()
    .select("-password -otpExpires -refreshToken -otp")
    .populate("posts")

  if (!users) {
    logger.error("Error in getAllUsers: No users found");
    return next(new AppError("Not get all users", 404));
  }

  logger.info("Fetched all users successfully");

  res.json({
    success: true,
    count: users.length,
    data: users,
  });
});


// ====== GET USER BY ID ======
exports.getUserById = catchAsync(async (req, res) => {

  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    logger.warn(`User not found: ${req.params.id}`);
    return next(new AppError("User not found", 404))
  }

  res.json({ success: true, data: user });
  logger.info(`Fetched user by id: ${req.params.id}`);

  logger.error(`Invalid user ID: ${req.params.id} - ${error.message}`);
  res.status(400).json({ success: false, message: "Invalid user ID" });
});


// ====== UPDATE USER BY ID ======
exports.updateById = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    logger.warn(`User not found for update: ${req.params.id}`);
    return next(new AppError("User not found", 404));
  }

  logger.info(`User updated: ${req.params.id}`);
  res.json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});


// ====== DELETE USER BY ID ======
exports.deleteUserById = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    logger.warn(`User not found for delete: ${req.params.id}`);
    return next(new AppError("User not found", 404));
  }

  logger.info(`User deleted: ${req.params.id}`);
  res.json({ success: true, message: "User deleted successfully" });
});
