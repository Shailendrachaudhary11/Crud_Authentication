const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { postValidationSchema } = require("../validations/postValidation");
const validate = require("../middleware/validate");

// All routes below need authentication
router.use(authenticate);

router.post('/', validate(postValidationSchema), postController.createPost);
router.get('/', postController.getAllPosts);
router.put('/:id', validate(postValidationSchema), authorize(['admin']), postController.updatePost);
router.delete('/:id', authorize(['admin']), postController.deletePost);

module.exports = router;                
