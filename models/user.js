const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 3 },
  usergmail: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  otp: String,
  otpExpires: Date,
  profileImage: { type: String, default: null },
  filePath: { type: String, default: null },
  refreshToken: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },   // ✅ add this
  toObject: { virtuals: true }  // ✅ add this
});

userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "userId",
});

// इस case में User document के अंदर कोई posts field database में save नहीं होती।
// लेकिन जब आप User.find().populate("posts") करेंगे, तो mongoose अपने-आप reverse lookup करके उस user के सारे posts ले आएगा।

// ✅ Use Case: जब आपको parent → child relation चाहिए (जैसे User के सारे Posts लाने हैं)
// लेकिन आप हर User document में posts का array store नहीं करना चाहते (क्योंकि वो data बहुत बड़ा हो सकता है और बार-बार update करना पड़ेगा)।

module.exports = mongoose.model("User", userSchema);
