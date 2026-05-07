/**
 * Auth Store (Pinia)
 * SRP: Centralized state management for authentication
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/AuthService.js';
import { UserRole } from '../types/index.js';
import { User } from '../domain/User.js';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const profile = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const initialized = ref(false);

  // Getters - Role checks
  const isAuthenticated = computed(() => !!user.value);

  // Super Admin (System admin - highest level)
  const isSuperAdmin = computed(() => profile.value?.role === UserRole.SUPER_ADMIN);

  // Any admin (super + tournament admin + club admin)
  const isAdmin = computed(() =>
    profile.value?.role === UserRole.SUPER_ADMIN ||
    profile.value?.role === UserRole.TOURNAMENT_ADMIN ||
    profile.value?.role === UserRole.CLUB_ADMIN ||
    profile.value?.role === UserRole.ADMIN
  );

  // Tournament Admin (manage tournaments only)
  const isTournamentAdmin = computed(() =>
    profile.value?.role === UserRole.TOURNAMENT_ADMIN ||
    profile.value?.role === UserRole.SUPER_ADMIN
  );

  // Club Admin (manage clubs only)
  const isClubAdmin = computed(() =>
    profile.value?.role === UserRole.CLUB_ADMIN ||
    profile.value?.role === UserRole.SUPER_ADMIN
  );

  // Club Leader (specific club owner)
  const isClubLeader = computed(() => profile.value?.role === UserRole.CLUB_LEADER);

  // Club Deputy
  const isClubDeputy = computed(() => profile.value?.role === UserRole.CLUB_DEPUTY);

  // Any club manager (leader + deputy)
  const isClubManager = computed(() =>
    profile.value?.role === UserRole.CLUB_LEADER ||
    profile.value?.role === UserRole.CLUB_DEPUTY
  );

  // Referee
  const isReferee = computed(() => profile.value?.role === UserRole.REFEREE);

  // Regular user
  const isRegularUser = computed(() => profile.value?.role === UserRole.USER);

  // Current role
  const userRole = computed(() => profile.value?.role || UserRole.USER);

  // Role display name
  const userRoleDisplay = computed(() => {
    const roleMap = {
      [UserRole.SUPER_ADMIN]: 'Quản trị viên hệ thống',
      [UserRole.TOURNAMENT_ADMIN]: 'Quản lý giải đấu',
      [UserRole.CLUB_ADMIN]: 'Quản lý câu lạc bộ',
      [UserRole.ADMIN]: 'Quản trị viên',
      [UserRole.CLUB_LEADER]: 'Trưởng câu lạc bộ',
      [UserRole.CLUB_DEPUTY]: 'Phó câu lạc bộ',
      [UserRole.REFEREE]: 'Trọng tài',
      [UserRole.USER]: 'Thành viên'
    };
    return roleMap[profile.value?.role] || 'Thành viên';
  });
  const userDisplayName = computed(() => profile.value?.fullName || user.value?.email || 'User');
  const userAvatar = computed(() => profile.value?.avatarUrl || null);
  const userInitials = computed(() => profile.value?.initials || 'U');

  // Actions
  async function login(email, password) {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.login(email, password);

      if (result.isOk()) {
        const data = result.getValue();
        user.value = data.user;
        profile.value = data.profile;
        session.value = data.session;
        return { success: true };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function register(userData) {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.register(userData);

      if (result.isOk()) {
        return { success: true, message: result.getValue().message };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message || 'Registration failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;

    try {
      await authService.logout();
      user.value = null;
      profile.value = null;
      session.value = null;
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    try {
      console.log('[authStore.fetchUser] calling getCurrentUser...');
      const result = await authService.getCurrentUser();
      console.log('[authStore.fetchUser] result.isOk:', result.isOk(), 'error:', result.isErr() ? result.getError() : null);

      if (result.isOk()) {
        const data = result.getValue();
        user.value = data.user;
        profile.value = data.profile;
        session.value = data.session || null;
        console.log('[authStore.fetchUser] success, user set:', !!data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[authStore.fetchUser] exception:', err);
      return false;
    }
  }

  async function initialize() {
    if (initialized.value) return isAuthenticated.value;
    console.log('[authStore.initialize] starting...');
    const hasUser = await fetchUser();
    initialized.value = true;
    console.log('[authStore.initialize] done, hasUser:', hasUser);
    return hasUser;
  }

  async function updateProfile(profileData) {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.value.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      profile.value = { ...profile.value, ...data };
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(currentPassword, newPassword) {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.changePassword(currentPassword, newPassword);

      if (result.isOk()) {
        return { success: true, message: result.getValue() };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(email) {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.resetPassword(email);

      if (result.isOk()) {
        return { success: true, message: result.getValue() };
      } else {
        error.value = result.getError();
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  function hasPermission(permission) {
    if (!profile.value) return false;
    return profile.value.hasPermission(permission);
  }

  function canManageTournament() {
    return isAdmin.value || isSuperAdmin.value;
  }

  function canManageClub(club) {
    if (!profile.value || !club) return false;
    return isAdmin.value ||
      isSuperAdmin.value ||
      club.leaderId === profile.value.id ||
      club.deputyId === profile.value.id;
  }

  function clearError() {
    error.value = null;
  }

  // Refresh profile from database (call after role change)
  async function refreshProfile() {
    if (!user.value?.id) return;

    loading.value = true;
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single();

      if (err) throw err;

      if (data) {
        profile.value = new User(data);
      }
    } catch (err) {
      console.error('Refresh profile error:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    user,
    profile,
    session,
    loading,
    error,
    initialized,

    // Getters
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isTournamentAdmin,
    isClubAdmin,
    isClubLeader,
    isClubDeputy,
    isClubManager,
    isReferee,
    isRegularUser,
    userRole,
    userRoleDisplay,
    userDisplayName,
    userAvatar,
    userInitials,

    // Actions
    login,
    register,
    logout,
    fetchUser,
    initialize,
    updateProfile,
    changePassword,
    resetPassword,
    hasPermission,
    canManageTournament,
    canManageClub,
    clearError,
    refreshProfile
  };
});
import { supabase } from '../config/supabase.js';
