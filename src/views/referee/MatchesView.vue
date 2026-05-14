<template>
  <div class="referee-page">
    <div class="page-shell">
      <!-- Hero -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-list"></i></div>
          <div>
            <h1 class="hero-title">Lịch thi đấu</h1>
            <p class="hero-sub">Danh sách các trận đấu được bổ nhiệm</p>
          </div>
        </div>
        <router-link to="/referee" class="btn-back">
          <i class="pi pi-arrow-left"></i> Dashboard
        </router-link>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <button
          v-for="f in filters" :key="f.value"
          class="filter-chip"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          <i :class="f.icon"></i>
          {{ f.label }}
          <span class="chip-count">{{ getCount(f.value) }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spinner pi-spin"></i> Đang tải...
      </div>

      <!-- Empty -->
      <div v-else-if="filteredMatches.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>Không có trận đấu nào</p>
      </div>

      <!-- Match Cards -->
      <div v-else class="matches-grid">
        <div
          v-for="(m, i) in filteredMatches" :key="m.id"
          class="match-card"
          :class="getCardClass(m.status)"
          :style="{ animationDelay: `${i * 0.05}s` }"
        >
          <!-- Status Badge -->
          <div class="card-status">
            <span class="status-badge" :class="getStatusClass(m.status)">
              <i :class="getStatusIcon(m.status)"></i>
              {{ getStatusText(m.status) }}
            </span>
            <span class="tournament-name">{{ m.tournament?.name }}</span>
          </div>

          <!-- Teams -->
          <div class="card-teams">
            <div class="team-col">
              <div class="team-logo">
                <img v-if="m.home_club?.logo_url || m.home_user?.avatar_url" :src="m.home_club?.logo_url || m.home_user?.avatar_url" />
                <span v-else>{{ getInitials(m.home_club?.name || m.home_user?.full_name) }}</span>
              </div>
              <span class="team-name">{{ m.home_club?.name || m.home_user?.full_name || 'TBD' }}</span>
            </div>

            <div class="score-col">
              <template v-if="m.status === 'completed' || m.status === 'in_progress' || m.status === 'paused'">
                <span class="score">{{ m.home_score ?? 0 }}</span>
                <span class="score-sep">-</span>
                <span class="score">{{ m.away_score ?? 0 }}</span>
              </template>
              <span v-else class="vs-badge">VS</span>
            </div>

            <div class="team-col">
              <div class="team-logo">
                <img v-if="m.away_club?.logo_url || m.away_user?.avatar_url" :src="m.away_club?.logo_url || m.away_user?.avatar_url" />
                <span v-else>{{ getInitials(m.away_club?.name || m.away_user?.full_name) }}</span>
              </div>
              <span class="team-name">{{ m.away_club?.name || m.away_user?.full_name || 'TBD' }}</span>
            </div>
          </div>

          <!-- Info -->
          <div class="card-info">
            <span class="info-item">
              <i class="pi pi-calendar"></i>
              {{ formatDate(m.match_date) }}
            </span>
            <span v-if="m.match_time" class="info-item">
              <i class="pi pi-clock"></i>
              {{ m.match_time }}
            </span>
            <span class="info-item">
              <i class="pi pi-map-marker"></i>
              {{ m.venue?.name || 'Chưa xác định' }}
            </span>
          </div>

          <!-- Action -->
          <router-link :to="`/referee/matches/${m.id}`" class="card-action">
            <template v-if="m.status === 'scheduled'">
              <i class="pi pi-play"></i> Vào điều khiển
            </template>
            <template v-else-if="m.status === 'in_progress' || m.status === 'paused'">
              <i class="pi pi-bolt"></i> Tiếp tục điều khiển
            </template>
            <template v-else>
              <i class="pi pi-eye"></i> Xem chi tiết
            </template>
          </router-link>
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
const activeFilter = ref('all');

const filters = [
  { value: 'all', label: 'Tất cả', icon: 'pi pi-list' },
  { value: 'scheduled', label: 'Chờ thi đấu', icon: 'pi pi-calendar' },
  { value: 'live', label: 'Đang diễn ra', icon: 'pi pi-play' },
  { value: 'completed', label: 'Đã kết thúc', icon: 'pi pi-check-circle' }
];

const filteredMatches = computed(() => {
  if (activeFilter.value === 'all') return matches.value;
  if (activeFilter.value === 'live')
    return matches.value.filter(m => m.status === 'in_progress' || m.status === 'paused');
  return matches.value.filter(m => m.status === activeFilter.value);
});

const getCount = (filter) => {
  if (filter === 'all') return matches.value.length;
  if (filter === 'live')
    return matches.value.filter(m => m.status === 'in_progress' || m.status === 'paused').length;
  return matches.value.filter(m => m.status === filter).length;
};

const getInitials = (name) =>
  name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusClass = (s) => ({
  'scheduled': 'st-scheduled',
  'in_progress': 'st-live',
  'paused': 'st-paused',
  'completed': 'st-done',
  'cancelled': 'st-cancel'
}[s] || 'st-scheduled');

const getStatusIcon = (s) => ({
  'scheduled': 'pi pi-clock',
  'in_progress': 'pi pi-play',
  'paused': 'pi pi-pause',
  'completed': 'pi pi-check-circle',
  'cancelled': 'pi pi-times-circle'
}[s] || 'pi pi-clock');

const getStatusText = (s) => ({
  'scheduled': 'Chờ thi đấu',
  'in_progress': 'Đang thi đấu',
  'paused': 'Tạm dừng',
  'completed': 'Đã kết thúc',
  'cancelled': 'Đã hủy'
}[s] || s);

const getCardClass = (s) => ({
  'in_progress': 'card-live',
  'paused': 'card-paused'
}[s] || '');

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
  padding: 6rem 1.5rem 3rem;
}
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.5rem;
}

/* Hero */
.page-hero {
  position: relative;
  padding: 2rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem;
  overflow: hidden;
  display: flex; align-items: center; gap: 1rem;
}
.hero-glow {
  position: absolute; top: -60px; left: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 1rem; flex: 1; z-index: 1; }
.hero-icon {
  width: 48px; height: 48px; border-radius: 0.75rem; flex-shrink: 0;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem; color: white;
}
.hero-title { font-size: 1.5rem; font-weight: 800; color: white; margin: 0; }
.hero-sub { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
.btn-back {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border-radius: 0.625rem;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 600;
  text-decoration: none; transition: all 0.2s; z-index: 1;
}
.btn-back:hover { background: rgba(255,255,255,0.12); color: white; }

/* Filters */
.filter-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.filter-chip {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.filter-chip:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
.filter-chip.active {
  background: rgba(59,130,246,0.15);
  border-color: rgba(59,130,246,0.3);
  color: #60a5fa;
}
.chip-count {
  background: rgba(255,255,255,0.1); padding: 0.1rem 0.45rem;
  border-radius: 999px; font-size: 0.7rem;
}
.filter-chip.active .chip-count {
  background: rgba(59,130,246,0.25);
}

/* Match Grid */
.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1rem;
}
.match-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem;
  padding: 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
  transition: all 0.3s;
  opacity: 0; animation: fadeUp 0.4s ease forwards;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.match-card:hover {
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.3);
}
.match-card.card-live {
  border-color: rgba(34,197,94,0.3);
  box-shadow: 0 0 20px rgba(34,197,94,0.08);
}
.match-card.card-paused {
  border-color: rgba(251,191,36,0.3);
}

/* Card Status */
.card-status { display: flex; align-items: center; justify-content: space-between; }
.status-badge {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.65rem; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700;
}
.st-scheduled { background: rgba(107,114,128,0.2); color: #d1d5db; }
.st-live { background: rgba(34,197,94,0.2); color: #86efac; animation: pulse 2s infinite; }
.st-paused { background: rgba(251,191,36,0.2); color: #fde68a; }
.st-done { background: rgba(99,102,241,0.2); color: #a5b4fc; }
.st-cancel { background: rgba(239,68,68,0.2); color: #fca5a5; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
.tournament-name {
  font-size: 0.7rem; color: rgba(255,255,255,0.35);
  max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Card Teams */
.card-teams {
  display: flex; align-items: center; justify-content: center; gap: 1rem;
}
.team-col {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; min-width: 0;
}
.team-logo {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
  border: 2px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700; color: white;
  overflow: hidden;
}
.team-logo img { width: 100%; height: 100%; object-fit: cover; }
.team-name {
  font-size: 0.8rem; font-weight: 600; color: white;
  text-align: center; max-width: 120px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.score-col {
  display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;
}
.score { font-size: 1.75rem; font-weight: 800; color: white; }
.score-sep { font-size: 1.25rem; color: rgba(255,255,255,0.3); }
.vs-badge {
  font-size: 0.85rem; font-weight: 800; color: #f59e0b;
  padding: 0.3rem 0.75rem;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 0.5rem;
}

/* Card Info */
.card-info { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.info-item {
  font-size: 0.72rem; color: rgba(255,255,255,0.4);
  display: flex; align-items: center; gap: 0.3rem;
}
.info-item i { font-size: 0.65rem; }

/* Card Action */
.card-action {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem;
  background: rgba(59,130,246,0.1);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 0.75rem;
  color: #60a5fa; font-size: 0.8rem; font-weight: 600;
  text-decoration: none; transition: all 0.2s;
}
.card-action:hover { background: rgba(59,130,246,0.2); transform: translateY(-1px); }

/* States */
.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 4rem; color: rgba(255,255,255,0.4); gap: 0.75rem;
}
.empty-state i { font-size: 2.5rem; }

@media (max-width: 500px) {
  .matches-grid { grid-template-columns: 1fr; }
}
</style>
