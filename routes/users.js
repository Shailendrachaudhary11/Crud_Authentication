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
router.get('/userById/:id', loginLimiter, authorize(['admin', 'user']), userController.getUserById);

// ====== GET USER BY gamil ======
router.get('/userByGmail/:usergmail', loginLimiter, authorize(['admin', 'user']), userController.getUserByUserGmail);

// ====== UPDATE USER BY ID ======
router.put('/:id', loginLimiter, authorize(['admin']), userController.updateById);

// ====== DELETE USER BY ID ======
router.delete('/:id', loginLimiter, authorize(['admin']), userController.deleteUserById);

module.exports = router;
