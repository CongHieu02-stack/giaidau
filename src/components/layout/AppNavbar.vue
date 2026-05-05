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
            <span class="user-name">{{ authStore.userDisplayName }}</span>
            <i class="pi pi-chevron-down"></i>
          </button>
          
          <div v-if="showDropdown" class="dropdown">
            <div class="dropdown-header">
              <div class="dropdown-user-name">{{ authStore.userDisplayName }}</div>
              <div class="dropdown-user-role">{{ authStore.userRoleDisplay }}</div>
            </div>
            <div class="divider"></div>
            <router-link to="/profile" class="dropdown-link">👤 Hồ sơ</router-link>
            
            <!-- Role-specific dashboard links -->
            <router-link v-if="authStore.isSuperAdmin" to="/admin" class="dropdown-link">⚙️ Dashboard Admin</router-link>
            <router-link v-if="authStore.isTournamentAdmin" to="/tournament-admin" class="dropdown-link">🏆 QL Giải đấu</router-link>
            <router-link v-if="authStore.isClubAdmin" to="/club-admin" class="dropdown-link">🏢 QL Câu lạc bộ</router-link>
            <router-link v-if="authStore.isClubManager" to="/club" class="dropdown-link">🏟️ Câu lạc bộ</router-link>
            <router-link v-if="authStore.isReferee" to="/referee" class="dropdown-link">⚖️ Trọng tài</router-link>
            
            <div class="divider"></div>
            <button @click="logout" class="dropdown-link logout">🚪 Đăng xuất</button>
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
  background: rgba(15, 23, 42, 0.8);
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

.user-name {
  display: none;
  max-width: 100px;
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
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  min-width: 200px;
  background: rgba(30, 27, 75, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.dropdown-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.25rem;
}

.dropdown-user-name {
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.dropdown-link {
  display: block;
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.dropdown-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.dropdown-link.logout {
  color: #f87171;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
}

.dropdown-link.logout:hover {
  background: rgba(248, 113, 113, 0.1);
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
