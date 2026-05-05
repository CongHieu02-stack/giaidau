const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// GET /api/users
router.get('/', authenticate, userController.getAll);

// GET /api/users/search?q=query
router.get('/search', authenticate, userController.search);

// GET /api/users/role/:role
router.get('/role/:role', authenticate, userController.getByRole);

// GET /api/users/:id
router.get('/:id', authenticate, userController.getById);

// GET /api/users/:id/clubs
router.get('/:id/clubs', authenticate, userController.getWithClubs);

// PUT /api/users/:id
router.put('/:id', authenticate, userController.update);

// DELETE /api/users/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, userController.delete);

module.exports = router;
