const Post = require("../models/Post");
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const logger = require("../config/logger");
const client = require("../redis/redisClient");
const Comment = require("../models/comments")

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

  // ❌ invalidate "all posts" cache
  await client.del("posts:all");

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    data: post,
  });
});

// ====== GET ALL POSTS WITH REDIS======
exports.getAllPosts = catchAsync(async (req, res, next) => {
  logger.info("Request received: Get all posts with pagination and search");

  // ✅ Pagination & search params
  let { page, limit, search } = req.query;
  page = parseInt(page) || 1;    // default page = 1
  limit = parseInt(limit) || 10; // default limit = 10
  const skip = (page - 1) * limit;

  const cacheKey = `posts:all:${page}:${limit}:${search || ""}`; // cache key me page, limit aur search add
  const start = Date.now();

  // 1️⃣ Try Redis cache
  const cachedPosts = await client.get(cacheKey);
  if (cachedPosts) {
    const timeTaken = Date.now() - start;
    logger.info(`Fetched posts from Redis cache in ${timeTaken}ms`);
    const data = JSON.parse(cachedPosts);
    return res.json({
      success: true,
      source: "cache",
      time: `${timeTaken}ms`,
      page,
      limit,
      totalPages: data.totalPages,
      totalPosts: data.totalPosts,
      data: data.posts,
    });
  }

  // 2️⃣ Build MongoDB query
  const query = search ? { postTitle: { $regex: search, $options: "i" } } : {};

  // 3️⃣ Fetch posts from DB with pagination
  const posts = await Post.find(query)
    .populate("userId", "username usergmail")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalPosts = await Post.countDocuments(query);
  const totalPages = Math.ceil(totalPosts / limit);

  if (!posts || posts.length === 0) {
    logger.warn("No posts found in database");
    return next(new AppError("No posts found", 404));
  }

  // 4️⃣ Store in Redis with TTL
  const ttl = Number(process.env.REDIS_TTL) || 60;
  await client.setEx(
    cacheKey,
    ttl,
    JSON.stringify({ posts, totalPosts, totalPages })
  );

  const timeTaken = Date.now() - start;
  logger.info(`Fetched posts from DB in ${timeTaken}ms`);

  // 5️⃣ Send response
  res.json({
    success: true,
    source: "db",
    time: `${timeTaken}ms`,
    page,
    limit,
    totalPages,
    totalPosts,
    data: posts,
  });
});

// ======= GET POST WITH HIGH COMMENTS =======
// 📌 Get Post with Maximum Comments
exports.getTopCommentedPost = catchAsync(async (req, res, next) => {
  const start = Date.now();
  const cacheKey = "top:commented:post";

  // 1️⃣ Redis check
  const cached = await client.get(cacheKey);
  if (cached) {
    const time = Date.now() - start;
    return res.status(200).json({
      success: true,
      data: JSON.parse(cached),
      source: "cache",
      time: `${time}ms`
    });
  }

  // 2️⃣ DB se aggregation
  const post = await Post.aggregate([
    {
      $addFields: {
        commentsCount: { $size: { $ifNull: ["$comments", []] } } // ⚡️ count comments
      }
    },
    { $sort: { commentsCount: -1 } }, // ⚡️ zyada comments first
    { $limit: 1 }
  ]);

  if (!post || post.length === 0) {
    return next(new AppError("No posts found", 404));
  }

  // 3️⃣ User ko populate karne ke liye dobara query
  const finalPost = await Post.findById(post[0]._id)
    .populate("userId", "username usergmail");

  // 4️⃣ Cache save
  await client.setEx(cacheKey, process.env.REDIS_TTL, JSON.stringify(finalPost));

  const time = Date.now() - start;
  res.status(200).json({
    success: true,
    data: finalPost,
    source: "db",
    time: `${time}ms`
  });
});

// getTopLikedPost
exports.getTopLikedPost = catchAsync(async (req, res, next) => {
  const start = Date.now();
  const cacheKey = "top:liked:post";

  // 1️⃣ Redis check
  const cached = await client.get(cacheKey);
  if (cached) {
    const time = Date.now() - start;
    return res.status(200).json({
      success: true,
      data: JSON.parse(cached),
      source: "cache",
      time: `${time}ms`
    });
  }

  // 2️⃣ DB se aggregation
  const post = await Post.aggregate([
    {
      $addFields: {
        likedCount: { $size: { $ifNull: ["$likes", []] } } // ⚡️ count comments
      }
    },
    { $sort: { likedCount: -1 } }, // ⚡️ zyada comments first
    { $limit: 1 }
  ]);

  if (!post || post.length === 0) {
    return next(new AppError("No posts found", 404));
  }

  // 3️⃣ User ko populate karne ke liye dobara query
  const finalPost = await Post.findById(post[0]._id)
    .populate("userId", "username usergmail");

  // 4️⃣ Cache save
  await client.setEx(cacheKey, process.env.REDIS_TTL, JSON.stringify(finalPost));

  const time = Date.now() - start;
  res.status(200).json({
    success: true,
    data: finalPost,
    source: "db",
    time: `${time}ms`
  });
});


// ====== GET POST BY ID WITH REDIS=========
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
  const post = await Post.findById(id).populate("userId", "username usergmail");

  if (!post) {
    logger.warn(`Post not found with id: ${id}`);
    return next(new AppError("Post not found", 404));
  }

  // 3️⃣ Store in Redis with TTL 60 seconds
  await client.setEx(cacheKey, process.env.REDIS_TTL, JSON.stringify(post));

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


// ======= ADD COMMENT TO TH POST =============
exports.addComment = catchAsync(async (req, res, next) => {
  const text = req.body.text;
  const userId = req.user.userId;
  const postId = req.params.id;

  const post = await Post.findById(postId);
  logger.info(`find post with ${postId} for add commments by user ${userId}`);
  if (!post) {
    logger.warn(`NOT find post with ${postId} for add commments by user ${userId}`)
    return next(new AppError("Post not found", 404));
  }

  const comment = await Comment.create({ postId, userId, text });

  post.comments.push(comment._id);
  await post.save();

  // ❌ Invalidate cache for this post + all posts
  await client.del(`post:${postId}`);
  await client.del("posts:all");


  logger.info(`comment added successfully post with ${postId} for add commments by user ${userId} `)
  res.status(201).json({ success: true, message: "Comment added", data: comment });

});


// ============ like ==============
exports.toggleLike = catchAsync(async (req, res, next) => {
  const postId = req.params.id; // ✅ extract from params
  const post = await Post.findById(postId);
  if (!post) return next(new AppError("Post not found", 404));

  // const userId = req.user._id;
  const userId = req.user.userId;
  console.log(userId)
  // If already liked → remove like
  if (post.likes.includes(userId)) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
    post.dislikes.pull(userId); // agar dislike tha to remove kar do
  }

  // ❌ Invalidate cache for this post + all posts
  await client.del(`post:${postId}`);
  await client.del("posts:all");


  await post.save();
  res.json({ success: true, likes: post.likes.length, dislikes: post.dislikes.length });
});


// ============= dislike =================
exports.toggleDislike = catchAsync(async (req, res, next) => {
  const postId = req.params.id; // ✅ extract from params
  //  console.log("Params ID:", postId);

  const post = await Post.findById(postId);

  if (!post) return next(new AppError("Post not found", 404));

  const userId = req.user.userId;

  if (post.dislikes.includes(userId)) {
    post.dislikes.pull(userId);
  } else {
    post.dislikes.push(userId);
    post.likes.pull(userId); // agar like tha to remove kar do
  }

  // ❌ Invalidate cache for this post + all posts
  await client.del(`post:${postId}`);
  await client.del("posts:all");


  await post.save();
  res.json({ success: true, likes: post.likes.length, dislikes: post.dislikes.length });
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

  // ❌ invalidate cache for this post + all posts
  await client.del(`post:${req.params.id}`);
  await client.del("posts:all");

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

  // ❌ invalidate cache for this post + all posts
  await client.del(`post:${req.params.id}`);
  await client.del("posts:all");

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

  // ❌ invalidate all posts cache
  await client.del("posts:all");

  res.status(200).json({
    success: true,
    message: "All Post deleted"
  })

})