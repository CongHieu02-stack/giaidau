<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Hero Section -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-desktop"></i></div>
          <div>
            <h1 class="hero-title">Admin Dashboard</h1>
            <p class="hero-subtitle">Bảng điều khiển quản trị MyLeague.</p>
          </div>
        </div>
      </div>
      
      <div class="stats-overview">
        <div class="stat-item">
          <div class="stat-icon-mini blue"><i class="pi pi-users"></i></div>
          <div class="stat-details">
            <span class="stat-val">-</span>
            <span class="stat-lab">Người dùng</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon-mini green"><i class="pi pi-trophy"></i></div>
          <div class="stat-details">
            <span class="stat-val">-</span>
            <span class="stat-lab">Giải đấu</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon-mini purple"><i class="pi pi-building"></i></div>
          <div class="stat-details">
            <span class="stat-val">-</span>
            <span class="stat-lab">Câu lạc bộ</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon-mini orange"><i class="pi pi-flag"></i></div>
          <div class="stat-details">
            <span class="stat-val">-</span>
            <span class="stat-lab">Trọng tài</span>
          </div>
        </div>
      </div>

      <div class="action-grid">
        <router-link to="/admin/tournaments/create" class="action-card primary">
          <div class="card-glow"></div>
          <div class="action-icon-box blue">
            <i class="pi pi-plus"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Tạo giải đấu</h3>
            <p class="action-desc">Khởi tạo giải đấu mới</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <router-link to="/admin/clubs" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box green">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Duyệt CLB</h3>
            <p class="action-desc">Quản lý phê duyệt câu lạc bộ</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>

        <router-link to="/admin/users" class="action-card">
          <div class="card-glow"></div>
          <div class="action-icon-box purple">
            <i class="pi pi-user-edit"></i>
          </div>
          <div class="action-info">
            <h3 class="action-name">Quản lý users</h3>
            <p class="action-desc">Phân quyền và quản lý tài khoản</p>
          </div>
          <div class="card-arrow"><i class="pi pi-chevron-right"></i></div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
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
.stat-icon-mini.blue { background: rgba(59,130,246,0.1); color: #60a5fa; }
.stat-icon-mini.green { background: rgba(16,185,129,0.1); color: #34d399; }
.stat-icon-mini.purple { background: rgba(139,92,246,0.1); color: #a78bfa; }
.stat-icon-mini.orange { background: rgba(245,158,11,0.1); color: #fbbf24; }
.stat-val { display: block; font-size: 1.5rem; font-weight: 800; color: white; }
.stat-lab { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.4); }

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
.action-icon-box {
  width: 64px; height: 64px; border-radius: 1.25rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; transition: transform 0.3s;
}
.action-card:hover .action-icon-box { transform: scale(1.1); }
.blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
.purple { background: rgba(139, 92, 246, 0.1); color: #a78bfa; }
.green { background: rgba(16, 185, 129, 0.1); color: #34d399; }

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
