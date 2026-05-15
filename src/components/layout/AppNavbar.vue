<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <div class="logo-icon">
          <i class="pi pi-trophy"></i>
        </div>
        <span class="logo-text">MyLeague</span>
      </router-link>

      <!-- Desktop Menu -->
      <div class="desktop-menu">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="menu-link"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.label }}
        </router-link>
      </div>

      <!-- Right Side -->
      <div class="nav-right">
        <!-- User Menu (logged in) -->
        <div v-if="authStore.isAuthenticated" class="user-menu">
          <button class="user-btn" @click="showDropdown = !showDropdown">
            <div class="user-btn-avatar">
              <img v-if="authStore.userAvatar" :src="authStore.userAvatar" :alt="authStore.userDisplayName" class="avatar-img" />
              <span v-else>{{ authStore.userInitials }}</span>
            </div>
            <span class="user-name">{{ authStore.userDisplayName }}</span>
            <i class="pi pi-chevron-down"></i>
          </button>
          
          <div v-if="showDropdown" class="dropdown" @click.stop>
            <!-- Header with avatar -->
            <div class="dropdown-header">
              <div class="dropdown-avatar">
                <img v-if="authStore.userAvatar" :src="authStore.userAvatar" :alt="authStore.userDisplayName" class="avatar-img" />
                <span v-else>{{ authStore.userInitials }}</span>
              </div>
              <div class="dropdown-info">
                <div class="dropdown-user-name">{{ authStore.userDisplayName }}</div>
                <div class="dropdown-user-role">
                  <i class="pi pi-circle-fill role-dot"></i>
                  {{ authStore.userRoleDisplay }}
                </div>
              </div>
            </div>

            <div class="dropdown-section">
              <router-link to="/profile" class="dropdown-link" @click="showDropdown = false">
                <span class="link-icon profile"><i class="pi pi-user"></i></span>
                <span class="link-text">Hồ sơ</span>
                <i class="pi pi-chevron-right link-arrow"></i>
              </router-link>

              <!-- Role-specific dashboard links -->
              <router-link v-if="authStore.isSuperAdmin" to="/admin" class="dropdown-link" @click="showDropdown = false">
                <span class="link-icon admin"><i class="pi pi-cog"></i></span>
                <span class="link-text">Dashboard Admin</span>
                <i class="pi pi-chevron-right link-arrow"></i>
              </router-link>
              <router-link v-if="authStore.isTournamentAdmin" to="/tournament-admin" class="dropdown-link" @click="showDropdown = false">
                <span class="link-icon tournament"><i class="pi pi-trophy"></i></span>
                <span class="link-text">QL Giải đấu</span>
                <i class="pi pi-chevron-right link-arrow"></i>
              </router-link>
              <router-link v-if="authStore.isClubAdmin" to="/club-admin" class="dropdown-link" @click="showDropdown = false">
                <span class="link-icon club"><i class="pi pi-shield"></i></span>
                <span class="link-text">QL Câu lạc bộ</span>
                <i class="pi pi-chevron-right link-arrow"></i>
              </router-link>
              <router-link v-if="authStore.isClubManager" to="/club" class="dropdown-link" @click="showDropdown = false">
                <span class="link-icon manager"><i class="pi pi-building"></i></span>
                <span class="link-text">Câu lạc bộ</span>
                <i class="pi pi-chevron-right link-arrow"></i>
              </router-link>
              <router-link v-if="authStore.isReferee" to="/referee" class="dropdown-link" @click="showDropdown = false">
                <span class="link-icon referee"><i class="pi pi-flag"></i></span>
                <span class="link-text">Trọng tài</span>
                <i class="pi pi-chevron-right link-arrow"></i>
              </router-link>
            </div>

            <div class="dropdown-footer">
              <button @click="logout" class="logout-btn">
                <i class="pi pi-sign-out"></i>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Auth Buttons (not logged in) -->
        <div v-else class="auth-buttons">
          <router-link to="/login" class="btn-login">Đăng nhập</router-link>
          <router-link to="/register" class="btn-register">Đăng ký</router-link>
        </div>

        <!-- Mobile Menu Button -->
        <button class="mobile-btn" @click="showMobile = !showMobile">
          <i class="pi pi-bars"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="showMobile" class="mobile-menu">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path"
        class="mobile-link"
        :class="{ active: isActive(item.path) }"
        @click="showMobile = false"
      >
        {{ item.label }}
      </router-link>
      <template v-if="!authStore.isAuthenticated">
        <div class="divider"></div>
        <router-link to="/login" class="mobile-link" @click="showMobile = false">Đăng nhập</router-link>
        <router-link to="/register" class="mobile-link register" @click="showMobile = false">Đăng ký</router-link>
      </template>
      <template v-else>
        <div class="divider"></div>
        <button @click="logout" class="mobile-link logout">Đăng xuất</button>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const showMobile = ref(false);
const showDropdown = ref(false);

// Menu items based on role
const menuItems = computed(() => {
  const baseItems = [
    { path: '/', label: 'Trang chủ' },
    { path: '/tournaments', label: 'Giải đấu' },
    { path: '/clubs', label: 'CLB' }
  ];
  
  // Super Admin menu
  if (authStore.isSuperAdmin) {
    return [
      { path: '/admin', label: 'Dashboard Admin' },
      { path: '/tournaments', label: 'Giải đấu' },
      { path: '/clubs', label: 'CLB' }
    ];
  }
  
  // Tournament Admin menu
  if (authStore.isTournamentAdmin) {
    return [
      { path: '/tournament-admin', label: 'QL Giải đấu' },
      { path: '/tournaments', label: 'Xem giải' },
      { path: '/clubs', label: 'CLB' }
    ];
  }
  
  // Club Admin menu
  if (authStore.isClubAdmin) {
    return [
      { path: '/club-admin', label: 'QL Câu lạc bộ' },
      { path: '/tournaments', label: 'Giải đấu' },
      { path: '/clubs', label: 'Xem CLB' }
    ];
  }
  
  // Club Leader/Deputy menu
  if (authStore.isClubManager) {
    return [
      { path: '/club', label: 'Câu lạc bộ' },
      { path: '/tournaments', label: 'Giải đấu' }
    ];
  }
  
  // Referee menu
  if (authStore.isReferee) {
    return [
      { path: '/referee', label: 'Trọng tài' },
      { path: '/tournaments', label: 'Giải đấu' }
    ];
  }
  
  return baseItems;
});

const isActive = (path) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const logout = async () => {
  await authStore.logout();
  showDropdown.value = false;
  showMobile.value = false;
  router.push('/');
};
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(8, 11, 26, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

@media (min-width: 640px) {
  .nav-container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .nav-container {
    padding: 0 2rem;
  }
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

@media (min-width: 768px) {
  .logo-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (min-width: 768px) {
  .logo-text {
    font-size: 1.5rem;
  }
}

/* Desktop Menu */
.desktop-menu {
  display: none;
  align-items: center;
  gap: 0.25rem;
}

@media (min-width: 768px) {
  .desktop-menu {
    display: flex;
  }
}

.menu-link {
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.menu-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-link.active {
  background: rgba(59, 130, 246, 0.2);
  color: white;
}

/* Nav Right */
.nav-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Auth Buttons */
.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-login {
  display: none;
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

@media (min-width: 640px) {
  .btn-login {
    display: block;
  }
}

.btn-login:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.btn-register {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn-register:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.user-btn-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.user-name {
  display: none;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .user-name {
    display: block;
  }
}

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 260px;
  background: rgba(13, 11, 40, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(99, 102, 241, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dropdown-avatar {
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dropdown-user-name {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: white;
  font-size: 0.9rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-user-role {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.72rem;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
}

.role-dot {
  font-size: 0.45rem;
  color: #22c55e;
  filter: drop-shadow(0 0 4px #22c55e);
}

/* Section */
.dropdown-section {
  padding: 0.5rem;
}

/* Links */
.dropdown-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 0.625rem;
  transition: all 0.18s ease;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.dropdown-link:hover {
  background: rgba(255, 255, 255, 0.07);
  color: white;
}

.dropdown-link:hover .link-arrow {
  opacity: 1;
  transform: translateX(2px);
}

/* Link icon badges */
.link-icon {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: transform 0.18s ease;
}

.dropdown-link:hover .link-icon {
  transform: scale(1.1);
}

.link-icon.profile  { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
.link-icon.admin    { background: rgba(239, 68, 68, 0.2);  color: #fca5a5; }
.link-icon.tournament { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.link-icon.club     { background: rgba(6, 182, 212, 0.2);  color: #67e8f9; }
.link-icon.manager  { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.link-icon.referee  { background: rgba(34, 197, 94, 0.2);  color: #86efac; }

.link-text {
  flex: 1;
}

.link-arrow {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.25);
  opacity: 0;
  transition: all 0.18s ease;
}

/* Footer / Logout */
.dropdown-footer {
  padding: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem 1rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.625rem;
  color: #f87171;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  transform: translateY(-1px);
}

.logout-btn .pi {
  font-size: 0.9rem;
}

/* Mobile Button */
.mobile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

@media (min-width: 768px) {
  .mobile-btn {
    display: none;
  }
}

.mobile-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Mobile Menu */
.mobile-menu {
  padding: 0.5rem 1rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 768px) {
  .mobile-menu {
    display: none;
  }
}

.mobile-link {
  display: block;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.mobile-link:hover,
.mobile-link.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mobile-link.register {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  text-align: center;
  margin-top: 0.5rem;
}

.mobile-link.logout {
  color: #f87171;
  background: none;
  border: 1px solid rgba(248, 113, 113, 0.3);
  text-align: center;
  margin-top: 0.5rem;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 1rem;
}
</style>
