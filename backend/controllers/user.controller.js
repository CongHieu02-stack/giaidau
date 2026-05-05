// User Controller
const User = require('../models/User');

class UserController {
  // Get all users
  async getAll(req, res) {
    try {
      const users = await User.findAll();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user by ID
  async getById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      res.json({ user });
    } catch (error) {
      res.status(404).json({ error: 'User not found' });
    }
  }

  // Get user with clubs
  async getWithClubs(req, res) {
    try {
      const user = await User.getWithClubs(req.params.id);
      res.json({ user });
    } catch (error) {
      res.status(404).json({ error: 'User not found' });
    }
  }

  // Update user
  async update(req, res) {
    try {
      const user = await User.update(req.params.id, req.body);
      res.json({ user, message: 'User updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete user
  async delete(req, res) {
    try {
      await User.delete(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Search users
  async search(req, res) {
    try {
      const { q, role, status } = req.query;
      const users = await User.search(q, { role, status });
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get users by role
  async getByRole(req, res) {
    try {
      const users = await User.findByRole(req.params.role);
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
