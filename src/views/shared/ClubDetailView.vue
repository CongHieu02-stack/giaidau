<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <div v-if="loading" class="flex justify-center py-16">
        <i class="pi pi-spinner pi-spin text-4xl text-white/60"></i>
      </div>
      
      <div v-else-if="club" class="space-y-6">
        <div class="glass rounded-2xl p-8">
          <div class="flex flex-col md:flex-row gap-6">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
              {{ getInitials(club.name) }}
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-white mb-2">{{ club.name }}</h1>
              <p class="text-white/70 mb-4">{{ club.description || 'Chưa có mô tả' }}</p>
              <div class="flex items-center gap-4">
                <span class="status-badge" :class="getStatusClass(club.status)">{{ getStatusText(club.status) }}</span>
                <span class="text-white/60">{{ club.member_count || 0 }} thành viên</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16">
        <h2 class="text-2xl font-bold text-white">Không tìm thấy câu lạc bộ</h2>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { clubRepository } from '../../repositories/ClubRepository.js';

const route = useRoute();
const club = ref(null);
const loading = ref(true);

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
const getStatusClass = (s) => ({ 'pending': 'bg-yellow-500/20 text-yellow-400', 'approved': 'bg-green-500/20 text-green-400' }[s] || 'bg-gray-500/20 text-gray-400');
const getStatusText = (s) => ({ 'pending': 'Chờ duyệt', 'approved': 'Đã duyệt' }[s] || s);

onMounted(async () => {
  const result = await clubRepository.findById(route.params.id);
  if (result.isOk()) club.value = result.getValue();
  loading.value = false;
});
</script>

<style scoped>
.status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
</style>
