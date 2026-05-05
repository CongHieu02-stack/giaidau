<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-white">Danh mục bộ môn</h1>
        <button @click="showAddModal = true" class="btn-primary">
          <i class="pi pi-plus mr-2"></i>
          Thêm bộ môn
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="sport in sports" :key="sport.id" class="sport-card">
          <div class="text-4xl mb-3">{{ sport.icon_url || '🏆' }}</div>
          <h3 class="text-xl font-bold text-white mb-2">{{ sport.name }}</h3>
          <p class="text-white/60 text-sm mb-4">{{ sport.description || 'Chưa có mô tả' }}</p>
          <div class="flex gap-2">
            <button @click="editSport(sport)" class="btn-action">
              <i class="pi pi-pencil"></i>
            </button>
            <button @click="deleteSport(sport.id)" class="btn-action bg-red-500/20 text-red-400">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../config/supabase.js';

const sports = ref([]);
const showAddModal = ref(false);

const loadSports = async () => {
  const { data } = await supabase.from('sports_categories').select('*');
  sports.value = data || [];
};

const deleteSport = async (id) => {
  if (confirm('Bạn có chắc muốn xóa bộ môn này?')) {
    await supabase.from('sports_categories').delete().eq('id', id);
    loadSports();
  }
};

const editSport = (sport) => {
  // TODO: Implement edit modal
  alert('Chức năng đang phát triển');
};

onMounted(loadSports);
</script>

<style scoped>
.sport-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  transition: all 0.3s;
}

.sport-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

.btn-primary {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
}

.btn-action {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
}
</style>
