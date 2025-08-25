const Post = require("../models/Post");
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const logger = require("../config/logger");

// ====== CREATE POST ======
exports.createPost = catchAsync(async (req, res, next) => {
  const { postId, postTitle, postcontent, userId } = req.body;

  const existingPost = await Post.findOne({ postId });
  if (existingPost) {
    logger.warn(`Duplicate post creation attempt. postId: ${postId}`);
    return next(new AppError("Post with this id already exists", 400));
  }

  const post = await Post.create({ postId, postTitle, postcontent, userId });
  logger.info(`Post created successfully. postId: ${postId}`);

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    data: post,
  });
});

// ====== GET ALL POSTS ======
exports.getAllPosts = catchAsync(async (req, res, next) => {
  // Query Params: ?page=1&limit=10&sort=createdAt&userId=xyz
  const page = parseInt(req.query.page) || 1;   // default page = 1
  const limit = parseInt(req.query.limit) || 10; // default limit = 10
  const skip = (page - 1) * limit;

  // Filtering (e.g. ?userId=12345)
  const queryObj = { ...req.query };
  const excludedFields = ["page", "limit", "sort"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Sorting (e.g. ?sort=createdAt or ?sort=-createdAt)
  let sortBy = "";
  if (req.query.sort) {
    sortBy = req.query.sort.split(",").join(" ");
  } else {
    sortBy = "-createdAt"; // default sort (latest post first)
  }

  // Fetch posts with pagination, filtering & sorting
  const posts = await Post.find(queryObj)
    .populate("userId", "username usergmail")
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(queryObj);

  if (!posts) {
    logger.error("Error in getAllPosts: No posts found");
    return next(new AppError("Not get all posts", 404));
  }

  logger.info(`Fetched ${posts.length} posts successfully`);

  res.json({
    success: true,
    count: posts.length,
    totalPosts: total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: posts,
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



