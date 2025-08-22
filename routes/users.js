const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const loginLimiter = require("../middleware/rateLimiter"); // import the middleware

// All user routes protected
router.use(authenticate);


// Only admin can get all users
router.get('/',loginLimiter, authorize(['admin']), userController.getAllUsers);

// Admin and user can get single user by id
router.get('/:id',loginLimiter, authorize(['admin', 'user']), userController.getUserById);

router.post('/:id',loginLimiter, authorize(['admin']),userController.updateById);
router.delete('/:id',loginLimiter, authorize(['admin']), userController.deleteUserById);

module.exports = router;
