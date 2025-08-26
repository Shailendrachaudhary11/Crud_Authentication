const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticate = require('../middleware/authMiddleware'); // check JWT
const authorize = require('../middleware/roleMiddleware');   // role based access
const { postValidationSchema } = require("../validations/postValidation"); // Joi schema
const validate = require("../middleware/validate");          // validation
const loginLimiter = require("../middleware/rateLimiter");   // rate limit

router.use(authenticate); // all routes need auth

router.post('/', loginLimiter, validate(postValidationSchema), postController.createPost); // create post
router.get('/', loginLimiter, authorize(['admin']), postController.getAllPosts);           // get all posts
router.get('/:id', loginLimiter, authorize(['admin']), postController.getPostById);        // get post by id
router.put('/:id', loginLimiter, validate(postValidationSchema), authorize(['admin']), postController.updatePost); // update post
router.delete('/:id', loginLimiter, authorize(['admin']), postController.deletePost);      // delete post by id
router.delete('/', loginLimiter, authorize(['admin']), postController.deleteAllPost);      // delete all posts

module.exports = router;
