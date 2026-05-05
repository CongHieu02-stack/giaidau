const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// GET /api/matches
router.get('/', matchController.getAll);

// POST /api/matches
router.post('/', authenticate, requireAdmin, matchController.create);

// GET /api/matches/tournament/:tournamentId
router.get('/tournament/:tournamentId', matchController.getByTournament);

// GET /api/matches/:id
router.get('/:id', matchController.getById);

// PUT /api/matches/:id
router.put('/:id', authenticate, matchController.update);

// DELETE /api/matches/:id
router.delete('/:id', authenticate, requireAdmin, matchController.delete);

// PUT /api/matches/:id/score
router.put('/:id/score', authenticate, matchController.updateScore);

// PUT /api/matches/:id/status
router.put('/:id/status', authenticate, matchController.updateStatus);

module.exports = router;
