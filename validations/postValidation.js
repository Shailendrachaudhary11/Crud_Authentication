const Joi = require("joi");

exports.postValidationSchema = Joi.object({

  postId:Joi.string().min(3).required(),
  postTitle: Joi.string().min(3).required(),
  postcontent: Joi.string().min(5).required(),
  userId: Joi.string().hex().length(24).required()
});
