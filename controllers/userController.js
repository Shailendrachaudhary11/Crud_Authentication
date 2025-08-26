const User = require("../models/user");
const logger = require('../config/logger'); // <--- logger import
const client = require("../redis/redisClient"); // Redis client

// centralized error
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');


// ====== GET ALL USERS ====== 
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const cacheKey = "users:all";
  const start = Date.now(); // start time

  // 1️⃣ Try fetch from Redis
  const cachedUsers = await client.get(cacheKey);
  if (cachedUsers) {
    const timeTaken = Date.now() - start;
    logger.info(`Fetched all users from Redis cache in ${timeTaken}ms`);

    return res.json({
      success: true,
      source: "cache",
      time: `${timeTaken}ms`,
      count: JSON.parse(cachedUsers).length,
      data: JSON.parse(cachedUsers),
    });
  }

  // 2️⃣ If cache miss → fetch from DB
  const users = await User.find()
    .select("-password -otpExpires -refreshToken -otp")
    .populate("posts");

  if (!users || users.length === 0) {
    logger.error("Error in getAllUsers: No users found");
    return next(new AppError("Not get all users", 404));
  }

  // 3️⃣ Store in Redis with TTL 60 seconds
  await client.setEx(cacheKey, 60, JSON.stringify(users));

  const timeTaken = Date.now() - start;
  logger.info(`Fetched all users from DB in ${timeTaken}ms`);

  res.json({
    success: true,
    source: "db",
    time: `${timeTaken}ms`,
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

  logger.info(`Fetched user by id: ${req.params.id}`);
  res.status(200).json({ success: true, data: user });

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
