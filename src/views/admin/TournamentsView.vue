<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-white">Quản lý giải đấu</h1>
        <router-link to="/admin/tournaments/create" class="btn-primary">
          <i class="pi pi-plus mr-2"></i>
          Tạo giải đấu
        </router-link>
      </div>

      <div class="glass rounded-2xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="text-left p-4 text-white/80 font-medium">Tên giải</th>
              <th class="text-left p-4 text-white/80 font-medium">Bộ môn</th>
              <th class="text-left p-4 text-white/80 font-medium">Trạng thái</th>
              <th class="text-left p-4 text-white/80 font-medium">Đăng ký</th>
              <th class="text-left p-4 text-white/80 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tournaments" :key="t.id" class="border-t border-white/10">
              <td class="p-4 text-white">{{ t.name }}</td>
              <td class="p-4 text-white/70">{{ t.sport_category?.name }}</td>
              <td class="p-4">
                <span class="status-badge" :class="getStatusClass(t.status)">{{ getStatusText(t.status) }}</span>
              </td>
              <td class="p-4 text-white/70">{{ t.registration_count || 0 }}/{{ t.max_teams }}</td>
              <td class="p-4">
                <div class="flex gap-2">
                  <router-link :to="`/admin/tournaments/${t.id}/edit`" class="btn-action">
                    <i class="pi pi-pencil"></i>
                  </router-link>
                  <button @click="cancelTournament(t.id)" class="btn-action bg-red-500/20 text-red-400">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
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
import { tournamentRepository } from '../../repositories/TournamentRepository.js';

const tournaments = ref([]);

const getStatusClass = (s) => ({
  'upcoming': 'bg-gray-500/20 text-gray-400',
  'registration_open': 'bg-green-500/20 text-green-400',
  'ongoing': 'bg-blue-500/20 text-blue-400',
  'completed': 'bg-purple-500/20 text-purple-400',
  'cancelled': 'bg-red-500/20 text-red-400'
}[s] || 'bg-gray-500/20');

const getStatusText = (s) => ({
  'upcoming': 'Sắp diễn ra',
  'registration_open': 'Mở đăng ký',
  'ongoing': 'Đang diễn ra',
  'completed': 'Đã kết thúc',
  'cancelled': 'Đã hủy'
}[s] || s);

const cancelTournament = async (id) => {
  if (confirm('Bạn có chắc muốn hủy giải đấu này?')) {
    await tournamentRepository.cancel(id, 'Hủy bởi admin');
    loadTournaments();
  }
};

const loadTournaments = async () => {
  const result = await tournamentRepository.findAll();
  if (result.isOk()) tournaments.value = result.getValue();
};

onMounted(loadTournaments);
</script>

<style scoped>
.btn-primary {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
}

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
  transition: all 0.2s;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
