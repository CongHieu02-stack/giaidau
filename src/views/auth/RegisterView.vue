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
          <h2>Tham gia<br/>cộng đồng! 🏆</h2>
          <p>Tạo tài khoản miễn phí và bắt đầu hành trình thể thao của bạn ngay hôm nay.</p>
        </div>
        <div class="steps">
          <div class="step" v-for="(s, i) in steps" :key="i">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-info">
              <strong>{{ s.title }}</strong>
              <span>{{ s.desc }}</span>
            </div>
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
        <div class="form-header">
          <div class="form-icon"><i class="pi pi-user-plus"></i></div>
          <h1>Tạo tài khoản</h1>
          <p>Điền thông tin để đăng ký miễn phí</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <!-- Full Name -->
          <div class="field-group">
            <label>Họ và tên <span class="req">*</span></label>
            <div class="input-wrap" :class="{ error: errors.fullName }">
              <i class="pi pi-user input-ico"></i>
              <input v-model="form.fullName" type="text" placeholder="Nguyễn Văn A" />
            </div>
            <span v-if="errors.fullName" class="field-error">{{ errors.fullName }}</span>
          </div>

          <!-- Email -->
          <div class="field-group">
            <label>Email <span class="req">*</span></label>
            <div class="input-wrap" :class="{ error: errors.email }">
              <i class="pi pi-envelope input-ico"></i>
              <input v-model="form.email" type="email" placeholder="your@email.com" />
            </div>
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>

          <!-- Phone & Gender -->
          <div class="two-col">
            <div class="field-group">
              <label>Số điện thoại</label>
              <div class="input-wrap" :class="{ error: errors.phone }">
                <i class="pi pi-phone input-ico"></i>
                <input v-model="form.phone" type="tel" placeholder="0912345678" />
              </div>
              <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
            </div>
            <div class="field-group">
              <label>Giới tính</label>
              <div class="input-wrap select-wrap">
                <i class="pi pi-venus-mars input-ico"></i>
                <select v-model="form.gender" class="sel-input">
                  <option value="">Chọn</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                <i class="pi pi-chevron-down sel-arrow"></i>
              </div>
            </div>
          </div>

          <!-- Birth Date -->
          <div class="field-group">
            <label>Ngày sinh</label>
            <div class="input-wrap">
              <i class="pi pi-calendar input-ico"></i>
              <input v-model="form.birthDate" type="date" class="date-input" />
            </div>
          </div>

          <!-- Password -->
          <div class="field-group">
            <label>Mật khẩu <span class="req">*</span></label>
            <div class="input-wrap" :class="{ error: errors.password }">
              <i class="pi pi-lock input-ico"></i>
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" placeholder="••••••••" />
              <button type="button" class="eye-btn" @click="showPwd = !showPwd">
                <i :class="showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
            <span v-else class="field-hint">Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</span>
          </div>

          <!-- Confirm Password -->
          <div class="field-group">
            <label>Xác nhận mật khẩu <span class="req">*</span></label>
            <div class="input-wrap" :class="{ error: errors.confirmPassword }">
              <i class="pi pi-lock input-ico"></i>
              <input v-model="form.confirmPassword" :type="showConfirmPwd ? 'text' : 'password'" placeholder="••••••••" />
              <button type="button" class="eye-btn" @click="showConfirmPwd = !showConfirmPwd">
                <i :class="showConfirmPwd ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
          </div>

          <!-- Terms -->
          <div class="field-group">
            <label class="check-label">
              <input v-model="form.acceptTerms" type="checkbox" class="checkbox" />
              <span>
                Tôi đồng ý với
                <router-link to="/terms" class="link-primary">Điều khoản sử dụng</router-link>
                và
                <router-link to="/privacy" class="link-primary">Chính sách bảo mật</router-link>
              </span>
            </label>
            <span v-if="errors.acceptTerms" class="field-error">{{ errors.acceptTerms }}</span>
          </div>

          <!-- Error -->
          <div v-if="error" class="alert-error">
            <i class="pi pi-exclamation-circle"></i> {{ error }}
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-submit" :disabled="loading">
            <i v-if="loading" class="pi pi-spinner pi-spin"></i>
            <i v-else class="pi pi-check"></i>
            <span>{{ loading ? 'Đang đăng ký...' : 'Tạo tài khoản' }}</span>
          </button>
        </form>

        <p class="switch-text">
          Đã có tài khoản?
          <router-link to="/login" class="link-primary">Đăng nhập ngay</router-link>
        </p>
        <router-link to="/" class="back-link">
          <i class="pi pi-arrow-left"></i> Quay lại trang chủ
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
const loading = ref(false);
const error = ref('');
const showPwd = ref(false);
const showConfirmPwd = ref(false);

const steps = [
  { title: 'Tạo tài khoản', desc: 'Điền thông tin cơ bản của bạn' },
  { title: 'Xác minh email', desc: 'Xác nhận địa chỉ email của bạn' },
  { title: 'Bắt đầu ngay', desc: 'Tham gia giải đấu và câu lạc bộ' },
];

const form = reactive({
  fullName: '', email: '', phone: '', gender: '',
  birthDate: '', password: '', confirmPassword: '', acceptTerms: false
});

const errors = reactive({
  fullName: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: ''
});

const validate = () => {
  Object.keys(errors).forEach(k => errors[k] = '');
  let ok = true;
  if (!form.fullName || form.fullName.length < 2) { errors.fullName = 'Họ tên phải có ít nhất 2 ký tự'; ok = false; }
  if (!form.email) { errors.email = 'Vui lòng nhập email'; ok = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Email không hợp lệ'; ok = false; }
  if (form.phone && !/^(0|\+84)[35789]\d{8}$/.test(form.phone)) { errors.phone = 'Số điện thoại không hợp lệ'; ok = false; }
  if (!form.password) { errors.password = 'Vui lòng nhập mật khẩu'; ok = false; }
  else if (form.password.length < 8) { errors.password = 'Mật khẩu phải có ít nhất 8 ký tự'; ok = false; }
  else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) { errors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số'; ok = false; }
  if (form.password !== form.confirmPassword) { errors.confirmPassword = 'Mật khẩu xác nhận không khớp'; ok = false; }
  if (!form.acceptTerms) { errors.acceptTerms = 'Bạn phải đồng ý với điều khoản sử dụng'; ok = false; }
  return ok;
};

const handleRegister = async () => {
  if (!validate()) return;
  loading.value = true; error.value = '';
  try {
    const result = await authStore.register({
      email: form.email, password: form.password, fullName: form.fullName,
      gender: form.gender || undefined, birthDate: form.birthDate || undefined, phone: form.phone || undefined
    });
    if (result.success) router.push('/login?registered=true');
    else error.value = result.error;
  } catch { error.value = 'Đăng ký thất bại. Vui lòng thử lại.'; }
  finally { loading.value = false; }
};
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; }

/* Left */
.left-panel {
  display: none; position: relative; width: 42%;
  background: linear-gradient(145deg, #0d0b28, #1a1040 50%, #0d1526);
  overflow: hidden; flex-direction: column;
}
@media (min-width: 1024px) { .left-panel { display: flex; } }

.left-glow { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
.left-glow-1 { width: 400px; height: 400px; top: -100px; left: -100px; background: rgba(139,92,246,0.2); }
.left-glow-2 { width: 300px; height: 300px; bottom: 100px; right: -80px; background: rgba(236,72,153,0.15); animation: float 6s ease-in-out infinite; }
.left-glow-3 { width: 200px; height: 200px; bottom: -50px; left: 100px; background: rgba(99,102,241,0.1); animation: float 8s ease-in-out infinite reverse; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }

.left-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; padding: 3rem; }
.brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; margin-bottom: auto; }
.brand-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: white; box-shadow: 0 8px 20px rgba(139,92,246,0.4); }
.brand-name { font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.hero-text { margin: 3rem 0 2rem; }
.hero-text h2 { font-size: 2.5rem; font-weight: 800; color: white; line-height: 1.2; margin-bottom: 1rem; }
.hero-text p { color: rgba(255,255,255,0.55); font-size: 1rem; line-height: 1.65; }

.steps { display: flex; flex-direction: column; gap: 1.125rem; margin-bottom: 3rem; }
.step { display: flex; align-items: flex-start; gap: 1rem; }
.step-num { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: white; box-shadow: 0 4px 12px rgba(139,92,246,0.35); }
.step-info { display: flex; flex-direction: column; gap: 0.15rem; padding-top: 0.2rem; }
.step-info strong { color: white; font-size: 0.9rem; }
.step-info span { color: rgba(255,255,255,0.5); font-size: 0.8rem; }

.left-footer { display: flex; align-items: center; gap: 0.75rem; }
.avatar-stack { display: flex; }
.av { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0d0b28; margin-left: -8px; }
.av:first-child { margin-left: 0; }
.left-footer span { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

/* Right */
.right-panel { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1.5rem; background: #080618; overflow-y: auto; }
.form-card { width: 100%; max-width: 460px; padding: 1rem 0 2rem; animation: slideIn 0.4s cubic-bezier(0.16,1,0.3,1); }
@keyframes slideIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

.form-header { text-align: center; margin-bottom: 1.75rem; }
.form-icon { width: 60px; height: 60px; border-radius: 18px; margin: 0 auto 1rem; background: linear-gradient(135deg, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; box-shadow: 0 12px 30px rgba(139,92,246,0.35); }
.form-header h1 { font-size: 1.75rem; font-weight: 800; color: white; margin-bottom: 0.375rem; }
.form-header p { color: rgba(255,255,255,0.45); font-size: 0.9rem; }

.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }

.field-group { display: flex; flex-direction: column; gap: 0.35rem; }
.field-group label:not(.check-label) { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.65); }
.req { color: #f87171; }

.input-wrap { position: relative; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 0.75rem; transition: all 0.2s; }
.input-wrap:focus-within { border-color: rgba(139,92,246,0.6); background: rgba(139,92,246,0.05); box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
.input-wrap.error { border-color: rgba(239,68,68,0.5); }

.input-ico { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 0.8rem; pointer-events: none; }

.input-wrap input, .sel-input, .date-input {
  width: 100%; padding: 0.72rem 0.875rem 0.72rem 2.25rem;
  background: transparent; border: none; color: white; font-size: 0.875rem; outline: none;
}
.input-wrap input::placeholder { color: rgba(255,255,255,0.2); }

.select-wrap { overflow: hidden; }
.sel-input { appearance: none; cursor: pointer; padding-right: 2rem; }
.sel-input option { background: #1a1040; color: white; }
.sel-arrow { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 0.7rem; pointer-events: none; }

.date-input { color-scheme: dark; }

.eye-btn { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 0.8rem; transition: color 0.2s; }
.eye-btn:hover { color: rgba(255,255,255,0.65); }

.field-error { font-size: 0.75rem; color: #fca5a5; }
.field-hint { font-size: 0.73rem; color: rgba(255,255,255,0.35); }

.check-label { display: flex; align-items: flex-start; gap: 0.625rem; cursor: pointer; }
.checkbox { width: 15px; height: 15px; border-radius: 4px; margin-top: 2px; accent-color: #8b5cf6; flex-shrink: 0; }
.check-label span { font-size: 0.8rem; color: rgba(255,255,255,0.55); line-height: 1.5; }

.link-primary { color: #a78bfa; font-weight: 600; text-decoration: none; transition: color 0.2s; }
.link-primary:hover { color: #c4b5fd; }

.alert-error { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 0.875rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 0.75rem; color: #fca5a5; font-size: 0.85rem; }

.btn-submit {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.875rem; margin-top: 0.25rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white; font-size: 0.95rem; font-weight: 700; border-radius: 0.875rem;
  transition: all 0.25s; box-shadow: 0 4px 20px rgba(139,92,246,0.35);
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(139,92,246,0.5); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.switch-text { text-align: center; margin-top: 1.25rem; color: rgba(255,255,255,0.5); font-size: 0.875rem; }
.back-link { display: flex; align-items: center; justify-content: center; gap: 0.375rem; margin-top: 0.875rem; color: rgba(255,255,255,0.3); font-size: 0.8rem; text-decoration: none; transition: color 0.2s; }
.back-link:hover { color: rgba(255,255,255,0.6); }

@media (max-width: 480px) { .two-col { grid-template-columns: 1fr; } }
</style>
