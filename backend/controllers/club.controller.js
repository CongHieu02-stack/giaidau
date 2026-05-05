// Club Controller
const Club = require('../models/Club');

class ClubController {
  // Get all clubs
  async getAll(req, res) {
    try {
      const clubs = await Club.findAll({ filters: req.query });
      res.json({ clubs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get club by ID
  async getById(req, res) {
    try {
      const club = await Club.getWithMembers(req.params.id);
      res.json({ club });
    } catch (error) {
      res.status(404).json({ error: 'Club not found' });
    }
  }

  // Create club
  async create(req, res) {
    try {
      const clubData = {
        ...req.body,
        leader_id: req.user.userId,
        status: 'pending'
      };
      const club = await Club.create(clubData);
      res.status(201).json({ club, message: 'Club created successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update club
  async update(req, res) {
    try {
      const club = await Club.update(req.params.id, req.body);
      res.json({ club, message: 'Club updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete club
  async delete(req, res) {
    try {
      await Club.delete(req.params.id);
      res.json({ message: 'Club deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get pending clubs
  async getPending(req, res) {
    try {
      const clubs = await Club.getPending();
      res.json({ clubs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Approve club
  async approve(req, res) {
    try {
      const club = await Club.approve(req.params.id, req.user.userId);
      res.json({ club, message: 'Club approved successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Search clubs
  async search(req, res) {
    try {
      const clubs = await Club.search(req.query.q);
      res.json({ clubs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get clubs by leader
  async getByLeader(req, res) {
    try {
      const clubs = await Club.findByLeader(req.params.leaderId);
      res.json({ clubs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ClubController();
