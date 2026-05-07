<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">

      <!-- Page Hero -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon">
            <i class="pi pi-trophy"></i>
          </div>
          <div>
            <h1 class="hero-title">Giải đấu</h1>
            <p class="hero-subtitle">Khám phá các giải đấu đang và sắp diễn ra</p>
          </div>
        </div>

        <!-- Search + Filter Row -->
        <div class="controls-row">
          <div class="search-wrap">
            <i class="pi pi-search search-ico"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm giải đấu..."
              class="search-field"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-ico">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="filter-chips">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              :class="['chip', { active: filterStatus === opt.value }]"
              @click="filterStatus = opt.value"
            >
              <i :class="opt.icon"></i>
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-pill" v-for="s in statsPills" :key="s.label">
          <span class="pill-val">{{ s.val }}</span>
          <span class="pill-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="skeletons">
        <div v-for="n in 6" :key="n" class="skeleton-card">
          <div class="sk-header"></div>
          <div class="sk-body">
            <div class="sk-line w70"></div>
            <div class="sk-line w50"></div>
            <div class="sk-line w40"></div>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div v-else-if="filteredTournaments.length > 0" class="tournaments-grid">
        <TournamentCard
          v-for="(tournament, i) in filteredTournaments"
          :key="tournament.id"
          :tournament="tournament"
          :style="{ animationDelay: `${i * 0.06}s` }"
        />
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="pi pi-trophy"></i></div>
        <h3>Không tìm thấy giải đấu</h3>
        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import TournamentCard from '../../components/common/TournamentCard.vue';
import { tournamentRepository } from '../../repositories/TournamentRepository.js';

const tournaments = ref([]);
const filterStatus = ref('');
const searchQuery = ref('');
const loading = ref(false);

const statusOptions = [
  { value: '', label: 'Tất cả', icon: 'pi pi-list' },
  { value: 'upcoming', label: 'Sắp diễn ra', icon: 'pi pi-clock' },
  { value: 'registration_open', label: 'Mở đăng ký', icon: 'pi pi-user-plus' },
  { value: 'ongoing', label: 'Đang diễn ra', icon: 'pi pi-play' },
  { value: 'completed', label: 'Đã kết thúc', icon: 'pi pi-check-circle' },
];

const filteredTournaments = computed(() => {
  let list = tournaments.value;
  if (filterStatus.value) list = list.filter(t => t.status === filterStatus.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(t => t.name?.toLowerCase().includes(q));
  }
  return list;
});

const statsPills = computed(() => [
  { val: tournaments.value.length, label: 'Tổng giải đấu' },
  { val: tournaments.value.filter(t => t.status === 'registration_open').length, label: 'Đang mở đăng ký' },
  { val: tournaments.value.filter(t => t.status === 'ongoing').length, label: 'Đang diễn ra' },
  { val: tournaments.value.filter(t => t.status === 'completed').length, label: 'Đã kết thúc' },
]);

onMounted(async () => {
  loading.value = true;
  try {
    const result = await tournamentRepository.findAll();
    if (result.isOk()) tournaments.value = result.getValue();
  } catch (e) {
    console.error('Failed to load tournaments:', e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  padding: 6rem 1.5rem 3rem;
}

/* ── Hero ── */
.page-hero {
  position: relative;
  margin-bottom: 1.5rem;
  padding: 2rem 2rem 1.5rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -60px; left: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%);
  pointer-events: none;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.hero-icon {
  width: 56px; height: 56px;
  border-radius: 1rem;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: white;
  box-shadow: 0 8px 24px rgba(245,158,11,0.4);
  flex-shrink: 0;
}

.hero-title {
  font-size: 2rem; font-weight: 800; color: white;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-top: 0.25rem;
}

/* ── Controls ── */
.controls-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 360px;
}

.search-ico {
  position: absolute; left: 0.875rem; top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.35); font-size: 0.9rem;
}

.search-field {
  width: 100%;
  padding: 0.7rem 2.5rem 0.7rem 2.5rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.875rem;
  color: white; font-size: 0.875rem;
  transition: all 0.2s;
}

.search-field:focus {
  outline: none;
  border-color: rgba(245,158,11,0.5);
  background: rgba(255,255,255,0.09);
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}

.search-field::placeholder { color: rgba(255,255,255,0.3); }

.clear-ico {
  position: absolute; right: 0.75rem; top: 50%;
  transform: translateY(-50%);
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; cursor: pointer; transition: all 0.2s;
}

.clear-ico:hover { background: rgba(239,68,68,0.3); color: #fca5a5; }

.filter-chips {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}

.chip {
  display: flex; align-items: center; gap: 0.375rem;
  padding: 0.45rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8rem; font-weight: 500;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  cursor: pointer; transition: all 0.2s;
}

.chip:hover { background: rgba(255,255,255,0.1); color: white; }

.chip.active {
  background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(239,68,68,0.2));
  border-color: rgba(245,158,11,0.5);
  color: #fcd34d;
  box-shadow: 0 0 12px rgba(245,158,11,0.15);
}

/* ── Stats Bar ── */
.stats-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat-pill {
  flex: 1; min-width: 130px;
  display: flex; flex-direction: column; align-items: center;
  padding: 0.875rem 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 1rem;
  transition: all 0.2s;
}

.stat-pill:hover { background: rgba(255,255,255,0.06); }

.pill-val {
  font-size: 1.75rem; font-weight: 800; color: white; line-height: 1;
}

.pill-label {
  font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-top: 0.25rem;
}

/* ── Grid ── */
.tournaments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.5rem;
}

/* ── Skeleton ── */
.skeletons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  border-radius: 1.25rem;
  overflow: hidden;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  animation: shimmer 1.8s infinite;
}

.sk-header { height: 140px; background: rgba(255,255,255,0.06); }
.sk-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
.sk-line { height: 12px; border-radius: 6px; background: rgba(255,255,255,0.07); }
.w70 { width: 70%; }
.w50 { width: 50%; }
.w40 { width: 40%; }

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Empty ── */
.empty-state {
  text-align: center; padding: 5rem 1rem;
}

.empty-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem; color: rgba(245,158,11,0.5);
}

.empty-state h3 {
  font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem;
}

.empty-state p { color: rgba(255,255,255,0.4); font-size: 0.875rem; }
</style>
