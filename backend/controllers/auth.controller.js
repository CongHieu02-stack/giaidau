// Auth Controller - handles authentication logic
const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, fullName } = req.body;

      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create profile
      const profile = await User.create({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'user',
        status: 'active'
      });

      const token = jwt.sign(
        { userId: authData.user.id, email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: profile,
        token
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Get user profile
      const profile = await User.findById(authData.user.id);

      // Update last login
      await User.updateLastLogin(authData.user.id);

      const token = jwt.sign(
        { userId: authData.user.id, email, role: profile.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        user: profile,
        token
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  // Get current user
  async me(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      res.json({ user });
    } catch (error) {
      res.status(404).json({ error: 'User not found' });
    }
  }

  // Logout
  async logout(req, res) {
    res.json({ message: 'Logout successful' });
  }
}

module.exports = new AuthController();
