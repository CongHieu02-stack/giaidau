const express = require('express');
const router = express.Router();
const clubController = require('../controllers/club.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// GET /api/clubs
router.get('/', clubController.getAll);

// GET /api/clubs/search?q=query
router.get('/search', clubController.search);

// GET /api/clubs/pending (admin only)
router.get('/pending', authenticate, requireAdmin, clubController.getPending);

// GET /api/clubs/leader/:leaderId
router.get('/leader/:leaderId', clubController.getByLeader);

// POST /api/clubs
router.post('/', authenticate, clubController.create);

// GET /api/clubs/:id
router.get('/:id', clubController.getById);

// PUT /api/clubs/:id
router.put('/:id', authenticate, clubController.update);

// DELETE /api/clubs/:id
router.delete('/:id', authenticate, clubController.delete);

// POST /api/clubs/:id/approve (admin only)
router.post('/:id/approve', authenticate, requireAdmin, clubController.approve);

module.exports = router;
