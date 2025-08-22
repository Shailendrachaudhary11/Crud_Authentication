const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { postValidationSchema } = require("../validations/postValidation");
const validate = require("../middleware/validate");
const loginLimiter = require("../middleware/rateLimiter"); // import the middleware

// All routes below need authentication
router.use(authenticate);

router.post('/',loginLimiter, validate(postValidationSchema), postController.createPost);
router.get('/',loginLimiter, postController.getAllPosts);
router.put('/:id',loginLimiter, validate(postValidationSchema), authorize(['admin']), postController.updatePost);
router.delete('/:id',loginLimiter, authorize(['admin']), postController.deletePost);

module.exports = router;                
