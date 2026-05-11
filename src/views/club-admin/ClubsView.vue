<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Quản lý câu lạc bộ</h1>
          <p class="page-sub">Xem, kiểm duyệt và vô hiệu hóa các câu lạc bộ</p>
        </div>
        <div class="header-stats">
          <div class="hstat" v-for="t in tabs" :key="t.key">
            <span class="hstat-num" :style="{color: t.color}">{{ countByStatus(t.key) }}</span>
            <span class="hstat-label">{{ t.label }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-row">
        <button
          v-for="t in tabs" :key="t.key"
          @click="activeTab = t.key"
          :class="['tab-btn', activeTab === t.key ? 'active' : '']"
          :style="activeTab === t.key ? { '--tab-color': t.color } : {}"
        >
          <i :class="t.icon"></i> {{ t.label }}
          <span class="tab-count">{{ countByStatus(t.key) }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <i class="pi pi-spinner pi-spin" style="font-size:2.5rem;color:rgba(255,255,255,0.3)"></i>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredClubs.length === 0" class="empty-state">
        <div class="empty-icon"><i class="pi pi-building"></i></div>
        <h3>Không có câu lạc bộ nào</h3>
        <p>Chưa có CLB nào ở trạng thái "{{ tabs.find(t=>t.key===activeTab)?.label }}"</p>
      </div>

      <!-- Grid -->
      <div v-else class="clubs-grid">
        <div v-for="(club, i) in filteredClubs" :key="club.id" class="club-card" :style="{ animationDelay: `${i * 0.06}s` }">
          <div class="card-glow"></div>

          <!-- Card Header -->
          <div class="club-header">
            <div class="club-logo">
              <img v-if="club.logoUrl || club.logo_url" :src="club.logoUrl || club.logo_url" :alt="club.name" />
              <span v-else class="logo-initials">{{ getInitials(club.name) }}</span>
            </div>
            <span class="status-badge" :class="getStatusClass(club.status)">
              <i :class="getStatusIcon(club.status)"></i> {{ getStatusText(club.status) }}
            </span>
          </div>

          <!-- Card Body -->
          <div class="club-body">
            <h3 class="club-name">{{ club.name }}</h3>
            <p class="club-desc">{{ club.description || 'Chưa có mô tả' }}</p>
            <div class="club-stats">
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

          <!-- Card Footer -->
          <div class="club-footer">
            <!-- View detail button always shown -->
            <router-link :to="{ path: `/club-admin/clubs/${club.id}`, query: { from: 'clubs', tab: activeTab } }" class="btn-detail">
              <i class="pi pi-eye"></i> Xem chi tiết
            </router-link>

            <!-- Approve / Reject if pending -->
            <template v-if="club.status === 'pending'">
              <button
                @click="approveClub(club)"
                :disabled="processingId === club.id"
                class="btn-approve"
              >
                <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
                <i v-else class="pi pi-check"></i> Duyệt
              </button>
              <button
                @click="openRejectModal(club)"
                :disabled="processingId === club.id"
                class="btn-reject"
              >
                <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
                <i v-else class="pi pi-times-circle"></i> Từ chối
              </button>
            </template>

            <!-- Suspend if approved -->
            <button
              v-if="club.status === 'approved'"
              @click="openSuspendModal(club)"
              :disabled="processingId === club.id"
              class="btn-suspend"
            >
              <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-ban"></i> Vô hiệu hóa
            </button>

            <!-- Restore if suspended -->
            <button
              v-else-if="club.status === 'suspended'"
              @click="restoreClub(club)"
              :disabled="processingId === club.id"
              class="btn-restore"
            >
              <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-refresh"></i> Khôi phục
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Suspend Modal -->
    <div v-if="suspendModal.show" class="modal-overlay" @click.self="suspendModal.show = false">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon suspend-icon"><i class="pi pi-ban"></i></div>
            <h2 class="modal-title">Vô hiệu hóa câu lạc bộ</h2>
          </div>
          <button @click="suspendModal.show = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">CLB: <strong>{{ suspendModal.club?.name }}</strong></p>
          <label class="field-label">
            <span>Lý do vô hiệu hóa <span class="req">*</span></span>
            <textarea v-model="suspendModal.reason" rows="3" placeholder="Nhập lý do..." class="field-textarea"></textarea>
          </label>
          <div class="modal-actions">
            <button @click="suspendModal.show = false" class="btn-cancel">Hủy</button>
            <button
              @click="confirmSuspend"
              :disabled="!suspendModal.reason.trim() || processingId === suspendModal.club?.id"
              class="btn-confirm-suspend"
            >
              <i v-if="processingId === suspendModal.club?.id" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-ban"></i> Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectModal.show" class="modal-overlay" @click.self="rejectModal.show = false">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon reject-icon"><i class="pi pi-times-circle"></i></div>
            <h2 class="modal-title">Từ chối câu lạc bộ</h2>
          </div>
          <button @click="rejectModal.show = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-sub">CLB: <strong>{{ rejectModal.club?.name }}</strong></p>
          <label class="field-label">
            <span>Lý do từ chối <span class="req">*</span></span>
            <textarea v-model="rejectModal.reason" rows="3" placeholder="Nhập lý do từ chối..." class="field-textarea"></textarea>
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

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <i :class="toast.type === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="toast-icon"></i>
        <div>
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <button @click="toast.show = false" class="toast-close"><i class="pi pi-times"></i></button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { clubRepository } from '../../repositories/ClubRepository.js';

const clubs    = ref([]);
const loading  = ref(true);
const processingId = ref(null);
const activeTab = ref('approved');
const route = useRoute();
const toast = ref({ show: false, type: 'success', title: '', message: '' });
const suspendModal = ref({ show: false, club: null, reason: '' });
const rejectModal = ref({ show: false, club: null, reason: '' });

const tabs = [
  { key: 'approved',  label: 'Đã duyệt',  icon: 'pi pi-check-circle', color: '#86efac' },
  { key: 'suspended', label: 'Vô hiệu',   icon: 'pi pi-ban',          color: '#fde68a' },
  { key: 'rejected',  label: 'Từ chối',   icon: 'pi pi-times-circle', color: '#fca5a5' },
];

const filteredClubs = computed(() => clubs.value.filter(c => c.status === activeTab.value));
const countByStatus = (s) => clubs.value.filter(c => c.status === s).length;

const getInitials    = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL';
const getStatusClass = s => ({ approved: 'sb-approved', suspended: 'sb-suspended', rejected: 'sb-rejected', pending: 'sb-pending' }[s] || 'sb-pending');
const getStatusText  = s => ({ approved: 'Đã duyệt', suspended: 'Vô hiệu', rejected: 'Từ chối', pending: 'Chờ duyệt' }[s] || s);
const getStatusIcon  = s => ({ approved: 'pi pi-check-circle', suspended: 'pi pi-ban', rejected: 'pi pi-times-circle', pending: 'pi pi-clock' }[s] || 'pi pi-circle');

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message };
  setTimeout(() => { toast.value.show = false; }, 3500);
};

const openSuspendModal = (club) => {
  suspendModal.value = { show: true, club, reason: '' };
};

const confirmSuspend = async () => {
  const { club, reason } = suspendModal.value;
  if (!reason.trim()) return;
  processingId.value = club.id;
  try {
    const result = await clubRepository.suspend(club.id, reason.trim());
    if (result.isOk()) {
      suspendModal.value.show = false;
      showToast('success', 'Đã vô hiệu hóa', `CLB "${club.name}" đã bị vô hiệu hóa.`);
      await loadClubs();
    } else {
      showToast('error', 'Lỗi', result.getError());
    }
  } catch (err) {
    showToast('error', 'Lỗi', err.message);
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
      showToast('error', 'Đã từ chối', `CLB "${club.name}" đã bị từ chối.`);
      await loadClubs();
    } else {
      showToast('error', 'Lỗi', result.getError());
    }
  } catch (err) {
    showToast('error', 'Lỗi', err.message);
  } finally {
    processingId.value = null;
  }
};

const restoreClub = async (club) => {
  processingId.value = club.id;
  try {
    const result = await clubRepository.approve(club.id);
    if (result.isOk()) {
      showToast('success', 'Đã khôi phục', `CLB "${club.name}" đã được khôi phục.`);
      await loadClubs();
    } else {
      showToast('error', 'Lỗi', result.getError());
    }
  } catch (err) {
    showToast('error', 'Lỗi', err.message);
  } finally {
    processingId.value = null;
  }
};

const approveClub = async (club) => {
  processingId.value = club.id;
  try {
    const result = await clubRepository.approve(club.id);
    if (result.isOk()) {
      showToast('success', 'Đã phê duyệt', `CLB "${club.name}" đã được phê duyệt.`);
      await loadClubs();
    } else {
      showToast('error', 'Lỗi', result.getError());
    }
  } catch (err) {
    showToast('error', 'Lỗi', err.message);
  } finally {
    processingId.value = null;
  }
};

const loadClubs = async () => {
  const result = await clubRepository.findWithMemberCount();
  if (result.isOk()) clubs.value = result.getValue();
};

onMounted(async () => {
  if (route.query.tab) activeTab.value = route.query.tab;
  await loadClubs();
  loading.value = false;
});
</script>

<style scoped>
/* Page Header */
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem;
}
.page-title { font-size: 2rem; font-weight: 800; color: white; margin-bottom: 0.25rem; }
.page-sub   { font-size: 0.875rem; color: rgba(255,255,255,0.45); }
.header-stats { display: flex; gap: 2rem; }
.hstat { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
.hstat-num   { font-size: 1.75rem; font-weight: 800; line-height: 1; }
.hstat-label { font-size: 0.72rem; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; }

/* Tabs */
.tabs-row { display: flex; gap: 0.75rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
.tab-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1.25rem; border-radius: 0.875rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.55); font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.tab-btn:hover { background: rgba(255,255,255,0.09); color: white; }
.tab-btn.active {
  background: rgba(255,255,255,0.1);
  border-color: var(--tab-color, #a5b4fc);
  color: var(--tab-color, #a5b4fc);
  box-shadow: 0 0 0 1px var(--tab-color, #a5b4fc) inset;
}
.tab-count {
  background: rgba(255,255,255,0.12); border-radius: 999px;
  padding: 0.05rem 0.45rem; font-size: 0.72rem;
}

/* Grid */
.clubs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }

/* Club Card */
.club-card {
  position: relative;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0; animation: fadeUp 0.5s ease forwards;
  display: flex; flex-direction: column;
}
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.club-card:hover { transform: translateY(-6px); border-color: rgba(99,102,241,0.3); box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1); }
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
  width: 64px; height: 64px; border-radius: 14px; overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
}
.club-logo img { width: 100%; height: 100%; object-fit: cover; }
.logo-initials { color: white; font-weight: 800; font-size: 1.4rem; }

.status-badge {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
}
.sb-approved { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.25); }
.sb-suspended{ background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }
.sb-rejected { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.sb-pending  { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.25); }

/* Club Body */
.club-body { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; align-items: center; }
.club-name { font-size: 1.125rem; font-weight: 700; color: white; margin-bottom: 0.4rem; text-align: center; }
.club-desc {
  font-size: 0.825rem; color: rgba(255,255,255,0.4); margin-bottom: 1rem; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.club-stats { display: flex; gap: 1rem; }
.c-stat { display: flex; align-items: center; gap: 0.4rem; font-size: 0.825rem; color: rgba(255,255,255,0.55); }
.c-stat-icon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }
.c-stat-icon.members { background: rgba(99,102,241,0.2); color: #a5b4fc; }
.c-stat-icon.trophies { background: rgba(245,158,11,0.2); color: #fcd34d; }

/* Club Footer */
.club-footer {
  padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; gap: 0.625rem;
}
.btn-detail {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem 0.5rem; border-radius: 0.75rem; text-decoration: none;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  color: #a5b4fc; font-size: 0.825rem; font-weight: 600; transition: all 0.2s;
}
.btn-detail:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); color: white; }
.btn-suspend {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem 0.5rem; border-radius: 0.75rem;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  color: #fde68a; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-suspend:hover { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.35); color: white; }
.btn-suspend:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-restore {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem 0.5rem; border-radius: 0.75rem;
  background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
  color: #6ee7b7; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-restore:hover { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.35); color: white; }
.btn-restore:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-approve {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem 0.5rem; border-radius: 0.75rem;
  background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.18);
  color: #6ee7b7; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-approve:hover { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.28); color: white; }

.btn-reject {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem 0.5rem; border-radius: 0.75rem;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.16);
  color: #fca5a5; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-reject:hover { background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.28); color: white; }
.btn-confirm-reject {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg,#ef4444,#f97316); color: white; border-radius: 0.625rem; font-weight: 600; cursor: pointer;
}
.btn-confirm-reject:hover { transform: translateY(-1px); }
.reject-icon { background: linear-gradient(135deg,#ef4444,#f97316); box-shadow: 0 4px 12px rgba(239,68,68,0.2); }

/* Empty */
.empty-state { text-align: center; padding: 5rem 1rem; }
.empty-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem; font-size: 2rem; color: rgba(99,102,241,0.5);
}
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
.empty-state p  { font-size: 0.875rem; color: rgba(255,255,255,0.4); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(2,6,23,0.8); backdrop-filter: blur(8px); padding: 1rem;
}
.modal-panel {
  width: min(480px, 100%);
  background: rgba(13,11,40,0.98); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.25rem; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.1);
  animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1);
}
@keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(-12px)} to{opacity:1;transform:scale(1) translateY(0)} }
.modal-header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,179,8,0.04));
}
.modal-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.modal-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: white; }
.suspend-icon { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
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
.field-label { display: flex; flex-direction: column; gap: 0.4rem; color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; }
.req { color: #f87171; }
.field-textarea {
  padding: 0.75rem 0.875rem; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 0.625rem;
  color: white; font: inherit; font-size: 0.875rem; resize: vertical; margin-top: 0.25rem;
}
.field-textarea:focus { outline: none; border-color: rgba(245,158,11,0.4); box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }
.field-textarea::placeholder { color: rgba(255,255,255,0.25); }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-cancel {
  padding: 0.65rem 1.25rem; background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7);
  border-radius: 0.625rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.875rem;
}
.btn-cancel:hover { background: rgba(255,255,255,0.12); }
.btn-confirm-suspend {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1.25rem; background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white; border-radius: 0.625rem; font-weight: 600; cursor: pointer;
  transition: all 0.25s; font-size: 0.875rem; box-shadow: 0 4px 16px rgba(245,158,11,0.25);
}
.btn-confirm-suspend:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(245,158,11,0.4); }
.btn-confirm-suspend:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

/* Toast */
.toast {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 1rem 1.25rem; background: rgba(13,11,40,0.95);
  border-radius: 1rem; backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
  min-width: 280px; max-width: 380px;
}
.toast.success { border-left: 3px solid #10b981; }
.toast.error   { border-left: 3px solid #ef4444; }
.toast-icon { font-size: 1.25rem; margin-top: 0.1rem; flex-shrink: 0; }
.toast.success .toast-icon { color: #10b981; }
.toast.error   .toast-icon { color: #ef4444; }
.toast-title { font-weight: 700; color: white; font-size: 0.9rem; margin-bottom: 0.2rem; }
.toast-msg   { font-size: 0.8rem; color: rgba(255,255,255,0.55); }
.toast-close {
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4); border-radius: 6px;
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; cursor: pointer; transition: all 0.2s; flex-shrink: 0; margin-left: auto;
}
.toast-close:hover { background: rgba(255,255,255,0.14); color: white; }
.toast-enter-active { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { animation: slideOut 0.25s ease forwards; }
@keyframes slideIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideOut { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(40px)} }
</style>
