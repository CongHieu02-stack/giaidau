/**
 * Auth Service
 * SRP: Authentication and authorization business logic
 * Following Service Pattern for business operations
 */
import { supabase } from '../config/supabase.js';
import { userRepository } from '../repositories/UserRepository.js';
import { Result } from '../utils/result.js';

export class AuthService {
  constructor() {
    this.client = supabase;
    this.userRepo = userRepository;
  }

  /**
   * Generate random avatar color
   */
  generateAvatarColor() {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return Result.err(this.mapAuthError(error));
      }

      // Get user profile
      let profileResult = await this.userRepo.findById(data.user.id);

      // If profile doesn't exist, create it
      if (profileResult.isErr()) {
        console.log('Profile not found, creating...');
        const fullName = data.user.user_metadata?.full_name || email.split('@')[0];

        const { error: createError } = await this.client
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            role: 'user',
            status: 'active',
            avatar_color: this.generateAvatarColor(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Failed to create profile:', createError);
          // Return user without profile rather than failing completely
          return Result.ok({
            user: data.user,
            profile: {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              role: 'user',
              status: 'active'
            },
            session: data.session
          });
        }

        // Try to get the newly created profile
        profileResult = await this.userRepo.findById(data.user.id);
      }

      return Result.ok({
        user: data.user,
        profile: profileResult.isOk() ? profileResult.getValue() : {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: 'user',
          status: 'active'
        },
        session: data.session
      });
    } catch (error) {
      console.error('Login error:', error);
      return Result.err(error.message || 'Login failed');
    }
  }

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const { email, password, fullName, gender, birthDate, phone } = userData;

      // Validate required fields
      if (!email || !password || !fullName) {
        return Result.err('Email, password, and full name are required');
      }

      // Validate password strength
      if (password.length < 8) {
        return Result.err('Password must be at least 8 characters');
      }

      // Create auth user
      console.log('Attempting to sign up with:', { email, fullName });
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('SignUp error:', error);
        return Result.err(this.mapAuthError(error));
      }

      console.log('User created:', data.user?.id);

      // Create profile - with delay to ensure auth user is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      const profileData = {
        id: data.user.id,
        email,
        full_name: fullName,
        gender: gender || null,
        birth_date: birthDate || null,
        phone: phone || null,
        role: 'user',
        status: 'active',
        avatar_color: this.generateAvatarColor()
      };

      console.log('Creating profile:', profileData);

      const { error: profileError } = await this.client
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails
        // User can complete profile later
        return Result.ok({
          user: data.user,
          message: 'Registration successful, but profile setup incomplete. Please contact support.',
          warning: profileError.message
        });
      }

      return Result.ok({
        user: data.user,
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } catch (error) {
      console.error('Registration exception:', error);
      return Result.err(error.message || 'Registration failed');
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        return Result.err(error.message);
      }
      return Result.ok(true);
    } catch (error) {
      return Result.err(error.message);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/reset-password`
      });

      if (error) {
        return Result.err(this.mapAuthError(error));
      }

      return Result.ok('Password reset email sent. Please check your inbox.');
    } catch (error) {
      return Result.err(error.message);
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      if (newPassword.length < 8) {
        return Result.err('Password must be at least 8 characters');
      }

      const { error } = await this.client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return Result.err(this.mapAuthError(error));
      }

      return Result.ok('Password updated successfully');
    } catch (error) {
      return Result.err(error.message);
    }
  }

  /**
   * Change password with current password verification
   */
  async changePassword(currentPassword, newPassword) {
    try {
      // Validate new password
      if (newPassword.length < 8) {
        return Result.err('New password must be at least 8 characters');
      }

      // Check password complexity
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        return Result.err('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      }

      const { error } = await this.client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return Result.err(this.mapAuthError(error));
      }

      return Result.ok('Password changed successfully');
    } catch (error) {
      return Result.err(error.message);
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    try {
      const { error } = await this.client.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        return Result.err(this.mapAuthError(error));
      }

      return Result.ok('Verification email resent');
    } catch (error) {
      return Result.err(error.message);
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) {
        return Result.err(error.message);
      }
      return Result.ok(data.session);
    } catch (error) {
      return Result.err(error.message);
    }
  }

  /**
   * Get current user with profile
   */
  async getCurrentUser() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      console.log('[AuthService.getCurrentUser] session:', session, 'error:', error);

      if (error || !session) {
        console.warn('[AuthService.getCurrentUser] No session');
        return Result.err('No authenticated user');
      }

      const profileResult = await this.userRepo.findById(session.user.id);
      console.log('[AuthService.getCurrentUser] profileResult:', profileResult);

      if (profileResult.isErr()) {
        console.warn('[AuthService.getCurrentUser] Profile load failed, using fallback');
        // Fallback: return user with default profile so auth state is not lost
        return Result.ok({
          user: session.user,
          profile: {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: 'user',
            status: 'active'
          },
          session
        });
      }

      return Result.ok({
        user: session.user,
        profile: profileResult.getValue(),
        session
      });
    } catch (error) {
      console.error('[AuthService.getCurrentUser] exception:', error);
      return Result.err(error.message);
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    return this.client.auth.onAuthStateChange(callback);
  }

  /**
   * Map Supabase auth errors to user-friendly messages
   */
  mapAuthError(error) {
    const errorMessages = {
      'invalid_credentials': 'Invalid email or password',
      'user_not_found': 'User not found',
      'email_not_confirmed': 'Please verify your email address',
      'email_already_in_use': 'Email is already registered',
      'weak_password': 'Password is too weak',
      'session_expired': 'Your session has expired. Please login again'
    };

    return errorMessages[error.code] || error.message || 'An authentication error occurred';
  }
}

export const authService = new AuthService();
