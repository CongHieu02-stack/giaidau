<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Trọng tài Dashboard</h1>
      
      <div v-if="loading" class="text-center py-8">
        <i class="pi pi-spinner pi-spin text-4xl text-white mb-4"></i>
        <p class="text-white">Đang tải dữ liệu...</p>
      </div>
      
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="glass rounded-xl p-6 text-center">
            <i class="pi pi-calendar text-4xl text-blue-400 mb-3"></i>
            <p class="text-3xl font-bold text-white">{{ upcomingMatches }}</p>
            <p class="text-white/60">Trận sắp tới</p>
          </div>
          <div class="glass rounded-xl p-6 text-center">
            <i class="pi pi-play-circle text-4xl text-yellow-400 mb-3"></i>
            <p class="text-3xl font-bold text-white">{{ inProgressMatches }}</p>
            <p class="text-white/60">Trận đang diễn ra</p>
          </div>
          <div class="glass rounded-xl p-6 text-center">
            <i class="pi pi-check-circle text-4xl text-green-400 mb-3"></i>
            <p class="text-3xl font-bold text-white">{{ completedMatches }}</p>
            <p class="text-white/60">Trận đã kết thúc</p>
          </div>
        </div>

        <div class="glass rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-4">Lịch thi đấu</h2>
          <router-link to="/referee/matches" class="btn-primary inline-flex">
            <i class="pi pi-list mr-2"></i>
            Xem danh sách trận đấu ({{ totalMatches }} trận)
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { matchRepository } from '../../repositories/MatchRepository.js';

const authStore = useAuthStore();
const matches = ref([]);
const loading = ref(true);

const upcomingMatches = computed(() => {
  return matches.value.filter(m => m.status === 'scheduled').length;
});

const inProgressMatches = computed(() => {
  return matches.value.filter(m => m.status === 'in_progress' || m.status === 'paused').length;
});

const completedMatches = computed(() => {
  return matches.value.filter(m => m.status === 'completed').length;
});

const totalMatches = computed(() => matches.value.length);

onMounted(async () => {
  if (authStore.user) {
    console.log('[Referee Dashboard] Loading matches for referee:', authStore.user.id);
    const result = await matchRepository.findByReferee(authStore.user.id);
    if (result.isOk()) {
      matches.value = result.getValue();
      console.log('[Referee Dashboard] Matches loaded:', matches.value.length, matches.value);
    } else {
      console.error('[Referee Dashboard] Error loading matches:', result.getError());
    }
  }
  loading.value = false;
});
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
}
</style>
