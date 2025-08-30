const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticate = require('../middleware/authMiddleware'); // check JWT
const authorize = require('../middleware/roleMiddleware');   // role based access
const { postValidationSchema } = require("../validations/postValidation"); // Joi schema
const validate = require("../middleware/validate");          // validation
const loginLimiter = require("../middleware/rateLimiter");   // rate limit

router.use(authenticate); // all routes need auth

// create post
router.post('/', loginLimiter, validate(postValidationSchema), postController.createPost); // create post

// get all posts
router.get('/', loginLimiter, authorize(['admin']), postController.getAllPosts);

//   getTopCommentedPost
router.get("/top-commented", postController.getTopCommentedPost);

//   getTopLikedPost
router.get("/top-liked", postController.getTopLikedPost);

// getPostById
router.get('/getById/:id', loginLimiter, authorize(['admin', 'user']), postController.getPostById);

// updatePost
router.put('/:id', loginLimiter, validate(postValidationSchema), authorize(['admin']), postController.updatePost); // update post

// deletePost
router.delete('/:id', loginLimiter, authorize(['admin']), postController.deletePost);      // delete post by id

//  deleteAllPost
router.delete('/', loginLimiter, authorize(['admin']), postController.deleteAllPost);      // delete all posts

// toggleLike
router.post("/:id/like", postController.toggleLike);

// toggleDislike
router.post("/:id/dislike", postController.toggleDislike);

// addComment
router.post("/:id/comments", postController.addComment);

module.exports = router;
