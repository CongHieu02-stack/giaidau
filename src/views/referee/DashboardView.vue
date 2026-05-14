<template>
  <div class="referee-page">
    <div class="page-shell">
      <!-- Hero -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-flag"></i></div>
          <div>
            <h1 class="hero-title">Trọng tài Dashboard</h1>
            <p class="hero-sub">Xin chào, {{ authStore.userDisplayName }}</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon upcoming"><i class="pi pi-calendar"></i></div>
          <div class="stat-body">
            <div class="stat-value">{{ upcomingCount }}</div>
            <div class="stat-label">Trận sắp tới</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon live"><i class="pi pi-play"></i></div>
          <div class="stat-body">
            <div class="stat-value">{{ liveCount }}</div>
            <div class="stat-label">Đang diễn ra</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon done"><i class="pi pi-check-circle"></i></div>
          <div class="stat-body">
            <div class="stat-value">{{ completedCount }}</div>
            <div class="stat-label">Đã hoàn thành</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon total"><i class="pi pi-list"></i></div>
          <div class="stat-body">
            <div class="stat-value">{{ matches.length }}</div>
            <div class="stat-label">Tổng trận được giao</div>
          </div>
        </div>
      </div>

      <!-- Upcoming Matches -->
      <div class="section-card">
        <div class="section-header">
          <h2><i class="pi pi-calendar"></i> Trận đấu sắp tới</h2>
          <router-link to="/referee/matches" class="link-all">
            Xem tất cả <i class="pi pi-arrow-right"></i>
          </router-link>
        </div>

        <div v-if="loading" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i> Đang tải...
        </div>

        <div v-else-if="upcomingMatches.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>Chưa có trận đấu nào được giao</p>
        </div>

        <div v-else class="match-list">
          <div v-for="m in upcomingMatches.slice(0, 5)" :key="m.id" class="match-card">
            <!-- Single Heat Mode -->
            <div v-if="m.tournament?.tournament_mode === 'single_heat'" class="heat-match-card-dashboard">
              <div class="heat-icon-container">🏁</div>
              <div class="heat-info-container">
                <span class="heat-type">Lượt thi đấu tổng hợp</span>
                <span class="heat-desc">Chế độ thi đấu một lượt (Single Heat)</span>
                <div class="match-time-row">
                  <span class="match-time-label"><i class="pi pi-calendar mr-1"></i>{{ formatMatchDate(m.match_date) }}</span>
                  <span v-if="m.match_time" class="match-time-label ml-3"><i class="pi pi-clock mr-1"></i>{{ m.match_time }}</span>
                </div>
              </div>
            </div>

            <!-- Standard Mode -->
            <div v-else class="match-teams">
              <div class="team-side">
                <div class="team-logo">
                  <img v-if="m.home_club?.logo_url || m.home_user?.avatar_url" :src="m.home_club?.logo_url || m.home_user?.avatar_url" />
                  <span v-else>{{ getInitials(m.home_club?.name || m.home_user?.full_name) }}</span>
                </div>
                <span class="team-name">{{ m.home_club?.name || m.home_user?.full_name || 'TBD' }}</span>
              </div>
              <div class="match-center">
                <span class="vs-text">VS</span>
                <span class="match-time-label">{{ formatMatchDate(m.match_date) }}</span>
                <span v-if="m.match_time" class="match-time-label">{{ m.match_time }}</span>
              </div>
              <div class="team-side">
                <div class="team-logo">
                  <img v-if="m.away_club?.logo_url || m.away_user?.avatar_url" :src="m.away_club?.logo_url || m.away_user?.avatar_url" />
                  <span v-else>{{ getInitials(m.away_club?.name || m.away_user?.full_name) }}</span>
                </div>
                <span class="team-name">{{ m.away_club?.name || m.away_user?.full_name || 'TBD' }}</span>
              </div>
            </div>
            <div class="match-footer">
              <span class="match-meta-item">
                <i class="pi pi-map-marker"></i> {{ m.venue?.name || 'Chưa xác định' }}
              </span>
              <span class="match-meta-item">
                <i class="pi pi-trophy"></i> {{ m.tournament?.name || '' }}
              </span>
              <router-link :to="`/referee/matches/${m.id}`" class="btn-go">
                <i class="pi pi-arrow-right"></i> Vào trận
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { matchRepository } from '../../repositories/MatchRepository.js';

const authStore = useAuthStore();
const matches = ref([]);
const loading = ref(true);

const upcomingMatches = computed(() =>
  matches.value.filter(m => m.status === 'scheduled')
);
const liveCount = computed(() =>
  matches.value.filter(m => m.status === 'in_progress' || m.status === 'paused').length
);
const upcomingCount = computed(() => upcomingMatches.value.length);
const completedCount = computed(() =>
  matches.value.filter(m => m.status === 'completed').length
);

const getInitials = (name) =>
  name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

const formatMatchDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

onMounted(async () => {
  if (authStore.user) {
    const result = await matchRepository.findByReferee(authStore.user.id);
    if (result.isOk()) matches.value = result.getValue();
  }
  loading.value = false;
});
</script>

<style scoped>
.referee-page {
  min-height: 100vh;
  padding: 1.5rem 1.5rem 3rem;
}
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Hero */
.page-hero {
  position: relative;
  padding: 2rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem;
  overflow: hidden;
}
.hero-glow {
  position: absolute; top: -60px; left: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 1rem; position: relative; z-index: 1; }
.hero-icon {
  width: 56px; height: 56px; border-radius: 1rem; flex-shrink: 0;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: white;
  box-shadow: 0 8px 24px rgba(245,158,11,0.4);
}
.hero-title { font-size: 2rem; font-weight: 800; color: white; margin: 0; }
.hero-sub { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-top: 0.25rem; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.stat-card {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.25rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1rem;
}
.stat-icon {
  width: 48px; height: 48px; border-radius: 0.75rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem; flex-shrink: 0;
}
.stat-icon.upcoming { background: rgba(59,130,246,0.15); color: #60a5fa; }
.stat-icon.live { background: rgba(34,197,94,0.15); color: #4ade80; }
.stat-icon.done { background: rgba(139,92,246,0.15); color: #a78bfa; }
.stat-icon.total { background: rgba(245,158,11,0.15); color: #fbbf24; }
.stat-value { font-size: 1.5rem; font-weight: 800; color: white; }
.stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

/* Section Card */
.section-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem;
  overflow: hidden;
}
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.section-header h2 {
  font-size: 1.1rem; font-weight: 700; color: white; margin: 0;
  display: flex; align-items: center; gap: 0.5rem;
}
.section-header h2 i { color: #60a5fa; }
.link-all {
  font-size: 0.8rem; color: #60a5fa; text-decoration: none; font-weight: 600;
  display: flex; align-items: center; gap: 0.3rem;
  transition: color 0.2s;
}
.link-all:hover { color: #93c5fd; }

/* Match List */
.match-list { display: flex; flex-direction: column; }
.match-card {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.2s;
}
.match-card:hover { background: rgba(255,255,255,0.02); }
.match-card:last-child { border-bottom: none; }

.match-teams {
  display: flex; align-items: center; justify-content: center; gap: 1.5rem;
  margin-bottom: 0.75rem;
}
.team-side {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  flex: 1; min-width: 0;
}
.team-logo {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700; color: white;
  overflow: hidden;
}
.team-logo img { width: 100%; height: 100%; object-fit: cover; }
.team-name {
  font-size: 0.85rem; font-weight: 600; color: white;
  text-align: center; max-width: 120px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.match-center { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; flex-shrink: 0; }
.vs-text { font-size: 1rem; font-weight: 800; color: #f59e0b; }
.match-time-label { font-size: 0.7rem; color: rgba(255,255,255,0.4); }

.match-footer {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
}
.match-meta-item {
  font-size: 0.75rem; color: rgba(255,255,255,0.4);
  display: flex; align-items: center; gap: 0.3rem;
}
.match-meta-item i { font-size: 0.65rem; }
.btn-go {
  margin-left: auto;
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 1rem;
  background: rgba(59,130,246,0.15);
  border: 1px solid rgba(59,130,246,0.25);
  color: #60a5fa; font-size: 0.8rem; font-weight: 600;
  border-radius: 0.625rem; text-decoration: none;
  transition: all 0.2s;
}
.btn-go:hover { background: rgba(59,130,246,0.25); }

/* States */
.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 3rem; color: rgba(255,255,255,0.4); gap: 0.75rem;
}
.empty-state i { font-size: 2rem; }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-title { font-size: 1.5rem; }
}

/* Heat Dashboard Styles */
.heat-match-card-dashboard {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
  width: 100%;
}

.heat-icon-container {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.heat-info-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.heat-type {
  font-weight: 800;
  color: white;
  font-size: 1.1rem;
}

.heat-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.5rem;
}

.match-time-row {
  display: flex;
  align-items: center;
}
</style>
