<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Duyệt câu lạc bộ</h1>

      <div v-if="filteredClubs.length === 0" class="empty-state">
        <div class="empty-icon"><i class="pi pi-shield"></i></div>
        <h3>Không có câu lạc bộ nào chờ duyệt</h3>
      </div>

      <div v-else class="clubs-grid">
        <div v-for="(club, i) in filteredClubs" :key="club.id" class="club-card" :style="{ animationDelay: `${i * 0.06}s` }">
          <div class="card-glow"></div>
          <div class="club-header">
            <div class="club-logo">
              <img v-if="club.logoUrl || club.logo_url" :src="club.logoUrl || club.logo_url" :alt="club.name" />
              <span v-else class="logo-initials">{{ getInitials(club.name) }}</span>
            </div>
            <span class="status-badge sb-pending">Chờ duyệt</span>
          </div>
          <div class="club-body">
            <h3 class="club-name">{{ club.name }}</h3>
            <p class="club-desc text-center">{{ club.description || 'Chưa có mô tả' }}</p>
            <div class="club-stats justify-center mt-4">
              <div class="c-stat">
                <span class="c-stat-icon members"><i class="pi pi-users"></i></span>
                <span>{{ club.member_count || 0 }} thành viên</span>
              </div>
              <div class="c-stat">
                <span class="c-stat-icon trophies"><i class="pi pi-trophy"></i></span>
                <span>{{ club.tournament_count || 0 }} giải đấu</span>
              </div>
            </div>
          </div>
          <div class="club-footer">
            <div class="flex gap-3">
              <button @click="approveClub(club)" :disabled="processingId === club.id" class="btn-approve">
                <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
                <i v-else class="pi pi-check-circle"></i> Phê duyệt
              </button>
              <button @click="openRejectModal(club)" :disabled="processingId === club.id" class="btn-reject">
                <i class="pi pi-times-circle"></i> Từ chối
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <div class="toast-icon">
          <i :class="toast.type === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <button @click="toast.show = false" class="toast-close"><i class="pi pi-times"></i></button>
      </div>
    </Transition>

    <!-- Reject Modal -->
    <div v-if="rejectModal.show" class="modal-overlay" @click.self="rejectModal.show = false">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon reject-icon"><i class="pi pi-times"></i></div>
            <h2 class="modal-title">Từ chối câu lạc bộ</h2>
          </div>
          <button @click="rejectModal.show = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">Câu lạc bộ: <strong>{{ rejectModal.club?.name }}</strong></p>
          <label class="reject-label">
            <span>Lý do từ chối <span class="req">*</span></span>
            <textarea v-model="rejectModal.reason" rows="3" placeholder="Nhập lý do từ chối..." class="reject-textarea"></textarea>
          </label>
          <div class="modal-actions">
            <button @click="rejectModal.show = false" class="btn-cancel">Hủy</button>
            <button @click="confirmReject" :disabled="!rejectModal.reason.trim() || processingId === rejectModal.club?.id" class="btn-confirm-reject">
              <i v-if="processingId === rejectModal.club?.id" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-times-circle"></i> Xác nhận từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { clubRepository } from '../../repositories/ClubRepository.js';

const clubs = ref([]);
const processingId = ref(null);

const toast = ref({ show: false, type: 'success', title: '', message: '' });
const rejectModal = ref({ show: false, club: null, reason: '' });

const filteredClubs = computed(() => clubs.value.filter(c => c.status === 'pending'));

const getInitials = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL';

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message };
  setTimeout(() => { toast.value.show = false; }, 3500);
};

const approveClub = async (club) => {
  processingId.value = club.id;
  try {
    const result = await clubRepository.approve(club.id);
    if (result.isOk()) {
      showToast('success', 'Phê duyệt thành công!', `Câu lạc bộ "${club.name}" đã được phê duyệt.`);
      await loadClubs();
    } else {
      showToast('error', 'Có lỗi xảy ra', result.getError() || 'Không thể phê duyệt câu lạc bộ.');
    }
  } catch (err) {
    showToast('error', 'Có lỗi xảy ra', err.message);
  } finally {
    processingId.value = null;
  }
};

const openRejectModal = (club) => {
  rejectModal.value = { show: true, club, reason: '' };
};

const confirmReject = async () => {
  const { club, reason } = rejectModal.value;
  if (!reason.trim()) return;
  processingId.value = club.id;
  try {
    const result = await clubRepository.reject(club.id, reason.trim());
    if (result.isOk()) {
      rejectModal.value.show = false;
      showToast('error', 'Đã từ chối', `Câu lạc bộ "${club.name}" đã bị từ chối.`);
      await loadClubs();
    } else {
      showToast('error', 'Có lỗi xảy ra', result.getError() || 'Không thể từ chối câu lạc bộ.');
    }
  } catch (err) {
    showToast('error', 'Có lỗi xảy ra', err.message);
  } finally {
    processingId.value = null;
  }
};

const loadClubs = async () => {
  const result = await clubRepository.findWithMemberCount();
  if (result.isOk()) clubs.value = result.getValue();
};

onMounted(loadClubs);
</script>

<style scoped>
/* Grid */
.clubs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }

/* Club Card */
.club-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0; animation: fadeUp 0.5s ease forwards;
  display: flex; flex-direction: column;
}
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.club-card:hover { transform: translateY(-8px); border-color: rgba(99,102,241,0.3); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1); }
.card-glow {
  position: absolute; inset: 0; opacity: 0; pointer-events: none;
  background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 65%);
  transition: opacity 0.3s;
}
.club-card:hover .card-glow { opacity: 1; }

/* Club Header */
.club-header {
  padding: 1.25rem 1.25rem 1rem;
  display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.club-logo {
  width: 70px; height: 70px; border-radius: 14px; overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
}
.club-logo img { width: 100%; height: 100%; object-fit: cover; }
.logo-initials { color: white; font-weight: 800; font-size: 1.5rem; }

.status-badge { padding: 0.4rem 0.8rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.sb-pending { background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }

/* Club Body */
.club-body { padding: 1.5rem 1.25rem; flex: 1; display: flex; flex-direction: column; align-items: center; }
.club-name { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; text-align: center; }
.club-desc {
  font-size: 0.875rem; color: rgba(255,255,255,0.45); margin-bottom: 0.875rem;
  line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.club-stats { display: flex; gap: 1rem; width: 100%; }
.c-stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: rgba(255,255,255,0.6); }
.c-stat-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
.c-stat-icon.members { background: rgba(99,102,241,0.2); color: #a5b4fc; }
.c-stat-icon.trophies { background: rgba(245,158,11,0.2); color: #fcd34d; }

/* Club Footer */
.club-footer { padding: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); }

/* Buttons */
.btn-approve {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  flex: 1; padding: 0.75rem 0.5rem;
  background: linear-gradient(135deg, #10b981, #059669); border: 1px solid transparent;
  color: white; font-size: 0.875rem; font-weight: 600;
  border-radius: 0.875rem; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}
.btn-approve:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35); }
.btn-approve:active { transform: translateY(0); }
.btn-approve:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-reject {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  flex: 1; padding: 0.75rem 0.5rem;
  background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5; font-size: 0.875rem; font-weight: 600;
  border-radius: 0.875rem; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer;
}
.btn-reject:hover { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3); color: #fecaca; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15); }
.btn-reject:active { transform: translateY(0); }
.btn-reject:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ── Toast ── */
.toast {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: rgba(13, 11, 40, 0.95);
  border-radius: 1rem;
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
  min-width: 280px; max-width: 380px;
}
.toast.success { border-left: 3px solid #10b981; }
.toast.error   { border-left: 3px solid #ef4444; }

.toast-icon { font-size: 1.25rem; margin-top: 0.1rem; flex-shrink: 0; }
.toast.success .toast-icon { color: #10b981; }
.toast.error   .toast-icon { color: #ef4444; }

.toast-content { flex: 1; }
.toast-title { font-weight: 700; color: white; font-size: 0.9rem; margin-bottom: 0.2rem; }
.toast-msg { font-size: 0.8rem; color: rgba(255,255,255,0.55); }

.toast-close {
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4); border-radius: 6px;
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.toast-close:hover { background: rgba(255,255,255,0.14); color: white; }

.toast-enter-active { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { animation: slideOut 0.25s ease forwards; }
@keyframes slideIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideOut { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(40px)} }

/* ── Reject Modal ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(2,6,23,0.8); backdrop-filter: blur(8px); padding: 1rem;
}
.modal-panel {
  width: min(500px, 100%);
  background: rgba(13,11,40,0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.25rem; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1);
  animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1);
}
@keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(-12px)} to{opacity:1;transform:scale(1) translateY(0)} }

.modal-header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.04));
}
.modal-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.modal-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: white; }
.reject-icon { background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
.modal-title { font-size: 1.1rem; font-weight: 700; color: white; }
.modal-close {
  width: 34px; height: 34px; border-radius: 8px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.14); color: white; }

.modal-body { padding: 1.5rem; }
.modal-subtitle { font-size: 0.875rem; color: rgba(255,255,255,0.55); margin-bottom: 1rem; }
.modal-subtitle strong { color: rgba(255,255,255,0.85); }

.reject-label { display: flex; flex-direction: column; gap: 0.4rem; color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; }
.req { color: #f87171; }
.reject-textarea {
  padding: 0.75rem 0.875rem; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 0.625rem;
  color: white; font: inherit; font-size: 0.875rem; transition: all 0.2s; resize: vertical;
  margin-top: 0.25rem;
}
.reject-textarea:focus { outline: none; border-color: rgba(239,68,68,0.4); background: rgba(255,255,255,0.08); box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
.reject-textarea::placeholder { color: rgba(255,255,255,0.25); }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-cancel {
  padding: 0.65rem 1.25rem; background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7);
  border-radius: 0.625rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.875rem;
}
.btn-cancel:hover { background: rgba(255,255,255,0.12); }
.btn-confirm-reject {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1.25rem; background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white; border-radius: 0.625rem; font-weight: 600; cursor: pointer;
  transition: all 0.25s; font-size: 0.875rem; box-shadow: 0 4px 16px rgba(239,68,68,0.25);
}
.btn-confirm-reject:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(239,68,68,0.4); }
.btn-confirm-reject:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

/* Empty */
.empty-state { text-align: center; padding: 5rem 1rem; }
.empty-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2rem; color: rgba(99,102,241,0.5); }
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
</style>
