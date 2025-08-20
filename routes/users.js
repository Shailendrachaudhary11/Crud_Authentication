const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');


// All user routes protected
router.use(authenticate);


// Only admin can get all users
router.get('/', authorize(['admin']), userController.getAllUsers);

// Admin and user can get single user by id
router.get('/:id', authorize(['admin', 'user']), userController.getUserById);

router.post('/:id', authorize(['admin']),userController.updateById);
router.delete('/:id', authorize(['admin']), userController.deleteUserById);

module.exports = router;
