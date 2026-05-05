// Match Controller
const BaseModel = require('../models/BaseModel');
const Match = new BaseModel('matches');

class MatchController {
  // Get all matches
  async getAll(req, res) {
    try {
      const matches = await Match.findAll({ filters: req.query });
      res.json({ matches });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get match by ID
  async getById(req, res) {
    try {
      const match = await Match.findById(req.params.id);
      res.json({ match });
    } catch (error) {
      res.status(404).json({ error: 'Match not found' });
    }
  }

  // Create match
  async create(req, res) {
    try {
      const match = await Match.create(req.body);
      res.status(201).json({ match, message: 'Match created successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update match
  async update(req, res) {
    try {
      const match = await Match.update(req.params.id, req.body);
      res.json({ match, message: 'Match updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete match
  async delete(req, res) {
    try {
      await Match.delete(req.params.id);
      res.json({ message: 'Match deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get matches by tournament
  async getByTournament(req, res) {
    try {
      const matches = await Match.findAll({
        filters: { tournament_id: req.params.tournamentId }
      });
      res.json({ matches });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update score
  async updateScore(req, res) {
    try {
      const { homeScore, awayScore } = req.body;
      const match = await Match.update(req.params.id, {
        home_score: homeScore,
        away_score: awayScore
      });
      res.json({ match, message: 'Score updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update status
  async updateStatus(req, res) {
    try {
      const match = await Match.update(req.params.id, {
        status: req.body.status
      });
      res.json({ match, message: 'Match status updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new MatchController();
