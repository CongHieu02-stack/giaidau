<template>
  <div class="super-admin-dashboard">
    <div class="max-w-7xl mx-auto">
      <!-- Hero Section -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-desktop"></i></div>
          <div>
            <h1 class="hero-title">Dashboard Quản lý hệ thống</h1>
            <p class="hero-subtitle">Chào mừng trở lại, <strong>{{ authStore.userDisplayName }}</strong>. Đây là bảng điều khiển quản trị toàn diện của MyLeague.</p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-overview">
        <div class="stat-item">
          <div class="stat-icon-mini users"><i class="pi pi-users"></i></div>
          <div class="stat-details">
            <span class="stat-val">{{ stats.total_users }}</span>
            <span class="stat-lab">Người dùng</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon-mini clubs"><i class="pi pi-building"></i></div>
          <div class="stat-details">
            <span class="stat-val">{{ stats.total_clubs }}</span>
            <span class="stat-lab">Câu lạc bộ</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon-mini tourneys"><i class="pi pi-trophy"></i></div>
          <div class="stat-details">
            <span class="stat-val">{{ stats.active_tournaments }}</span>
            <span class="stat-lab">Giải đấu</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon-mini refs"><i class="pi pi-shield"></i></div>
          <div class="stat-details">
            <span class="stat-val">{{ stats.total_referees }}</span>
            <span class="stat-lab">Trọng tài</span>
          </div>
        </div>
      </div>

      <!-- Action Grid -->
      <div class="action-grid">
        <router-link to="/admin/users" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box blue">
            <i class="pi pi-users"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý người dùng</h3>
            <p class="action-desc">Khóa/mở khóa, phân quyền và quản lý tài khoản</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <router-link to="/admin/sports" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box purple">
            <i class="pi pi-star"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý bộ môn</h3>
            <p class="action-desc">Thêm, sửa, xóa các bộ môn thi đấu</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <router-link to="/club-admin/approvals" class="action-card" :class="{ 'has-pending': stats.pending_club_approvals > 0 }">
          <div class="card-glow"></div>
          <div class="action-icon-box green">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Phê duyệt CLB</h3>
            <p class="action-desc">{{ stats.pending_club_approvals > 0 ? stats.pending_club_approvals + ' CLB đang chờ duyệt' : 'Quản lý danh sách câu lạc bộ' }}</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <router-link to="/admin/tournaments" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box orange">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý giải đấu</h3>
            <p class="action-desc">Danh sách và cấu hình các giải đấu toàn hệ thống</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <router-link to="/admin/tournaments/create" class="action-card primary">
          <div class="card-glow"></div>
          <div class="action-icon-box blue">
            <i class="pi pi-plus"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Tạo giải đấu mới</h3>
            <p class="action-desc">Khởi tạo giải đấu mới cho cộng đồng</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>
      </div>

      <!-- Additional Pending Section if needed -->
      <div class="pending-summary" v-if="stats.pending_club_approvals > 0">
        <div class="alert-box warning">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Bạn có <strong>{{ stats.pending_club_approvals }}</strong> câu lạc bộ đang chờ phê duyệt.</span>
          <router-link to="/club-admin/approvals" class="alert-link">Xem ngay →</router-link>
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
  pending_club_approvals: 0
});

const loading = ref(true);

async function loadStats() {
  if (!authStore.isSuperAdmin) return;
  
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
  if (!authStore.isSuperAdmin) return;
  
  // Load users count
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('status', 'active');
  
  // Load referees count
  const { count: refereesCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'referee');
  
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
    total_referees: refereesCount || 0,
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
.super-admin-dashboard { padding: 2rem 1.5rem; }
.max-w-7xl { max-width: 80rem; margin: 0 auto; }

/* ── Hero ── */
.page-hero {
  position: relative; margin-bottom: 2rem;
  padding: 3rem; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 2.5rem; overflow: hidden;
}
.hero-glow {
  position: absolute; top: -100px; left: -100px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 2rem; position: relative; z-index: 1; }
.hero-icon {
  width: 80px; height: 80px; border-radius: 1.5rem; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: white;
  box-shadow: 0 20px 40px rgba(99,102,241,0.3);
}
.hero-title { font-size: 2.5rem; font-weight: 800; color: white; line-height: 1.1; margin: 0; }
.hero-subtitle { font-size: 1.1rem; color: rgba(255,255,255,0.5); margin-top: 0.75rem; }
.hero-subtitle strong { color: #818cf8; }

/* ── Stats Overview ── */
.stats-overview {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;
  margin-bottom: 2rem;
}
.stat-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.25rem; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 1.5rem;
}
.stat-icon-mini {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
}
.stat-icon-mini.users { background: rgba(59,130,246,0.1); color: #60a5fa; }
.stat-icon-mini.clubs { background: rgba(16,185,129,0.1); color: #34d399; }
.stat-icon-mini.tourneys { background: rgba(245,158,11,0.1); color: #fbbf24; }
.stat-icon-mini.refs { background: rgba(139,92,246,0.1); color: #a78bfa; }
.stat-val { display: block; font-size: 1.5rem; font-weight: 800; color: white; }
.stat-lab { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.4); }

/* ── Action Grid ── */
.action-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;
  margin-bottom: 2rem;
}
.action-card {
  position: relative; padding: 2rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 2rem; text-decoration: none;
  display: flex; align-items: center; gap: 1.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.action-card:hover {
  transform: translateY(-8px);
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}
.action-card.primary {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08));
  border-color: rgba(99, 102, 241, 0.2);
}
.action-card.has-pending {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.05);
}
.action-icon-box {
  width: 64px; height: 64px; border-radius: 1.25rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; transition: transform 0.3s;
}
.action-card:hover .action-icon-box { transform: scale(1.1); }

.blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
.purple { background: rgba(139, 92, 246, 0.1); color: #a78bfa; }
.green { background: rgba(16, 185, 129, 0.1); color: #34d399; }
.orange { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }

.action-info { flex: 1; }
.action-name { font-size: 1.25rem; font-weight: 700; color: white; margin: 0; }
.action-desc { font-size: 0.9rem; color: rgba(255,255,255,0.4); margin: 0.4rem 0 0; line-height: 1.4; }

.card-arrow { color: rgba(255,255,255,0.15); font-size: 1.25rem; transition: transform 0.3s, color 0.3s; }
.action-card:hover .card-arrow { transform: translateX(5px); color: white; }

/* ── Alert Box ── */
.pending-summary { margin-top: 2rem; }
.alert-box {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.25rem 2rem; border-radius: 1.5rem;
  font-size: 1rem; color: white;
}
.alert-box.warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.alert-box i { font-size: 1.25rem; color: #fbbf24; }
.alert-link { margin-left: auto; color: #fbbf24; font-weight: 700; text-decoration: none; }
.alert-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .page-hero { padding: 2rem; }
  .hero-title { font-size: 1.75rem; }
  .action-card { padding: 1.5rem; }
  .stats-overview { grid-template-columns: repeat(2, 1fr); }
}
</style>
