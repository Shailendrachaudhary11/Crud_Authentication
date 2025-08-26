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


  const posts = await Post.find()
    .populate("userId", "username usergmail")


  if (!posts) {
    logger.error("Error in getAllPosts: No posts found");
    return next(new AppError("Not get all posts", 404));
  }

  logger.info(`Fetched ${posts.length} posts successfully`);

  res.json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

// ====== GET POST BY ID =========
exports.getPostById = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    logger.warn(`post not found with id: ${req.params.id}`);
    return next(new AppError("post not found", 404));
  }
  res.json({ success: true, data: post });
  logger.info(`Fetched post by id: ${req.params.id}`);

  logger.error(`Invalid post by`);
  res.status(400).json({ success: false, message: "Invalid post Id" });
})

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



