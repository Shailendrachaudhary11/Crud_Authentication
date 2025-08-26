const Post = require("../models/Post");
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const logger = require("../config/logger");
const client = require("../redis/redisClient");

// ====== CREATE POST ======
exports.createPost = catchAsync(async (req, res, next) => {
  const { postId, postTitle, postcontent, userId } = req.body;
  logger.info(`Create post request received. postId: ${postId}, userId: ${userId}`);

  // Check for duplicate post
  const existingPost = await Post.findOne({ postId });
  if (existingPost) {
    logger.warn(`Duplicate post creation attempt. postId: ${postId}, userId: ${userId}`);
    return next(new AppError("Post with this id already exists", 400));
  }

  // Create new post
  const post = await Post.create({ postId, postTitle, postcontent, userId });
  logger.info(`Post created successfully. postId: ${postId}, userId: ${userId}`);

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    data: post,
  });
});


// ====== GET ALL POSTS ======
exports.getAllPosts = catchAsync(async (req, res, next) => {
  logger.info("Request received: Get all posts");

  const cacheKey = "posts:all";  // ✅ corrected variable name
  const start = Date.now();

  // 1️⃣ Check Redis cache
  const cachedPosts = await client.get(cacheKey);
  if (cachedPosts) {
    const timeTaken = Date.now() - start;
    logger.info(`Fetched all posts from Redis cache in ${timeTaken}ms`);

    return res.json({
      success: true,
      source: "cache",
      time: `${timeTaken}ms`,
      count: JSON.parse(cachedPosts).length,
      data: JSON.parse(cachedPosts),
    });
  }

  // 2️⃣ Fetch from DB
  const posts = await Post.find().populate("userId", "username usergmail");

  if (!posts || posts.length === 0) {
    logger.warn("No posts found in database");
    return next(new AppError("No posts found", 404));
  }

  // 3️⃣ Store in Redis with TTL 60 seconds
  await client.setEx(cacheKey, 60, JSON.stringify(posts));

  const timeTaken = Date.now() - start;
  logger.info(`Fetched all posts from DB in ${timeTaken}ms`);

  // 4️⃣ Send response
  res.json({
    success: true,
    source: "db",
    time: `${timeTaken}ms`,
    count: posts.length,
    data: posts,
  });
});


// ====== GET POST BY ID =========
exports.getPostById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `post:${id}`;
  const start = Date.now();

  // 1️⃣ Check Redis cache
  const cachedPost = await client.get(cacheKey);
  if (cachedPost) {
    const timeTaken = Date.now() - start;
    logger.info(`Fetched post by id ${id} from Redis cache in ${timeTaken}ms`);
    return res.status(200).json({
      success: true,
      data: JSON.parse(cachedPost),
      source: "cache",
      time: `${timeTaken}ms`
    });
  }

  // 2️⃣ Fetch from DB
  const post = await Post.findById(id).populate("userId", "username usergmail").lean();
  if (!post) {
    logger.warn(`Post not found with id: ${id}`);
    return next(new AppError("Post not found", 404));
  }

  // 3️⃣ Store in Redis with TTL 60 seconds
  await client.setEx(cacheKey, 60, JSON.stringify(post));

  const timeTaken = Date.now() - start;
  logger.info(`Fetched post by id ${id} from DB in ${timeTaken}ms`);

  // 4️⃣ Send response
  res.status(200).json({
    success: true,
    data: post,
    source: "db",
    time: `${timeTaken}ms`
  });
});


// ====== UPDATE POST ======
exports.updatePost = catchAsync(async (req, res, next) => {
  const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedPost) {
    logger.warn(`Post not found for update. id: ${req.params.id}`);
    return next(new AppError("Post not found", 404));
  }

  logger.info(`Post updated successfully. id: ${req.params.id}`);
  res.json({
    success: true,
    message: "Post updated successfully",
    data: updatedPost,
  });
});

// ====== DELETE POST ======
exports.deletePost = catchAsync(async (req, res, next) => {
  const deletedPost = await Post.findByIdAndDelete(req.params.id);

  if (!deletedPost) {
    logger.warn(`Post not found for deletion. id: ${req.params.id}`);
    return next(new AppError("Post not found", 404));
  }

  logger.info(`Post deleted successfully. id: ${req.params.id}`);
  res.json({
    success: true,
    message: "Post deleted successfully",
    data: { deletedPostId: req.params.id },
  });
});

// ====== DELETE ALL POST ======
exports.deleteAllPost = catchAsync(async (req, res, next) => {
  const result = await Post.deleteMany({});
  if (!result) {
    logger.warn(`something went wrong to delete post`);
    return next(new AppError("Some went wrong to delete post"))
  }

  logger.info(`All post deleted`);
  res.status(200).json({
    success: true,
    message: "All Post deleted"
  })

})



