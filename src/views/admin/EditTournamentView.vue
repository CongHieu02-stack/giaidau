<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Chỉnh sửa giải đấu</h1>
      
      <div v-if="loading" class="text-center py-16">
        <i class="pi pi-spinner pi-spin text-4xl text-white/60"></i>
      </div>
      
      <form v-else @submit.prevent="handleSubmit" class="glass rounded-2xl p-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-white/80">Tên giải đấu</label>
            <input v-model="form.name" required class="form-input">
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Số đội tối đa</label>
            <input v-model.number="form.maxTeams" type="number" required class="form-input">
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Hạn đăng ký</label>
            <input v-model="form.registrationDeadline" type="datetime-local" required class="form-input">
          </div>
          
          <div class="space-y-2">
            <label class="text-white/80">Ngày bắt đầu</label>
            <input v-model="form.startDate" type="date" required class="form-input">
          </div>
        </div>
        
        <div class="space-y-2">
          <label class="text-white/80">Thể lệ</label>
          <textarea v-model="form.rules" rows="4" class="form-input"></textarea>
        </div>
        
        <div class="flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">
            <i v-if="saving" class="pi pi-spinner pi-spin mr-2"></i>
            {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
          <router-link to="/admin/tournaments" class="btn-secondary">Hủy</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../../stores/auth.js';
import { tournamentService } from '../../services/TournamentService.js';
import { tournamentRepository } from '../../repositories/TournamentRepository.js';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const loading = ref(true);
const saving = ref(false);
const form = ref({});

onMounted(async () => {
  const result = await tournamentRepository.findById(route.params.id);
  if (result.isOk()) {
    const t = result.getValue();
    form.value = {
      name: t.name,
      maxTeams: t.maxTeams,
      registrationDeadline: t.registrationDeadline,
      startDate: t.startDate,
      rules: t.rules
    };
  }
  loading.value = false;
});

const handleSubmit = async () => {
  saving.value = true;
  const result = await tournamentService.updateTournament(route.params.id, form.value, authStore.user?.id);
  if (result.isOk()) {
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật thông tin giải đấu.', life: 3000 });
    router.push('/admin/tournaments');
  } else {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: result.getError(), life: 5000 });
  }
  saving.value = false;
};
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
