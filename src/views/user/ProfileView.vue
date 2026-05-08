<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">

      <!-- Header Card -->
      <div class="glass rounded-2xl p-8 mb-6">
        <div class="flex items-center gap-6">
          <div
            class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
          >
            {{ authStore.userInitials }}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">{{ authStore.userDisplayName }}</h1>
            <p class="text-white/60">{{ authStore.profile?.displayRole }}</p>
            <p class="text-white/40 text-sm mt-1">{{ authStore.profile?.email }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Thông tin cá nhân -->
        <div class="glass rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-4">Thông tin cá nhân</h2>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-white/60">Họ tên</span>
              <span class="text-white">{{ authStore.profile?.fullName || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/60">Giới tính</span>
              <span class="text-white">{{ genderLabel(authStore.profile?.gender) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/60">Ngày sinh</span>
              <span class="text-white">{{ formatDate(authStore.profile?.birthDate) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/60">Số điện thoại</span>
              <span class="text-white">{{ authStore.profile?.phone || '-' }}</span>
            </div>
          </div>
          <button class="btn-edit mt-6 w-full" @click="openEditModal">
            <i class="pi pi-pencil mr-2"></i>
            Chỉnh sửa thông tin
          </button>
        </div>

        <!-- Thống kê -->
        <div class="glass rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-4">Thống kê</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="stat-box">
              <i class="pi pi-trophy text-2xl text-yellow-400 mb-2"></i>
              <div v-if="statsLoading" class="flex justify-center">
                <i class="pi pi-spin pi-spinner text-white/40 text-xl"></i>
              </div>
              <p v-else class="text-2xl font-bold text-white">{{ stats.tournaments }}</p>
              <p class="text-white/60 text-sm">Giải đấu</p>
            </div>
            <div class="stat-box">
              <i class="pi pi-users text-2xl text-blue-400 mb-2"></i>
              <div v-if="statsLoading" class="flex justify-center">
                <i class="pi pi-spin pi-spinner text-white/40 text-xl"></i>
              </div>
              <p v-else class="text-2xl font-bold text-white">{{ stats.clubs }}</p>
              <p class="text-white/60 text-sm">Câu lạc bộ</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== MODAL CHỈNH SỬA ===== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
          <div class="modal-box">
            <div class="modal-header">
              <h3 class="text-xl font-bold text-white">Chỉnh sửa thông tin</h3>
              <button class="modal-close" @click="closeEditModal">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Thông báo -->
            <Transition name="fade">
              <div v-if="saveMessage" :class="['alert-msg', saveSuccess ? 'success' : 'error']">
                <i :class="['pi', saveSuccess ? 'pi-check-circle' : 'pi-exclamation-circle', 'mr-2']"></i>
                {{ saveMessage }}
              </div>
            </Transition>

            <form @submit.prevent="saveProfile" class="modal-body space-y-4">

              <!-- Họ tên -->
              <div class="form-group">
                <label class="form-label">Họ và tên <span class="text-red-400">*</span></label>
                <input
                  v-model="form.fullName"
                  type="text"
                  class="form-input"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <!-- Giới tính -->
              <div class="form-group">
                <label class="form-label">Giới tính</label>
                <select v-model="form.gender" class="form-input">
                  <option value="">-- Chọn giới tính --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <!-- Ngày sinh -->
              <div class="form-group">
                <label class="form-label">Ngày sinh</label>
                <input
                  v-model="form.birthDate"
                  type="date"
                  class="form-input"
                />
              </div>

              <!-- Số điện thoại -->
              <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="form-input"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <!-- Buttons -->
              <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="closeEditModal" :disabled="saving">
                  Hủy
                </button>
                <button type="submit" class="btn-save" :disabled="saving">
                  <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
                  <i v-else class="pi pi-check mr-2"></i>
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

const authStore = useAuthStore();

// ---- Stats ----
const statsLoading = ref(true);
const stats = reactive({ clubs: 0, tournaments: 0 });

async function loadStats() {
  const userId = authStore.user?.id;
  if (!userId) { statsLoading.value = false; return; }

  try {
    // Đếm CLB đã tham gia (approved)
    const { count: clubCount } = await supabase
      .from('club_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved');

    stats.clubs = clubCount ?? 0;

    // Lấy danh sách club_id của user
    const { data: memberRows } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (memberRows && memberRows.length > 0) {
      const clubIds = memberRows.map(r => r.club_id);

      // Đếm giải đấu mà các CLB của user đã tham gia (approved)
      const { count: tourneyCount } = await supabase
        .from('tournament_registrations')
        .select('tournament_id', { count: 'exact', head: true })
        .in('club_id', clubIds)
        .eq('status', 'approved');

      stats.tournaments = tourneyCount ?? 0;
    } else {
      stats.tournaments = 0;
    }
  } catch (err) {
    console.error('[ProfileView] loadStats error:', err);
  } finally {
    statsLoading.value = false;
  }
}

onMounted(() => loadStats());

// ---- Modal state ----
const showEditModal = ref(false);
const saving = ref(false);
const saveMessage = ref('');
const saveSuccess = ref(false);

const form = reactive({
  fullName: '',
  gender: '',
  birthDate: '',
  phone: ''
});

// ---- Helpers ----
function genderLabel(val) {
  return { male: 'Nam', female: 'Nữ', other: 'Khác' }[val] || '-';
}

function formatDate(val) {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleDateString('vi-VN');
  } catch {
    return val;
  }
}

// ---- Modal actions ----
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
    const payload = {
      full_name:  form.fullName.trim(),
      gender:     form.gender    || null,
      birth_date: form.birthDate || null,
      phone:      form.phone.trim() || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', authStore.user.id);

    if (error) throw error;

    // Cập nhật local state
    if (authStore.profile) {
      authStore.profile.fullName  = form.fullName.trim();
      authStore.profile.gender    = form.gender    || null;
      authStore.profile.birthDate = form.birthDate || null;
      authStore.profile.phone     = form.phone.trim() || null;
    }

    saveSuccess.value = true;
    saveMessage.value = 'Cập nhật thông tin thành công!';

    setTimeout(() => {
      closeEditModal();
    }, 1200);
  } catch (err) {
    saveSuccess.value = false;
    saveMessage.value = err.message || 'Lưu thất bại, vui lòng thử lại.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* ---- Edit button ---- */
.btn-edit {
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* ---- Stat box ---- */
.stat-box {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  text-align: center;
}

/* ---- Modal overlay ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-box {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
}

.modal-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

/* ---- Form ---- */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.625rem;
  color: #fff;
  font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.form-input option {
  background: #1e1b4b;
  color: #fff;
}

/* ---- Buttons ---- */
.btn-cancel {
  flex: 1;
  padding: 0.7rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.625rem;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
}

.btn-save {
  flex: 2;
  padding: 0.7rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 0.625rem;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35);
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Alert ---- */
.alert-msg {
  margin: 1rem 1.5rem 0;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.alert-msg.success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
}

.alert-msg.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

/* ---- Transitions ---- */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-box,
.modal-leave-to .modal-box {
  transform: scale(0.92) translateY(16px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
