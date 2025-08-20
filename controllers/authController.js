const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

exports.register = async (req, res) => {
  try {
    const { username, usergmail, password, role } = req.body;

    if (await User.findOne({ usergmail })) {
      return res
        .status(400)
        .json({ success: false, message: "User email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, usergmail, password: hashedPassword, role });
    await user.save();

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: usergmail,
      subject: "welcome in SHAILENDRA CHAUDHARY app",
      html: `<h3>Your name is: ${username}</h3><br>
      <p>Hi ${username}, welcome to the SHAILENDRA CHAUDHARY app! Mr. Chaudhary has created this app and you have successfully registered with your Gmail ID. If you face any issues, please contact Mr. 
      Chaudhary for assistance.</p>
              <h4>Your Email id: ${usergmail}</h4><br>
              <h5>Your password: ${hashedPassword}</h5>`
    })

    res.status(201).json({ success: true, message: "User registered successfully. Email send." });
  }
  catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { usergmail, password } = req.body;
    const user = await User.findOne({ usergmail });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.json({ success: true, message: "Login successful", token });
  } catch (error) {

    res.status(500).json({ success: false, message: error.message });
  }
};



exports.forgotPassword = async (req, res) => {
  try {
    const { usergmail } = req.body;
    const user = await User.findOne({ usergmail });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 2 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: usergmail,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`,
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { usergmail, otp, newPassword } = req.body;
    const user = await User.findOne({ usergmail });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: "OTP invalid" });

    if (Date.now() > user.otpExpires)
      return res.status(400).json({ success: false, message: "OTP expired" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {

    res.status(500).json({ success: false, message: error.message });
  }
};
