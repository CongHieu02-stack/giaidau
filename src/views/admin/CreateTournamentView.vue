<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Tạo giải đấu mới</h1>
      
      <form @submit.prevent="handleSubmit" class="glass rounded-2xl p-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-white/80">Tên giải đấu</label>
            <input v-model="form.name" required class="form-input" placeholder="VD: GDU Open 2026">
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Bộ môn</label>
            <select v-model="form.sportCategoryId" required class="form-input">
              <option value="">Chọn bộ môn</option>
              <option v-for="s in sports" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Số đội tối thiểu</label>
            <input v-model.number="form.minTeams" type="number" required min="2" class="form-input" placeholder="2">
          </div>

          <div class="space-y-2">
            <label class="text-white/80">Số đội tối đa</label>
            <input v-model.number="form.maxTeams" type="number" required min="2" class="form-input" placeholder="16">
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Hạn đăng ký</label>
            <input v-model="form.registrationDeadline" type="datetime-local" required class="form-input">
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Ngày bắt đầu</label>
            <input v-model="form.startDate" type="date" required class="form-input">
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Ngày kết thúc</label>
            <input v-model="form.endDate" type="date" class="form-input">
          </div>
        </div>
        
        <div class="space-y-2">
          <label class="text-white/80">Thể lệ</label>
          <textarea v-model="form.rules" rows="4" class="form-input" placeholder="Mô tả thể lệ giải đấu..."></textarea>
        </div>
        
        <div class="flex gap-4">
          <button type="submit" :disabled="loading" class="btn-primary">
            <i v-if="loading" class="pi pi-spinner pi-spin mr-2"></i>
            {{ loading ? 'Đang tạo...' : 'Tạo giải đấu' }}
          </button>
          <router-link to="/admin/tournaments" class="btn-secondary">Hủy</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../../stores/auth.js';
import { tournamentService } from '../../services/TournamentService.js';
import { supabase } from '../../config/supabase.js';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const sports = ref([]);
const loading = ref(false);

const form = ref({
  name: '',
  sportCategoryId: '',
  minTeams: 4,
  maxTeams: 16,
  registrationDeadline: '',
  startDate: '',
  endDate: '',
  rules: ''
});

const handleSubmit = async () => {
  loading.value = true;
  const result = await tournamentService.createTournament(form.value, authStore.user?.id);
  if (result.isOk()) {
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo giải đấu mới.', life: 3000 });
    router.push('/admin/tournaments');
  } else {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: result.getError(), life: 5000 });
  }
  loading.value = false;
};

onMounted(async () => {
  const { data } = await supabase.from('sports_categories').select('*');
  sports.value = data || [];
});
</script>

<style scoped>
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
}
</style>
