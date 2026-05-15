<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">
      
      <!-- Hero Section -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-desktop"></i></div>
          <div>
            <h1 class="hero-title">Dashboard Quản lý</h1>
            <p class="hero-subtitle">Chào mừng trở lại, <strong>{{ authStore.userDisplayName }}</strong>. Đây là bảng điều khiển cho các hoạt động giải đấu.</p>
          </div>
        </div>
      </div>

      <!-- Quick Stats / Actions Grid -->
      <div class="action-grid">
        
        <!-- Tournament Management -->
        <router-link to="/tournament-admin/tournaments" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box orange">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý giải đấu</h3>
            <p class="action-desc">Danh sách, chỉnh sửa và cấu hình giải đấu của bạn</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <!-- Create Tournament -->
        <router-link to="/tournament-admin/tournaments/create" class="action-card primary">
          <div class="card-glow"></div>
          <div class="action-icon-box blue">
            <i class="pi pi-plus"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Tạo giải đấu mới</h3>
            <p class="action-desc">Khởi tạo giải đấu mới cho các đội đăng ký tham gia</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <!-- Match Management -->
        <router-link to="/tournament-admin/matches" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box green">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý trận đấu</h3>
            <p class="action-desc">Lên lịch thi đấu và phân công trọng tài điều hành</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <!-- Referee Management -->
        <router-link to="/tournament-admin/referees" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box purple">
            <i class="pi pi-shield"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý trọng tài</h3>
            <p class="action-desc">Quản lý đội ngũ trọng tài và lịch làm việc</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <!-- Venue Management -->
        <router-link to="/tournament-admin/venues" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box red">
            <i class="pi pi-map-marker"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý sân đấu</h3>
            <p class="action-desc">Cập nhật thông tin và trạng thái các địa điểm thi đấu</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js';

const authStore = useAuthStore();
</script>

<style scoped>
.page-wrapper { min-height: 100vh; padding: 2rem 1.5rem; }
.max-w-7xl { max-width: 80rem; margin: 0 auto; }

/* ── Hero ── */
.page-hero {
  position: relative; margin-bottom: 3rem;
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

/* ── Action Grid ── */
.action-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;
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
.action-card.primary:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12));
}

.action-icon-box {
  width: 64px; height: 64px; border-radius: 1.25rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; transition: transform 0.3s;
}
.action-card:hover .action-icon-box { transform: scale(1.1); }

.orange { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
.blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
.green { background: rgba(16, 185, 129, 0.1); color: #34d399; }
.purple { background: rgba(139, 92, 246, 0.1); color: #a78bfa; }
.red { background: rgba(239, 68, 68, 0.1); color: #f87171; }

.action-info { flex: 1; }
.action-name { font-size: 1.25rem; font-weight: 700; color: white; margin: 0; }
.action-desc { font-size: 0.9rem; color: rgba(255,255,255,0.4); margin: 0.4rem 0 0; line-height: 1.4; }

.card-arrow { color: rgba(255,255,255,0.15); font-size: 1.25rem; transition: transform 0.3s, color 0.3s; }
.action-card:hover .card-arrow { transform: translateX(5px); color: white; }

@media (max-width: 640px) {
  .page-hero { padding: 2rem; }
  .hero-title { font-size: 1.75rem; }
  .action-card { padding: 1.5rem; }
}
</style>
