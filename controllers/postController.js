const Post = require("../models/Post");


exports.createPost = async (req, res) => {
  try {
    const { postId, postTitle, postcontent, userId } = req.body;
    if (await Post.findOne({ postId })) {
      return res
        .status(400)
        .json({ success: false, message: "Post with this id already exists" });
    }

    const post = new Post({ postId, postTitle, postcontent, userId });
    await post.save();

    res
      .status(201)
      .json({ success: true, message: "Post created successfully", data: post });
  } catch (error) {
    
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("userId", "username usergmail");
    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) {
   
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    res.json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
   
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    res.json({
      success: true,
      message: "Post deleted successfully",
      data: { deletedPostId: req.params.id },
    });
  } catch (error) {
   
    res.status(400).json({ success: false, message: error.message });
  }
};
