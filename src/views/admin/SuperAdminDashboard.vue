<template>
  <div class="super-admin-dashboard">
    <div class="container">
      <h1 class="page-title">Dashboard Quản trị viên hệ thống</h1>
      <p class="page-subtitle">Xin chào {{ authStore.userDisplayName }}</p>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_users }}</div>
            <div class="stat-label">Người dùng</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon clubs">🏢</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_clubs }}</div>
            <div class="stat-label">Câu lạc bộ</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon tournaments">🏆</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.active_tournaments }}</div>
            <div class="stat-label">Giải đấu đang diễn ra</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon referees">⚖️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_referees }}</div>
            <div class="stat-label">Trọng tài</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quản lý nhanh</h2>
        <div class="action-grid">
          <router-link to="/admin/users" class="action-card">
            <div class="action-icon">👤</div>
            <div class="action-text">
              <div class="action-title">Quản lý người dùng</div>
              <div class="action-desc">Khóa/mở khóa, phân quyền</div>
            </div>
          </router-link>
          
          <router-link to="/admin/sports" class="action-card">
            <div class="action-icon">🏅</div>
            <div class="action-text">
              <div class="action-title">Quản lý bộ môn</div>
              <div class="action-desc">Thêm, sửa, xóa bộ môn</div>
            </div>
          </router-link>
          
          <router-link to="/club-admin/approvals" class="action-card">
            <div class="action-icon">🏢</div>
            <div class="action-text">
              <div class="action-title">Quản lý CLB</div>
              <div class="action-desc">{{ stats.pending_club_approvals }} CLB chờ duyệt</div>
            </div>
          </router-link>
          
          <router-link to="/tournament-admin" class="action-card">
            <div class="action-icon">🏆</div>
            <div class="action-text">
              <div class="action-title">Quản lý giải đấu</div>
              <div class="action-desc">{{ stats.pending_tournament_regs }} đăng ký chờ duyệt</div>
            </div>
          </router-link>
          
          <router-link to="/admin/system" class="action-card">
            <div class="action-icon">⚙️</div>
            <div class="action-text">
              <div class="action-title">Cài đặt hệ thống</div>
              <div class="action-desc">Cấu hình hệ thống</div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Pending Approvals -->
      <div class="pending-section" v-if="stats.pending_club_approvals > 0 || stats.pending_tournament_regs > 0">
        <h2>Chờ phê duyệt</h2>
        <div class="pending-list">
          <div class="pending-item warning" v-if="stats.pending_club_approvals > 0">
            <span class="pending-icon">⚠️</span>
            <span>{{ stats.pending_club_approvals }} câu lạc bộ đang chờ duyệt</span>
            <router-link to="/club-admin/approvals" class="pending-link">Xem ngay →</router-link>
          </div>
          <div class="pending-item warning" v-if="stats.pending_tournament_regs > 0">
            <span class="pending-icon">⚠️</span>
            <span>{{ stats.pending_tournament_regs }} đăng ký giải đấu chờ duyệt</span>
            <router-link to="/tournament-admin/tournaments" class="pending-link">Xem ngay →</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { supabase } from '../../config/supabase.js';

const authStore = useAuthStore();

const stats = ref({
  total_users: 0,
  total_referees: 0,
  total_clubs: 0,
  active_tournaments: 0,
  completed_tournaments: 0,
  pending_member_requests: 0,
  pending_club_approvals: 0,
  pending_tournament_regs: 0
});

const loading = ref(true);

async function loadStats() {
  try {
    // Load from dashboard stats view
    const { data, error } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .single();
    
    if (error) {
      console.error('Error loading stats:', error);
      // Fallback: calculate manually
      await loadStatsManual();
    } else {
      stats.value = data;
    }
  } catch (err) {
    console.error('Error:', err);
    await loadStatsManual();
  } finally {
    loading.value = false;
  }
}

async function loadStatsManual() {
  // Load users count
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('status', 'active');
  
  // Load clubs count
  const { count: clubsCount } = await supabase
    .from('clubs')
    .select('*', { count: 'exact' })
    .eq('status', 'approved');
  
  // Load pending clubs
  const { count: pendingClubs } = await supabase
    .from('clubs')
    .select('*', { count: 'exact' })
    .eq('status', 'pending');
  
  // Load active tournaments
  const { count: activeTournaments } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact' })
    .in('status', ['ongoing', 'registration_open']);
  
  stats.value = {
    total_users: usersCount || 0,
    total_clubs: clubsCount || 0,
    pending_club_approvals: pendingClubs || 0,
    active_tournaments: activeTournaments || 0
  };
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.super-admin-dashboard {
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgba(59, 130, 246, 0.2);
}

.stat-icon.users { background: rgba(59, 130, 246, 0.2); }
.stat-icon.clubs { background: rgba(16, 185, 129, 0.2); }
.stat-icon.tournaments { background: rgba(245, 158, 11, 0.2); }
.stat-icon.referees { background: rgba(139, 92, 246, 0.2); }

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

/* Quick Actions */
.quick-actions {
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
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .action-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 1.5rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
}

.action-title {
  font-weight: 600;
  color: white;
  font-size: 1rem;
}

.action-desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

/* Pending Section */
.pending-section {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
}

.pending-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
}

.pending-item.warning {
  background: rgba(245, 158, 11, 0.2);
}

.pending-link {
  margin-left: auto;
  color: #60a5fa;
  text-decoration: none;
  font-weight: 500;
}

.pending-link:hover {
  text-decoration: underline;
}
</style>
