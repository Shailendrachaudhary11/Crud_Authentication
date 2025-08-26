const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const loginLimiter = require("../middleware/rateLimiter"); // import the middleware

// All user routes protected
router.use(authenticate);

// ====== GET ALL USERS ====== 
router.get('/', loginLimiter, authorize(['admin']), userController.getAllUsers);

// ====== GET USER BY ID ======
router.get('/:id', loginLimiter, authorize(['admin', 'user']), userController.getUserById);

// ====== UPDATE USER BY ID ======
router.post('/:id', loginLimiter, authorize(['admin']), userController.updateById);

// ====== DELETE USER BY ID ======
router.delete('/:id', loginLimiter, authorize(['admin']), userController.deleteUserById);

module.exports = router;
