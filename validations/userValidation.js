const Joi = require("joi");

exports.registerSchema = Joi.object({
  username: Joi.string().min(3).required(),
  usergmail: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("user", "admin").default("user")
});

exports.loginSchema = Joi.object({
  usergmail: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.forgotPasswordSchema = Joi.object({
  usergmail: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
  usergmail: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});
