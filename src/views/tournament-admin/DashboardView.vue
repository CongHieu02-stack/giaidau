<template>
  <div class="tournament-admin-dashboard">
    <div class="container">
      <h1 class="page-title">Dashboard Quản lý giải đấu</h1>
      <p class="page-subtitle">Xin chào {{ authStore.userDisplayName }}</p>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Chức năng quản lý giải đấu</h2>
        <div class="action-grid">
          <router-link to="/tournament-admin/tournaments" class="action-card">
            <div class="action-icon">🏆</div>
            <div class="action-text">
              <div class="action-title">Quản lý giải đấu</div>
              <div class="action-desc">Thêm, sửa, hủy giải đấu</div>
            </div>
          </router-link>
          
          <router-link to="/tournament-admin/tournaments/create" class="action-card primary">
            <div class="action-icon">➕</div>
            <div class="action-text">
              <div class="action-title">Tạo giải đấu mới</div>
              <div class="action-desc">Tạo giải đấu mới cho CLB đăng ký</div>
            </div>
          </router-link>
          
          <router-link to="/tournament-admin/matches" class="action-card">
            <div class="action-icon">⚽</div>
            <div class="action-text">
              <div class="action-title">Quản lý trận đấu</div>
              <div class="action-desc">Lên lịch và chỉ định trọng tài</div>
            </div>
          </router-link>
          
          <router-link to="/tournament-admin/referees" class="action-card">
            <div class="action-icon">⚖️</div>
            <div class="action-text">
              <div class="action-title">Quản lý trọng tài</div>
              <div class="action-desc">Bổ nhiệm trọng tài cho trận đấu</div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js';

const authStore = useAuthStore();
</script>

<style scoped>
.tournament-admin-dashboard {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.quick-actions h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .action-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.action-card.primary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
  border-color: rgba(59, 130, 246, 0.3);
}

.action-icon {
  font-size: 2rem;
}

.action-title {
  font-weight: 600;
  color: white;
  font-size: 1rem;
}

.action-desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>
