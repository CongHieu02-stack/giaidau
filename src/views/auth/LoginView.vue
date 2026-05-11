<template>
  <div class="auth-page">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="left-glow left-glow-1"></div>
      <div class="left-glow left-glow-2"></div>
      <div class="left-glow left-glow-3"></div>
      <div class="left-inner">
        <router-link to="/" class="brand">
          <div class="brand-icon"><i class="pi pi-trophy"></i></div>
          <span class="brand-name">MyLeague</span>
        </router-link>
        <div class="hero-text">
          <h2>Chào mừng! 👋</h2>
          <p>Đăng nhập để quản lý giải đấu, theo dõi câu lạc bộ và kết nối cộng đồng thể thao.</p>
        </div>
        <div class="feature-list">
          <div class="feat" v-for="f in features" :key="f.text">
            <div class="feat-icon"><i :class="f.icon"></i></div>
            <span>{{ f.text }}</span>
          </div>
        </div>
        <div class="left-footer">
          <div class="avatar-stack">
            <div class="av" v-for="c in ['#6366f1','#8b5cf6','#ec4899','#f59e0b']" :key="c" :style="{ background: c }"></div>
          </div>
          <span>+1,200 người dùng đang hoạt động</span>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="form-card">
        <!-- Header -->
        <div class="form-header">
          <div class="form-icon"><i class="pi pi-sign-in"></i></div>
          <h1>Đăng nhập</h1>
          <p>Nhập thông tin tài khoản của bạn</p>
        </div>

        <!-- Success message -->
        <div v-if="registeredSuccess" class="alert-success">
          <i class="pi pi-check-circle"></i>
          Đăng ký thành công! Vui lòng đăng nhập.
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <!-- Email -->
          <div class="field-group">
            <label>Email</label>
            <div class="input-wrap" :class="{ error: errors.email }">
              <i class="pi pi-envelope input-ico"></i>
              <input v-model="form.email" type="email" placeholder="your@email.com" />
            </div>
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>

          <!-- Password -->
          <div class="field-group">
            <label>Mật khẩu</label>
            <div class="input-wrap" :class="{ error: errors.password }">
              <i class="pi pi-lock input-ico"></i>
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="••••••••" />
              <button type="button" class="eye-btn" @click="showPwd = !showPwd">
                <i :class="showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>

          <!-- Row -->
          <div class="row-between">
            <label class="check-label">
              <input v-model="form.remember" type="checkbox" class="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <router-link to="/forgot-password" class="link-primary">Quên mật khẩu?</router-link>
          </div>

          <!-- Error -->
          <div v-if="error" class="alert-error">
            <i class="pi pi-exclamation-circle"></i> {{ error }}
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-submit" :disabled="loading">
            <i v-if="loading" class="pi pi-spinner pi-spin"></i>
            <i v-else class="pi pi-sign-in"></i>
            <span>{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
          </button>

          <!-- Divider -->
          <div class="divider"><span>Hoặc</span></div>

          <!-- Google -->
          <button type="button" class="btn-google">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
            Đăng nhập với Google
          </button>
        </form>

        <p class="switch-text">
          Chưa có tài khoản?
          <router-link to="/register" class="link-primary">Đăng ký ngay</router-link>
        </p>
        <router-link to="/" class="back-link">
          <i class="pi pi-arrow-left"></i> Quay lại trang chủ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const registeredSuccess = computed(() => route.query.registered === 'true');
const showPwd = ref(false);
const loading = ref(false);
const error = ref('');

const form = reactive({ email: '', password: '', remember: false });
const errors = reactive({ email: '', password: '' });

const features = [
  { icon: 'pi pi-trophy', text: 'Quản lý giải đấu chuyên nghiệp' },
  { icon: 'pi pi-shield', text: 'Theo dõi câu lạc bộ của bạn' },
  { icon: 'pi pi-users', text: 'Kết nối cộng đồng thể thao' },
  { icon: 'pi pi-chart-bar', text: 'Thống kê & phân tích chi tiết' },
];

const validate = () => {
  errors.email = ''; errors.password = '';
  let ok = true;
  if (!form.email) { errors.email = 'Vui lòng nhập email'; ok = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Email không hợp lệ'; ok = false; }
  if (!form.password) { errors.password = 'Vui lòng nhập mật khẩu'; ok = false; }
  else if (form.password.length < 6) { errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'; ok = false; }
  return ok;
};

const handleLogin = async () => {
  if (!validate()) return;
  loading.value = true; error.value = '';
  try {
    const result = await authStore.login(form.email, form.password);
    if (result.success) router.push(route.query.redirect || '/');
    else error.value = result.error;
  } catch { error.value = 'Đăng nhập thất bại. Vui lòng thử lại.'; }
  finally { loading.value = false; }
};
</script>

<style scoped>
/* Layout */
.auth-page {
  min-height: 100vh;
  display: flex;
}

/* ── Left Panel ── */
.left-panel {
  display: none;
  position: relative;
  width: 45%;
  background: linear-gradient(145deg, #0d0b28 0%, #1a1040 50%, #0d1526 100%);
  overflow: hidden;
  flex-direction: column;
}
@media (min-width: 1024px) { .left-panel { display: flex; } }

.left-glow {
  position: absolute; border-radius: 50%;
  filter: blur(80px); pointer-events: none;
}
.left-glow-1 { width: 400px; height: 400px; top: -100px; left: -100px; background: rgba(99,102,241,0.2); }
.left-glow-2 { width: 300px; height: 300px; bottom: 100px; right: -80px; background: rgba(139,92,246,0.15); animation: float 6s ease-in-out infinite; }
.left-glow-3 { width: 200px; height: 200px; bottom: -50px; left: 100px; background: rgba(236,72,153,0.1); animation: float 8s ease-in-out infinite reverse; }

@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }

.left-inner {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  height: 100%; padding: 3rem;
}

.brand {
  display: flex; align-items: center; gap: 0.75rem;
  text-decoration: none; margin-bottom: auto;
}
.brand-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: white;
  box-shadow: 0 8px 20px rgba(99,102,241,0.4);
}
.brand-name {
  font-size: 1.5rem; font-weight: 800;
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.hero-text { margin: 3rem 0 2rem; }
.hero-text h2 { font-size: 2.5rem; font-weight: 800; color: white; line-height: 1.2; margin-bottom: 1rem; }
.hero-text p { color: rgba(255,255,255,0.55); font-size: 1rem; line-height: 1.65; }

.feature-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem; }
.feat { display: flex; align-items: center; gap: 0.875rem; }
.feat-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.3);
  display: flex; align-items: center; justify-content: center;
  color: #a5b4fc; font-size: 0.85rem;
}
.feat span { color: rgba(255,255,255,0.7); font-size: 0.9rem; }

.left-footer { display: flex; align-items: center; gap: 0.75rem; }
.avatar-stack { display: flex; }
.av { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0d0b28; margin-left: -8px; }
.av:first-child { margin-left: 0; }
.left-footer span { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

/* ── Right Panel ── */
.right-panel {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1.5rem;
  background: #080618;
  overflow-y: auto;
}

.form-card {
  width: 100%; max-width: 440px;
  animation: slideIn 0.4s cubic-bezier(0.16,1,0.3,1);
}
@keyframes slideIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

/* Form header */
.form-header { text-align: center; margin-bottom: 2rem; }
.form-icon {
  width: 60px; height: 60px; border-radius: 18px; margin: 0 auto 1rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: white;
  box-shadow: 0 12px 30px rgba(99,102,241,0.35);
}
.form-header h1 { font-size: 1.75rem; font-weight: 800; color: white; margin-bottom: 0.375rem; }
.form-header p { color: rgba(255,255,255,0.45); font-size: 0.9rem; }

/* Alerts */
.alert-success {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1rem; margin-bottom: 1.25rem;
  background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25);
  border-radius: 0.75rem; color: #86efac; font-size: 0.875rem;
}
.alert-error {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1rem; margin-bottom: 0.5rem;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
  border-radius: 0.75rem; color: #fca5a5; font-size: 0.875rem;
}

/* Form */
.auth-form { display: flex; flex-direction: column; gap: 1.125rem; }

.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-group label { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.7); }

.input-wrap {
  position: relative;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.875rem;
  transition: all 0.2s;
}
.input-wrap:focus-within {
  border-color: rgba(99,102,241,0.6);
  background: rgba(99,102,241,0.05);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.input-wrap.error { border-color: rgba(239,68,68,0.5); }
.input-wrap.error:focus-within { box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

.input-ico {
  position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,0.3); font-size: 0.85rem; pointer-events: none;
}

.input-wrap input, .input-wrap select {
  width: 100%; padding: 0.8rem 0.875rem 0.8rem 2.5rem;
  background: transparent; border: none; color: white;
  font-size: 0.9rem; outline: none;
}
.input-wrap input::placeholder { color: rgba(255,255,255,0.25); }

.eye-btn {
  position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,0.35); font-size: 0.85rem; padding: 0.2rem;
  transition: color 0.2s;
}
.eye-btn:hover { color: rgba(255,255,255,0.7); }

.field-error { font-size: 0.775rem; color: #fca5a5; }

.row-between { display: flex; align-items: center; justify-content: space-between; }
.check-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.checkbox {
  width: 16px; height: 16px; border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05);
  accent-color: #6366f1;
}
.check-label span { font-size: 0.82rem; color: rgba(255,255,255,0.6); }

.link-primary { font-size: 0.82rem; color: #818cf8; font-weight: 600; text-decoration: none; transition: color 0.2s; }
.link-primary:hover { color: #a5b4fc; }

/* Buttons */
.btn-submit {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.875rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white; font-size: 0.95rem; font-weight: 700;
  border-radius: 0.875rem; transition: all 0.25s;
  box-shadow: 0 4px 20px rgba(99,102,241,0.35);
  margin-top: 0.25rem;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(99,102,241,0.5); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.divider { display: flex; align-items: center; gap: 0.75rem; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
.divider span { font-size: 0.78rem; color: rgba(255,255,255,0.35); white-space: nowrap; }

.btn-google {
  display: flex; align-items: center; justify-content: center; gap: 0.625rem;
  width: 100%; padding: 0.8rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.75); font-size: 0.875rem; font-weight: 500;
  border-radius: 0.875rem; transition: all 0.2s;
}
.btn-google:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: white; }

.switch-text {
  text-align: center; margin-top: 1.5rem;
  color: rgba(255,255,255,0.5); font-size: 0.875rem;
}

.back-link {
  display: flex; align-items: center; justify-content: center; gap: 0.375rem;
  margin-top: 1rem; color: rgba(255,255,255,0.3); font-size: 0.8rem;
  text-decoration: none; transition: color 0.2s;
}
.back-link:hover { color: rgba(255,255,255,0.6); }
</style>
