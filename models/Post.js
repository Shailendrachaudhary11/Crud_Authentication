const { required } = require("joi");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postId:{ type: String, required:true},
  postTitle: { type: String, required: true, minlength: 3 },
  postcontent: { type: String, required: true, minlength: 5 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
