// Tournament Controller
const Tournament = require('../models/Tournament');

class TournamentController {
  // Get all tournaments
  async getAll(req, res) {
    try {
      const tournaments = await Tournament.findAll({ filters: req.query });
      res.json({ tournaments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get tournament by ID
  async getById(req, res) {
    try {
      const tournament = await Tournament.getWithDetails(req.params.id);
      res.json({ tournament });
    } catch (error) {
      res.status(404).json({ error: 'Tournament not found' });
    }
  }

  // Create tournament
  async create(req, res) {
    try {
      const tournamentData = {
        ...req.body,
        created_by: req.user.userId,
        status: 'upcoming'
      };
      const tournament = await Tournament.create(tournamentData);
      res.status(201).json({ tournament, message: 'Tournament created successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update tournament
  async update(req, res) {
    try {
      const tournament = await Tournament.update(req.params.id, req.body);
      res.json({ tournament, message: 'Tournament updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete tournament
  async delete(req, res) {
    try {
      await Tournament.delete(req.params.id);
      res.json({ message: 'Tournament deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get active tournaments
  async getActive(req, res) {
    try {
      const tournaments = await Tournament.getActive();
      res.json({ tournaments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get by status
  async getByStatus(req, res) {
    try {
      const tournaments = await Tournament.getByStatus(req.params.status);
      res.json({ tournaments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Register club
  async registerClub(req, res) {
    try {
      const registration = await Tournament.register(
        req.params.id,
        req.body.clubId
      );
      res.status(201).json({
        registration,
        message: 'Club registered for tournament'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Approve registration
  async approveRegistration(req, res) {
    try {
      const registration = await Tournament.approveRegistration(
        req.params.registrationId,
        req.user.userId
      );
      res.json({ registration, message: 'Registration approved' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get registrations
  async getRegistrations(req, res) {
    try {
      const registrations = await Tournament.getRegistrations(
        req.params.id,
        req.query.status
      );
      res.json({ registrations });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update status
  async updateStatus(req, res) {
    try {
      const tournament = await Tournament.updateStatus(
        req.params.id,
        req.body.status
      );
      res.json({ tournament, message: 'Status updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new TournamentController();
