const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// GET /api/tournaments
router.get('/', tournamentController.getAll);

// GET /api/tournaments/active
router.get('/active', tournamentController.getActive);

// GET /api/tournaments/status/:status
router.get('/status/:status', tournamentController.getByStatus);

// POST /api/tournaments
router.post('/', authenticate, requireAdmin, tournamentController.create);

// GET /api/tournaments/:id
router.get('/:id', tournamentController.getById);

// PUT /api/tournaments/:id
router.put('/:id', authenticate, requireAdmin, tournamentController.update);

// DELETE /api/tournaments/:id
router.delete('/:id', authenticate, requireAdmin, tournamentController.delete);

// POST /api/tournaments/:id/register
router.post('/:id/register', authenticate, tournamentController.registerClub);

// GET /api/tournaments/:id/registrations
router.get('/:id/registrations', authenticate, tournamentController.getRegistrations);

// POST /api/tournaments/registrations/:registrationId/approve
router.post('/registrations/:registrationId/approve', authenticate, requireAdmin, tournamentController.approveRegistration);

// PUT /api/tournaments/:id/status
router.put('/:id/status', authenticate, requireAdmin, tournamentController.updateStatus);

module.exports = router;
