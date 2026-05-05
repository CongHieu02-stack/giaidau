/**
 * Vue Router Configuration
 * SRP: Centralized route definitions with role-based access control
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

// Route definitions
const routes = [
  // Public Routes
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/shared/HomeView.vue'),
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { public: true, guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { public: true, guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPasswordView.vue'),
    meta: { public: true, guestOnly: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/auth/ResetPasswordView.vue'),
    meta: { public: true }
  },

  // Tournament Routes (Public/Authenticated)
  {
    path: '/tournaments',
    name: 'Tournaments',
    component: () => import('../views/shared/TournamentsView.vue'),
    meta: { public: true }
  },
  {
    path: '/tournaments/:id',
    name: 'TournamentDetail',
    component: () => import('../views/shared/TournamentDetailView.vue'),
    meta: { public: true }
  },

  // Club Routes (Public/Authenticated)
  {
    path: '/clubs',
    name: 'Clubs',
    component: () => import('../views/shared/ClubsView.vue'),
    meta: { public: true }
  },
  {
    path: '/clubs/:id',
    name: 'ClubDetail',
    component: () => import('../views/shared/ClubDetailView.vue'),
    meta: { public: true }
  },

  // User Routes (Authenticated)
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/user/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/user/NotificationsView.vue'),
    meta: { requiresAuth: true }
  },

  // Super Admin Routes (System Management)
  {
    path: '/admin',
    name: 'SuperAdminDashboard',
    component: () => import('../views/admin/SuperAdminDashboard.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/admin/UsersView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/admin/sports',
    name: 'AdminSports',
    component: () => import('../views/admin/SportsView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/admin/system',
    name: 'SystemSettings',
    component: () => import('../views/admin/SystemSettingsView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },

  // Tournament Admin Routes
  {
    path: '/tournament-admin',
    name: 'TournamentAdminDashboard',
    component: () => import('../views/tournament-admin/DashboardView.vue'),
    meta: { requiresAuth: true, requiresTournamentAdmin: true }
  },
  {
    path: '/tournament-admin/tournaments',
    name: 'TournamentAdminTournaments',
    component: () => import('../views/tournament-admin/TournamentsView.vue'),
    meta: { requiresAuth: true, requiresTournamentAdmin: true }
  },
  {
    path: '/tournament-admin/tournaments/create',
    name: 'TournamentAdminCreateTournament',
    component: () => import('../views/tournament-admin/CreateTournamentView.vue'),
    meta: { requiresAuth: true, requiresTournamentAdmin: true }
  },
  {
    path: '/tournament-admin/tournaments/:id/edit',
    name: 'TournamentAdminEditTournament',
    component: () => import('../views/tournament-admin/EditTournamentView.vue'),
    meta: { requiresAuth: true, requiresTournamentAdmin: true }
  },
  {
    path: '/tournament-admin/tournaments/:id/schedule',
    name: 'TournamentAdminSchedule',
    component: () => import('../views/tournament-admin/TournamentScheduleView.vue'),
    meta: { requiresAuth: true, requiresTournamentAdmin: true }
  },
  {
    path: '/tournament-admin/matches',
    name: 'TournamentAdminMatches',
    component: () => import('../views/tournament-admin/MatchesView.vue'),
    meta: { requiresAuth: true, requiresTournamentAdmin: true }
  },
  {
    path: '/tournament-admin/referees',
    name: 'TournamentAdminReferees',
    component: () => import('../views/tournament-admin/RefereesView.vue'),
    meta: { requiresAuth: true, requiresTournamentAdmin: true }
  },

  // Club Admin Routes
  {
    path: '/club-admin',
    name: 'ClubAdminDashboard',
    component: () => import('../views/club-admin/DashboardView.vue'),
    meta: { requiresAuth: true, requiresClubAdmin: true }
  },
  {
    path: '/club-admin/clubs',
    name: 'ClubAdminClubs',
    component: () => import('../views/club-admin/ClubsView.vue'),
    meta: { requiresAuth: true, requiresClubAdmin: true }
  },
  {
    path: '/club-admin/clubs/:id',
    name: 'ClubAdminClubDetail',
    component: () => import('../views/club-admin/ClubDetailView.vue'),
    meta: { requiresAuth: true, requiresClubAdmin: true }
  },
  {
    path: '/club-admin/approvals',
    name: 'ClubAdminApprovals',
    component: () => import('../views/club-admin/ApprovalsView.vue'),
    meta: { requiresAuth: true, requiresClubAdmin: true }
  },

  // Club Leader Routes
  {
    path: '/club',
    name: 'ClubDashboard',
    component: () => import('../views/club/DashboardView.vue'),
    meta: { requiresAuth: true, requiresClubLeader: true }
  },
  {
    path: '/club/members',
    name: 'ClubMembers',
    component: () => import('../views/club/MembersView.vue'),
    meta: { requiresAuth: true, requiresClubLeader: true }
  },
  {
    path: '/club/tournaments',
    name: 'ClubTournaments',
    component: () => import('../views/club/TournamentsView.vue'),
    meta: { requiresAuth: true, requiresClubLeader: true }
  },

  // Referee Routes
  {
    path: '/referee',
    name: 'RefereeDashboard',
    component: () => import('../views/referee/DashboardView.vue'),
    meta: { requiresAuth: true, requiresReferee: true }
  },
  {
    path: '/referee/matches',
    name: 'RefereeMatches',
    component: () => import('../views/referee/MatchesView.vue'),
    meta: { requiresAuth: true, requiresReferee: true }
  },
  {
    path: '/referee/matches/:id',
    name: 'RefereeMatchControl',
    component: () => import('../views/referee/MatchControlView.vue'),
    meta: { requiresAuth: true, requiresReferee: true }
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/shared/NotFoundView.vue'),
    meta: { public: true }
  }
];

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check if route is public
  if (to.meta.public) {
    // Check if route is for guests only (login, register)
    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return next('/');
    }
    return next();
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Try to fetch user session
    const hasUser = await authStore.fetchUser();
    if (!hasUser) {
      return next('/login?redirect=' + encodeURIComponent(to.fullPath));
    }
  }

  // Check role-based access
  if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
    return next('/');
  }

  if (to.meta.requiresTournamentAdmin && !authStore.isTournamentAdmin) {
    return next('/');
  }

  if (to.meta.requiresClubAdmin && !authStore.isClubAdmin) {
    return next('/');
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/');
  }

  if (to.meta.requiresClubLeader && !(authStore.isClubLeader || authStore.isClubDeputy || authStore.isClubAdmin)) {
    return next('/');
  }

  if (to.meta.requiresReferee && !(authStore.isReferee || authStore.isTournamentAdmin)) {
    return next('/');
  }

  // Redirect to appropriate dashboard based on role
  if (to.path === '/dashboard') {
    if (authStore.isSuperAdmin) return next('/admin');
    if (authStore.isTournamentAdmin) return next('/tournament-admin');
    if (authStore.isClubAdmin) return next('/club-admin');
    if (authStore.isClubLeader || authStore.isClubDeputy) return next('/club');
    if (authStore.isReferee) return next('/referee');
    return next('/profile');
  }

  next();
});

export default router;
