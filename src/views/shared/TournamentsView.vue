<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Giải đấu</h1>
          <p class="text-white/60">Danh sách các giải đấu đang và sắp diễn ra</p>
        </div>
        <div class="flex gap-3">
          <select v-model="filterStatus" class="filter-select">
            <option value="">Tất cả trạng thái</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="registration_open">Đang mở đăng ký</option>
            <option value="ongoing">Đang diễn ra</option>
            <option value="completed">Đã kết thúc</option>
          </select>
        </div>
      </div>

      <!-- Tournament Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TournamentCard 
          v-for="tournament in filteredTournaments" 
          :key="tournament.id"
          :tournament="tournament"
        />
      </div>

      <!-- Empty State -->
      <div v-if="filteredTournaments.length === 0" class="text-center py-16">
        <i class="pi pi-trophy text-6xl text-white/20 mb-4"></i>
        <p class="text-white/60">Không có giải đấu nào</p>
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
const loading = ref(false);

const filteredTournaments = computed(() => {
  if (!filterStatus.value) return tournaments.value;
  return tournaments.value.filter(t => t.status === filterStatus.value);
});

onMounted(async () => {
  loading.value = true;
  try {
    const result = await tournamentRepository.findAll();
    if (result.isOk()) {
      tournaments.value = result.getValue();
    }
  } catch (error) {
    console.error('Failed to load tournaments:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.filter-select {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
  min-width: 180px;
}

.filter-select option {
  background: #1e1b4b;
  color: white;
}
</style>
