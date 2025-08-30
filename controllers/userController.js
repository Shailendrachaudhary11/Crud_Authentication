const User = require("../models/user");
const logger = require('../config/logger'); // <--- logger import
const client = require("../redis/redisClient"); // Redis client

// centralized error
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');


// ====== GET ALL USERS WITH CACHE====== 
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
  await client.setEx(cacheKey, process.env.REDIS_TTL, JSON.stringify(users));

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


// ====== GET USER BY ID WITH CACHE======
exports.getUserById = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const cacheKey = `user:${userId}`;
  const start = Date.now();

  // 1️⃣ Try to get user from Redis cache
  const cachedUser = await client.get(cacheKey);
  if (cachedUser) {
    const timeTaken = Date.now() - start;
    logger.info(`Fetched user by id ${userId} from Redis cache in ${timeTaken}ms`);
    return res.status(200).json({
      success: true,
      source: "cache",
      time: `${timeTaken}ms`,
      data: JSON.parse(cachedUser),
    });
  }

  // 2️⃣ If not found in cache, get from MongoDB
  const user = await User.findById(userId).select("-password").populate("posts").lean();
  if (!user) {
    logger.warn(`User not found: ${userId}`);
    return next(new AppError("User not found", 404));
  }

  // 3️⃣ Store user in Redis )
  await client.setEx(cacheKey, process.env.REDIS_TTL, JSON.stringify(user));

  const timeTaken = Date.now() - start;
  logger.info(`Fetched user by id ${userId} from DB in ${timeTaken}ms`);

  // 4️⃣ Send response
  res.status(200).json({
    success: true,
    source: "db",
    time: `${timeTaken}ms`,
    data: user,
  });
});


// ======= GET USER BY USER GMAIL WITH CACHE==============
exports.getUserByUserGmail = catchAsync(async (req, res, next) => {
  const usergmail = req.params.usergmail;
  const cacheKey = `user:${usergmail}`;
  const start = Date.now();

  // 1️⃣ Try to get user from Redis cache
  const cachedUser = await client.get(cacheKey);
  if (cachedUser) {
    const timeTaken = Date.now() - start;
    logger.info(`Fetched user by gmail ${usergmail} from Redis cache in ${timeTaken}ms`);
    return res.status(200).json({
      success: true,
      source: "cache",
      time: `${timeTaken}ms`,
      data: JSON.parse(cachedUser),
    });
  }

  // 2️⃣ If not found in cache, get from MongoDB
  const user = await User.findOne({ gmail: usergmail })
    .select("-password")
    .populate("posts")
    .lean();

  if (!user) {
    logger.warn(`User not found: ${usergmail}`);
    return next(new AppError("User not found", 404));
  }

  // 3️⃣ Store user in Redis
  await client.setEx(cacheKey, process.env.REDIS_TTL, JSON.stringify(user));

  const timeTaken = Date.now() - start;
  logger.info(`Fetched user by gmail ${usergmail} from DB in ${timeTaken}ms`);

  // 4️⃣ Send response
  res.status(200).json({
    success: true,
    source: "db",
    time: `${timeTaken}ms`,
    data: user,
  });
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

  // ❌ Invalidate cache (this user + all users list)
  await client.del(`user:${userId}`);
  await client.del("users:all");

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

  // ❌ Invalidate cache (this user + all users list)
  await client.del(`user:${userId}`);
  await client.del("users:all");

  res.json({ success: true, message: "User deleted successfully" });
});
