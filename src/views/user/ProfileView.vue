<template>
  <div class="profile-page">

    <!-- ── HERO BANNER ─────────────────────────────── -->
    <div class="hero-banner">
      <div class="hero-particles">
        <span v-for="n in 6" :key="n" class="particle" :style="`--i:${n}`"></span>
      </div>
      <div class="hero-content">
        <!-- Avatar -->
        <div class="avatar-ring" @click="triggerAvatarUpload" :class="{ 'uploading': isUploadingAvatar }">
          <div class="avatar-inner">
            <template v-if="!authStore.profile?.avatarUrl">
              {{ authStore.userInitials }}
            </template>
            <img v-else :src="authStore.profile.avatarUrl" alt="Avatar" class="avatar-img" />
            
            <div class="avatar-overlay">
              <i :class="['pi', isUploadingAvatar ? 'pi-spin pi-spinner' : 'pi-camera']"></i>
            </div>
          </div>
          <input type="file" ref="avatarInput" class="hidden-input" accept="image/*" @change="onAvatarChange" />
        </div>
        <!-- Name & role -->
        <div class="hero-info">
          <h1 class="hero-name">{{ authStore.userDisplayName }}</h1>
          <div class="hero-badge">
            <i class="pi pi-shield mr-1"></i>
            {{ authStore.profile?.displayRole || 'Thành viên' }}
          </div>
          <p class="hero-email">
            <i class="pi pi-envelope mr-1"></i>
            {{ authStore.profile?.email }}
          </p>
        </div>
      </div>
    </div>

    <!-- ── MAIN CONTENT ────────────────────────────── -->
    <div class="profile-body">

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon trophy">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="stat-info">
            <div v-if="statsLoading" class="stat-loading">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <span v-else class="stat-num">{{ stats.tournaments }}</span>
            <span class="stat-label">Giải đấu</span>
          </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-card">
          <div class="stat-icon club">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-info">
            <div v-if="statsLoading" class="stat-loading">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <span v-else class="stat-num">{{ stats.clubs }}</span>
            <span class="stat-label">Câu lạc bộ</span>
          </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-card">
          <div class="stat-icon medal">
            <i class="pi pi-star"></i>
          </div>
          <div class="stat-info">
            <span class="stat-num">0</span>
            <span class="stat-label">Huy chương</span>
          </div>
        </div>
      </div>

      <!-- Info card -->
      <div class="info-card">
        <div class="card-header">
          <span class="card-title">
            <i class="pi pi-id-card"></i>
            Thông tin cá nhân
          </span>
          <button class="edit-btn" @click="openEditModal">
            <i class="pi pi-pencil mr-1"></i>
            Chỉnh sửa
          </button>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-icon-wrap name-c">
              <i class="pi pi-user"></i>
            </div>
            <div>
              <p class="info-lbl">Họ và tên</p>
              <p class="info-val">{{ authStore.profile?.fullName || '—' }}</p>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon-wrap gender-c">
              <i class="pi pi-venus-mars"></i>
            </div>
            <div>
              <p class="info-lbl">Giới tính</p>
              <p class="info-val">{{ genderLabel(authStore.profile?.gender) }}</p>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon-wrap birth-c">
              <i class="pi pi-calendar"></i>
            </div>
            <div>
              <p class="info-lbl">Ngày sinh</p>
              <p class="info-val">{{ formatDate(authStore.profile?.birthDate) }}</p>
            </div>
          </div>

          <div class="info-item">
            <div class="info-icon-wrap phone-c">
              <i class="pi pi-phone"></i>
            </div>
            <div>
              <p class="info-lbl">Số điện thoại</p>
              <p class="info-val">{{ authStore.profile?.phone || '—' }}</p>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /profile-body -->

    <!-- ── MODAL ────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
          <div class="modal-box">
            <div class="modal-header">
              <h3>Chỉnh sửa thông tin</h3>
              <button class="modal-close" @click="closeEditModal">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <Transition name="fade">
              <div v-if="saveMessage" :class="['alert-msg', saveSuccess ? 'success' : 'error']">
                <i :class="['pi mr-2', saveSuccess ? 'pi-check-circle' : 'pi-exclamation-circle']"></i>
                {{ saveMessage }}
              </div>
            </Transition>

            <form @submit.prevent="saveProfile" class="modal-body space-y-4">
              <div class="form-group">
                <label class="form-label">Họ và tên <span class="req">*</span></label>
                <input v-model="form.fullName" type="text" class="form-input" placeholder="Nhập họ và tên" required />
              </div>
              <div class="form-group">
                <label class="form-label">Giới tính</label>
                <select v-model="form.gender" class="form-input">
                  <option value="">-- Chọn giới tính --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Ngày sinh</label>
                <input v-model="form.birthDate" type="date" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input v-model="form.phone" type="tel" class="form-input" placeholder="Nhập số điện thoại" />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="closeEditModal" :disabled="saving">Hủy</button>
                <button type="submit" class="btn-save" :disabled="saving">
                  <i :class="['pi mr-2', saving ? 'pi-spin pi-spinner' : 'pi-check']"></i>
                  {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { supabase } from '../../config/supabase.js';
import { storageService } from '../../services/StorageService.js';

const authStore = useAuthStore();

// ---- Stats ----
const statsLoading = ref(true);
const stats = reactive({ clubs: 0, tournaments: 0 });

async function loadStats() {
  const userId = authStore.user?.id;
  if (!userId) { statsLoading.value = false; return; }
  try {
    const { count: clubCount } = await supabase
      .from('club_members').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'approved');
    stats.clubs = clubCount ?? 0;

    const { data: memberRows } = await supabase
      .from('club_members').select('club_id')
      .eq('user_id', userId).eq('status', 'approved');

    if (memberRows?.length > 0) {
      const clubIds = memberRows.map(r => r.club_id);
      const { count: tourneyCount } = await supabase
        .from('tournament_registrations')
        .select('tournament_id', { count: 'exact', head: true })
        .in('club_id', clubIds).eq('status', 'approved');
      stats.tournaments = tourneyCount ?? 0;
    }
  } catch (err) {
    console.error('[ProfileView] loadStats error:', err);
  } finally {
    statsLoading.value = false;
  }
}

onMounted(() => loadStats());

// ---- Avatar Upload ----
const avatarInput = ref(null);
const isUploadingAvatar = ref(false);

function triggerAvatarUpload() {
  if (isUploadingAvatar.value) return;
  avatarInput.value?.click();
}

async function onAvatarChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  const userId = authStore.user?.id;
  if (!userId) return;

  isUploadingAvatar.value = true;
  try {
    const uploadResult = await storageService.uploadAvatar(file, userId);
    
    if (uploadResult.isOk()) {
      const publicUrl = uploadResult.getValue();
      
      const { error } = await supabase.from('profiles').update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      }).eq('id', userId);

      if (error) throw error;

      if (authStore.profile) {
        authStore.profile.avatarUrl = publicUrl;
      }
    } else {
      alert('Lỗi tải ảnh: ' + uploadResult.getError());
    }
  } catch (err) {
    console.error('Avatar upload error:', err);
    alert('Có lỗi xảy ra khi tải ảnh lên.');
  } finally {
    isUploadingAvatar.value = false;
    if (avatarInput.value) {
      avatarInput.value.value = '';
    }
  }
}

// ---- Modal ----
const showEditModal = ref(false);
const saving = ref(false);
const saveMessage = ref('');
const saveSuccess = ref(false);
const form = reactive({ fullName: '', gender: '', birthDate: '', phone: '' });

function genderLabel(val) {
  return { male: 'Nam', female: 'Nữ', other: 'Khác' }[val] || '—';
}
function formatDate(val) {
  if (!val) return '—';
  try { return new Date(val).toLocaleDateString('vi-VN'); } catch { return val; }
}

function openEditModal() {
  const p = authStore.profile;
  form.fullName  = p?.fullName  || '';
  form.gender    = p?.gender    || '';
  form.birthDate = p?.birthDate || '';
  form.phone     = p?.phone     || '';
  saveMessage.value = '';
  showEditModal.value = true;
}
function closeEditModal() {
  if (saving.value) return;
  showEditModal.value = false;
}

async function saveProfile() {
  if (!authStore.user?.id) return;
  saving.value = true;
  saveMessage.value = '';
  try {
    const { error } = await supabase.from('profiles').update({
      full_name:  form.fullName.trim(),
      gender:     form.gender    || null,
      birth_date: form.birthDate || null,
      phone:      form.phone.trim() || null,
      updated_at: new Date().toISOString()
    }).eq('id', authStore.user.id);
    if (error) throw error;

    if (authStore.profile) {
      authStore.profile.fullName  = form.fullName.trim();
      authStore.profile.gender    = form.gender    || null;
      authStore.profile.birthDate = form.birthDate || null;
      authStore.profile.phone     = form.phone.trim() || null;
    }
    saveSuccess.value = true;
    saveMessage.value = 'Cập nhật thông tin thành công!';
    setTimeout(() => closeEditModal(), 1200);
  } catch (err) {
    saveSuccess.value = false;
    saveMessage.value = err.message || 'Lưu thất bại, vui lòng thử lại.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════
   PAGE WRAPPER
════════════════════════════════════ */
.profile-page {
  min-height: 100vh;
  padding-bottom: 3rem;
}

/* ═══════════════════════════════════
   HERO BANNER
════════════════════════════════════ */
.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%);
  padding: 3.5rem 1.5rem 5rem;
  overflow: hidden;
}

/* Subtle animated orbs in background */
.hero-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(167, 139, 250, 0.15);
  animation: drift calc(6s + var(--i) * 1.2s) ease-in-out infinite alternate;
}
.particle:nth-child(1) { width: 200px; height: 200px; top: -60px; left: -40px; }
.particle:nth-child(2) { width: 140px; height: 140px; top: 20px; right: 10%; }
.particle:nth-child(3) { width: 80px;  height: 80px;  bottom: 10px; left: 30%; }
.particle:nth-child(4) { width: 120px; height: 120px; bottom: -30px; right: 20%; }
.particle:nth-child(5) { width: 60px;  height: 60px;  top: 50%; left: 50%; }
.particle:nth-child(6) { width: 180px; height: 180px; top: -80px; right: -30px; background: rgba(96,165,250,0.1); }

@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(20px, 15px) scale(1.05); }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

/* Avatar */
.avatar-ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
  flex-shrink: 0;
  box-shadow: 0 0 32px rgba(167, 139, 250, 0.45);
  cursor: pointer;
  position: relative;
}
.avatar-ring:hover .avatar-overlay {
  opacity: 1;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a, #4c1d95);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
  overflow: hidden;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 50%;
}
.avatar-ring.uploading .avatar-overlay {
  opacity: 1;
}

.hidden-input {
  display: none;
}

/* Name / badge / email */
.hero-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-name {
  font-size: 1.9rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  background: rgba(167, 139, 250, 0.2);
  border: 1px solid rgba(167, 139, 250, 0.4);
  color: #c4b5fd;
  font-size: 0.825rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.hero-email {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.5);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* ═══════════════════════════════════
   BODY
════════════════════════════════════ */
.profile-body {
  max-width: 800px;
  margin: -2.5rem auto 0;
  padding: 0 1.25rem;
  position: relative;
  z-index: 2;
}

/* ═══════════════════════════════════
   STATS ROW
════════════════════════════════════ */
.stats-row {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 1.25rem;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.stat-icon.trophy  { background: rgba(251,191,36,0.15); color: #fbbf24; }
.stat-icon.club    { background: rgba(96,165,250,0.15);  color: #60a5fa; }
.stat-icon.medal   { background: rgba(167,139,250,0.15); color: #a78bfa; }

.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-num {
  font-size: 1.75rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}
.stat-label {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  margin-top: 0.25rem;
}
.stat-loading {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.3);
}
.stat-divider {
  width: 1px;
  height: 48px;
  background: rgba(255,255,255,0.1);
  margin: 0 1.5rem;
}

/* ═══════════════════════════════════
   INFO CARD
════════════════════════════════════ */
.info-card {
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
}
.card-title .pi { color: #a78bfa; }

.edit-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  border-radius: 0.6rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-size: 0.825rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.25s;
}
.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(59,130,246,0.4);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  border-right: 1px solid rgba(255,255,255,0.06);
  transition: background 0.2s;
}
.info-item:hover { background: rgba(255,255,255,0.04); }
.info-item:nth-child(even) { border-right: none; }
.info-item:nth-last-child(-n+2) { border-bottom: none; }

.info-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.name-c   { background: rgba(96,165,250,0.15);  color: #60a5fa; }
.gender-c { background: rgba(244,114,182,0.15); color: #f472b6; }
.birth-c  { background: rgba(251,191,36,0.15);  color: #fbbf24; }
.phone-c  { background: rgba(52,211,153,0.15);  color: #34d399; }

.info-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-bottom: 0.15rem; }
.info-val { font-size: 0.9375rem; color: #fff; font-weight: 500; }

/* ═══════════════════════════════════
   MODAL
════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-box {
  background: linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,27,75,0.97));
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.5);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
}
.modal-header h3 { font-size: 1.15rem; font-weight: 700; color: #fff; }
.modal-close {
  width: 2rem; height: 2rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
  border: none; cursor: pointer; transition: all 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.16); color: #fff; }
.modal-body  { padding: 1.5rem; }
.modal-footer { display: flex; gap: 0.75rem; padding-top: 0.5rem; }

.form-group  { display: flex; flex-direction: column; gap: 0.4rem; }
.form-label  { font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.7); }
.req         { color: #f87171; }
.form-input  {
  width: 100%; padding: 0.625rem 0.875rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 0.625rem; color: #fff; font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s; outline: none;
}
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.18); }
.form-input option { background: #1e1b4b; }

.btn-cancel {
  flex: 1; padding: 0.7rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 0.625rem; color: rgba(255,255,255,0.75);
  font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.14); }

.btn-save {
  flex: 2; padding: 0.7rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none; border-radius: 0.625rem; color: #fff;
  font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,130,246,0.35); }
.btn-save:disabled, .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.alert-msg {
  margin: 1rem 1.5rem 0;
  padding: 0.75rem 1rem; border-radius: 0.625rem;
  font-size: 0.875rem; display: flex; align-items: center;
}
.alert-msg.success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #6ee7b7; }
.alert-msg.error   { background: rgba(239,68,68,0.15);   border: 1px solid rgba(239,68,68,0.4);   color: #fca5a5; }

/* ═══════════════════════════════════
   TRANSITIONS
════════════════════════════════════ */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .modal-box, .modal-leave-active .modal-box { transition: transform 0.25s ease, opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.92) translateY(16px); opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ═══════════════════════════════════
   RESPONSIVE
════════════════════════════════════ */
@media (max-width: 600px) {
  .hero-content { flex-direction: column; align-items: center; }
  .hero-info    { align-items: center; text-align: center; }
  .hero-email   { justify-content: center; }
  .stats-row    { flex-direction: column; gap: 1.25rem; padding: 1.5rem; }
  .stat-divider { width: 100%; height: 1px; margin: 0; }
  .info-grid    { grid-template-columns: 1fr; }
  .info-item:nth-child(even) { border-right: none; }
  .info-item:nth-last-child(-n+2) { border-bottom: 1px solid rgba(255,255,255,0.06); }
  .info-item:last-child { border-bottom: none; }
}
</style>
