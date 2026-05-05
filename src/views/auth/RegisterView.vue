<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    </div>

    <div class="w-full max-w-lg relative z-10">
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center space-x-3 group">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center transform transition-transform group-hover:scale-110">
            <i class="pi pi-trophy text-white text-2xl"></i>
          </div>
          <span class="text-3xl font-bold gradient-text">MyLeague</span>
        </router-link>
      </div>

      <!-- Register Card -->
      <div class="glass rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-bold text-white text-center mb-2">Đăng ký tài khoản</h1>
        <p class="text-white/60 text-center mb-6">Tạo tài khoản để tham gia giải đấu ngay hôm nay</p>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <!-- Full Name -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Họ và tên <span class="text-red-400">*</span></label>
            <div class="relative">
              <i class="pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
              <input
                v-model="form.fullName"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                class="form-input"
                :class="{ 'border-red-500': errors.fullName }"
              />
            </div>
            <p v-if="errors.fullName" class="text-red-400 text-sm">{{ errors.fullName }}</p>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Email <span class="text-red-400">*</span></label>
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

          <!-- Phone & Gender Row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-white/80">Số điện thoại</label>
              <div class="relative">
                <i class="pi pi-phone absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="0912345678"
                  class="form-input"
                  :class="{ 'border-red-500': errors.phone }"
                />
              </div>
              <p v-if="errors.phone" class="text-red-400 text-sm">{{ errors.phone }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-white/80">Giới tính</label>
              <select
                v-model="form.gender"
                class="form-input"
              >
                <option value="">Chọn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <!-- Birth Date -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Ngày sinh</label>
            <div class="relative">
              <i class="pi pi-calendar absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
              <input
                v-model="form.birthDate"
                type="date"
                class="form-input"
                :class="{ 'border-red-500': errors.birthDate }"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Mật khẩu <span class="text-red-400">*</span></label>
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
            <p v-else class="text-white/40 text-xs">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</p>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-white/80">Xác nhận mật khẩu <span class="text-red-400">*</span></label>
            <div class="relative">
              <i class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="form-input pr-10"
                :class="{ 'border-red-500': errors.confirmPassword }"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="text-red-400 text-sm">{{ errors.confirmPassword }}</p>
          </div>

          <!-- Terms -->
          <div class="space-y-2">
            <label class="flex items-start space-x-2 cursor-pointer">
              <input
                v-model="form.acceptTerms"
                type="checkbox"
                required
                class="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500"
              />
              <span class="text-sm text-white/70">
                Tôi đồng ý với
                <router-link to="/terms" class="text-blue-400 hover:text-blue-300">Điều khoản sử dụng</router-link>
                và
                <router-link to="/privacy" class="text-blue-400 hover:text-blue-300">Chính sách bảo mật</router-link>
              </span>
            </label>
            <p v-if="errors.acceptTerms" class="text-red-400 text-sm">{{ errors.acceptTerms }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-submit"
          >
            <i v-if="loading" class="pi pi-spinner pi-spin mr-2"></i>
            <span>{{ loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản' }}</span>
          </button>
        </form>

        <!-- Error Message -->
        <div v-if="error" class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p class="text-red-400 text-sm text-center">{{ error }}</p>
        </div>

        <!-- Login Link -->
        <p class="mt-6 text-center text-white/70">
          Đã có tài khoản?
          <router-link to="/login" class="text-blue-400 hover:text-blue-300 font-medium ml-1">
            Đăng nhập ngay
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
});

const errors = reactive({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
});

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const validate = () => {
  let isValid = true;
  
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '');

  if (!form.fullName || form.fullName.length < 2) {
    errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    isValid = false;
  }

  if (!form.email) {
    errors.email = 'Vui lòng nhập email';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Email không hợp lệ';
    isValid = false;
  }

  if (form.phone && !/^(0|\+84)[35789]\d{8}$/.test(form.phone)) {
    errors.phone = 'Số điện thoại không hợp lệ';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
    isValid = false;
  } else if (form.password.length < 8) {
    errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    isValid = false;
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
    isValid = false;
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    isValid = false;
  }

  if (!form.acceptTerms) {
    errors.acceptTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
    isValid = false;
  }

  return isValid;
};

const handleRegister = async () => {
  if (!validate()) return;

  loading.value = true;
  error.value = '';

  try {
    const result = await authStore.register({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      gender: form.gender || undefined,
      birthDate: form.birthDate || undefined,
      phone: form.phone || undefined
    });
    
    if (result.success) {
      // Show success and redirect to login
      router.push('/login?registered=true');
    } else {
      error.value = result.error;
    }
  } catch (err) {
    error.value = 'Đăng ký thất bại. Vui lòng thử lại.';
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

select.form-input {
  padding-left: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.5rem;
}

select.form-input option {
  background: #1e1b4b;
  color: white;
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
</style>
