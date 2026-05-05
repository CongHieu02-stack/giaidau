<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center space-x-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
            <i class="pi pi-trophy text-white text-2xl"></i>
          </div>
          <span class="text-3xl font-bold gradient-text">MyLeague</span>
        </router-link>
      </div>

      <div class="glass rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-bold text-white text-center mb-2">Quên mật khẩu</h1>
        <p class="text-white/60 text-center mb-6">Nhập email để nhận link đặt lại mật khẩu</p>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Email</label>
            <div class="relative">
              <i class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
              <input
                v-model="email"
                type="email"
                required
                placeholder="your@email.com"
                class="form-input"
              />
            </div>
          </div>

          <button type="submit" :disabled="loading" class="w-full btn-submit">
            <i v-if="loading" class="pi pi-spinner pi-spin mr-2"></i>
            <span>{{ loading ? 'Đang gửi...' : 'Gửi link đặt lại' }}</span>
          </button>
        </form>

        <div v-if="message" class="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p class="text-green-400 text-sm text-center">{{ message }}</p>
        </div>

        <div v-if="error" class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p class="text-red-400 text-sm text-center">{{ error }}</p>
        </div>

        <p class="mt-6 text-center text-white/70">
          <router-link to="/login" class="text-blue-400 hover:text-blue-300">
            <i class="pi pi-arrow-left mr-1"></i>
            Quay lại đăng nhập
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '../../services/AuthService.js';

const email = ref('');
const loading = ref(false);
const message = ref('');
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  message.value = '';
  error.value = '';

  try {
    const result = await authService.resetPassword(email.value);
    if (result.isOk()) {
      message.value = result.getValue();
    } else {
      error.value = result.getError();
    }
  } catch (err) {
    error.value = 'Có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.form-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.15);
}

.btn-submit {
  padding: 0.875rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
