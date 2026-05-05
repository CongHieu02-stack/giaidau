<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center space-x-3 group">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center transform transition-transform group-hover:scale-110">
            <i class="pi pi-trophy text-white text-2xl"></i>
          </div>
          <span class="text-3xl font-bold gradient-text">MyLeague</span>
        </router-link>
      </div>

      <!-- Login Card -->
      <div class="glass rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-bold text-white text-center mb-2">Đăng nhập</h1>
        <p class="text-white/60 text-center mb-6">Chào mừng trở lại! Đăng nhập để tiếp tục.</p>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Email</label>
            <div class="relative">
              <i class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="your@email.com"
                class="form-input"
                :class="{ 'border-red-500': errors.email }"
              />
            </div>
            <p v-if="errors.email" class="text-red-400 text-sm">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Mật khẩu</label>
            <div class="relative">
              <i class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="form-input pr-10"
                :class="{ 'border-red-500': errors.password }"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <p v-if="errors.password" class="text-red-400 text-sm">{{ errors.password }}</p>
          </div>

          <!-- Remember & Forgot -->
          <div class="flex items-center justify-between">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="form.remember"
                type="checkbox"
                class="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500"
              />
              <span class="text-sm text-white/70">Ghi nhớ đăng nhập</span>
            </label>
            <router-link to="/forgot-password" class="text-sm text-blue-400 hover:text-blue-300">
              Quên mật khẩu?
            </router-link>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-submit"
          >
            <i v-if="loading" class="pi pi-spinner pi-spin mr-2"></i>
            <span>{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
          </button>
        </form>

        <!-- Error Message -->
        <div v-if="error" class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p class="text-red-400 text-sm text-center">{{ error }}</p>
        </div>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/20"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-slate-900/50 text-white/60">Hoặc</span>
          </div>
        </div>

        <!-- Social Login -->
        <button class="w-full social-btn">
          <img src="https://www.google.com/favicon.ico" alt="Google" class="w-5 h-5 mr-2">
          Đăng nhập với Google
        </button>

        <!-- Register Link -->
        <p class="mt-6 text-center text-white/70">
          Chưa có tài khoản?
          <router-link to="/register" class="text-blue-400 hover:text-blue-300 font-medium ml-1">
            Đăng ký ngay
          </router-link>
        </p>
      </div>

      <!-- Back Link -->
      <div class="text-center mt-6">
        <router-link to="/" class="text-white/50 hover:text-white/80 text-sm inline-flex items-center">
          <i class="pi pi-arrow-left mr-2"></i>
          Quay lại trang chủ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
  remember: false
});

const errors = reactive({
  email: '',
  password: ''
});

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const validate = () => {
  let isValid = true;
  errors.email = '';
  errors.password = '';

  if (!form.email) {
    errors.email = 'Vui lòng nhập email';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Email không hợp lệ';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validate()) return;

  loading.value = true;
  error.value = '';

  try {
    const result = await authStore.login(form.email, form.password);
    
    if (result.success) {
      // Redirect to intended page or home
      const redirect = route.query.redirect || '/';
      router.push(redirect);
    } else {
      error.value = result.error;
    }
  } catch (err) {
    error.value = 'Đăng nhập thất bại. Vui lòng thử lại.';
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
  font-size: 0.9375rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.btn-submit {
  padding: 0.875rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.social-btn {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 500;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.social-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
