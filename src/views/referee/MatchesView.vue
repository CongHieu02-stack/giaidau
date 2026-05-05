<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Danh sách trận đấu</h1>
      
      <div class="glass rounded-2xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="text-left p-4 text-white/80">Trận đấu</th>
              <th class="text-left p-4 text-white/80">Thời gian</th>
              <th class="text-left p-4 text-white/80">Sân</th>
              <th class="text-left p-4 text-white/80">Trạng thái</th>
              <th class="text-left p-4 text-white/80">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in matches" :key="m.id" class="border-t border-white/10">
              <td class="p-4 text-white">{{ m.home_club?.name }} vs {{ m.away_club?.name }}</td>
              <td class="p-4 text-white/70">{{ m.match_date }} {{ m.match_time }}</td>
              <td class="p-4 text-white/70">{{ m.venue?.name }}</td>
              <td class="p-4">
                <span class="status-badge" :class="getStatusClass(m.status)">{{ getStatusText(m.status) }}</span>
              </td>
              <td class="p-4">
                <router-link :to="`/referee/matches/${m.id}`" class="btn-action">
                  <i class="pi pi-play"></i>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { matchRepository } from '../../repositories/MatchRepository.js';

const authStore = useAuthStore();
const matches = ref([]);

const getStatusClass = (s) => ({
  'scheduled': 'bg-gray-500/20 text-gray-400',
  'in_progress': 'bg-green-500/20 text-green-400',
  'completed': 'bg-blue-500/20 text-blue-400'
}[s] || 'bg-gray-500/20');

const getStatusText = (s) => ({
  'scheduled': 'Chờ thi đấu',
  'in_progress': 'Đang thi đấu',
  'completed': 'Đã kết thúc'
}[s] || s);

onMounted(async () => {
  if (authStore.user) {
    const result = await matchRepository.findByReferee(authStore.user.id);
    if (result.isOk()) matches.value = result.getValue();
  }
});
</script>

<style scoped>
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-action {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
}
</style>
