<template>
  <div class="page-wrapper">
    <div class="max-w-5xl mx-auto">

      <!-- Back -->
      <router-link :to="backLink" class="back-link">
        <i class="pi pi-arrow-left"></i> Quay lại danh sách
      </router-link>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-32">
        <i class="pi pi-spinner pi-spin" style="font-size:2.5rem;color:rgba(255,255,255,0.3)"></i>
      </div>

      <!-- Not found -->
      <div v-else-if="!club" class="empty-state">
        <div class="empty-icon"><i class="pi pi-building"></i></div>
        <h2>Không tìm thấy câu lạc bộ</h2>
      </div>

      <template v-else>
        <!-- Header card -->
        <div class="header-card">
          <div class="club-identity">
            <div class="club-logo">
              <img v-if="club.logoUrl || club.logo_url" :src="club.logoUrl || club.logo_url" :alt="club.name" />
              <span v-else>{{ initials(club.name) }}</span>
            </div>
            <div>
              <span class="status-badge" :class="statusClass(club.status)">
                <i :class="statusIcon(club.status)"></i> {{ statusText(club.status) }}
              </span>
              <h1 class="club-name">{{ club.name }}</h1>
              <p class="club-desc">{{ club.description || 'Chưa có mô tả' }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="action-group">
            <button v-if="club.status === 'approved'" @click="suspendModal.show = true" class="btn-suspend">
              <i class="pi pi-ban"></i> Vô hiệu hóa
            </button>
            <button v-if="club.status === 'suspended'" @click="restore" :disabled="processing" class="btn-restore">
              <i v-if="processing" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-refresh"></i> Khôi phục
            </button>
            <template v-if="club.status === 'pending'">
              <button @click="approve" :disabled="processing" class="btn-approve">
                <i v-if="processing" class="pi pi-spinner pi-spin"></i>
                <i v-else class="pi pi-check"></i> Duyệt
              </button>
              <button @click="rejectModal.show = true" :disabled="processing" class="btn-reject">
                <i class="pi pi-times-circle"></i> Từ chối
              </button>
            </template>
          </div>
        </div>

        <!-- Info grid -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon" style="background:rgba(99,102,241,0.15);color:#a5b4fc"><i class="pi pi-users"></i></div>
            <div>
              <div class="info-num">{{ memberCount }}</div>
              <div class="info-label">Thành viên</div>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon" style="background:rgba(16,185,129,0.15);color:#6ee7b7"><i class="pi pi-trophy"></i></div>
            <div>
              <div class="info-num">{{ club.tournament_count || 0 }}</div>
              <div class="info-label">Giải đấu</div>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon" style="background:rgba(245,158,11,0.15);color:#fcd34d"><i class="pi pi-calendar"></i></div>
            <div>
              <div class="info-num" style="font-size:1rem">{{ fmtDate(club.created_at) }}</div>
              <div class="info-label">Ngày thành lập</div>
            </div>
          </div>
        </div>

        <!-- Leader info -->
        <div class="section-card" v-if="club.leader">
          <div class="section-hdr">
            <div class="section-icon"><i class="pi pi-star-fill"></i></div>
            <h2 class="section-title">Trưởng câu lạc bộ</h2>
          </div>
          <div class="leader-row">
            <div class="avatar">
              <img v-if="club.leader.avatar_url" :src="club.leader.avatar_url" />
              <span v-else>{{ initials(club.leader.full_name) }}</span>
            </div>
            <div>
              <div class="leader-name">{{ club.leader.full_name }}</div>
              <div class="leader-email">{{ club.leader.email || '' }}</div>
            </div>
          </div>
        </div>

        <!-- Members -->
        <div class="section-card">
          <div class="section-hdr">
            <div class="section-icon"><i class="pi pi-users"></i></div>
            <h2 class="section-title">Thành viên ({{ members.length }})</h2>
          </div>
          <div v-if="members.length === 0" class="no-members">Chưa có thành viên</div>
          <div v-else class="members-list">
            <div v-for="m in members" :key="m.id" class="member-row">
              <div class="avatar sm">
                <img v-if="m.user?.avatar_url" :src="m.user.avatar_url" />
                <span v-else>{{ initials(m.user?.full_name || '?') }}</span>
              </div>
              <div class="member-info">
                <div class="member-name">{{ m.user?.full_name || 'Không rõ' }}</div>
                <div class="member-email">{{ m.user?.email || '' }}</div>
              </div>
              <span class="role-chip" :class="roleClass(m.role)">{{ roleText(m.role) }}</span>
              <span class="ms-chip" :class="msClass(m.status)">{{ msText(m.status) }}</span>
              <span class="member-date">{{ fmtDate(m.joined_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Suspension reason -->
        <div v-if="club.status === 'suspended' && club.suspension_reason" class="warn-card">
          <i class="pi pi-exclamation-triangle warn-icon"></i>
          <div>
            <div class="warn-title">Lý do vô hiệu hóa</div>
            <div class="warn-body">{{ club.suspension_reason }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Suspend Modal -->
    <div v-if="suspendModal.show" class="modal-overlay" @click.self="suspendModal.show = false">
      <div class="modal-panel">
        <div class="modal-hdr">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div class="modal-icon"><i class="pi pi-ban"></i></div>
            <h2 class="modal-title">Vô hiệu hóa CLB</h2>
          </div>
          <button @click="suspendModal.show = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-sub">CLB: <strong>{{ club?.name }}</strong></p>
          <label class="field-label">
            Lý do <span class="req">*</span>
            <textarea v-model="suspendModal.reason" rows="3" placeholder="Nhập lý do..." class="field-ta"></textarea>
          </label>
          <div class="modal-actions">
            <button @click="suspendModal.show = false" class="btn-cancel">Hủy</button>
            <button @click="confirmSuspend" :disabled="!suspendModal.reason.trim() || processing" class="btn-confirm-sus">
              <i v-if="processing" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-ban"></i> Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectModal.show" class="modal-overlay" @click.self="rejectModal.show = false">
      <div class="modal-panel">
        <div class="modal-hdr">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div class="modal-icon reject-icon"><i class="pi pi-times-circle"></i></div>
            <h2 class="modal-title">Từ chối CLB</h2>
          </div>
          <button @click="rejectModal.show = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-sub">CLB: <strong>{{ club?.name }}</strong></p>
          <label class="field-label">
            Lý do từ chối <span class="req">*</span>
            <textarea v-model="rejectModal.reason" rows="3" placeholder="Nhập lý do từ chối..." class="field-ta"></textarea>
          </label>
          <div class="modal-actions">
            <button @click="rejectModal.show = false" class="btn-cancel">Hủy</button>
            <button @click="confirmReject" :disabled="!rejectModal.reason.trim() || processing" class="btn-confirm-rej">
              <i v-if="processing" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-times-circle"></i> Xác nhận từ chối
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <i :class="toast.type==='success'?'pi pi-check-circle':'pi pi-times-circle'" class="toast-icon"></i>
        <div>
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <button @click="toast.show=false" class="toast-close"><i class="pi pi-times"></i></button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clubRepository } from '../../repositories/ClubRepository.js';
import { supabase } from '../../config/supabase.js';

const route = useRoute();
const router = useRouter();
const club      = ref(null);
const members   = ref([]);
const loading   = ref(true);
const processing = ref(false);
const toast = ref({ show: false, type: 'success', title: '', message: '' });
const suspendModal = ref({ show: false, reason: '' });
const rejectModal = ref({ show: false, reason: '' });

const memberCount = computed(() => members.value.filter(m => m.status !== 'rejected' && m.status !== 'removed').length);

const initials  = n => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '?';
const fmtDate   = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const statusClass = s => ({ approved:'sb-approved', suspended:'sb-suspended', rejected:'sb-rejected', pending:'sb-pending' }[s]||'sb-pending');
const statusText  = s => ({ approved:'Đã duyệt', suspended:'Vô hiệu', rejected:'Từ chối', pending:'Chờ duyệt' }[s]||s);
const statusIcon  = s => ({ approved:'pi pi-check-circle', suspended:'pi pi-ban', rejected:'pi pi-times-circle', pending:'pi pi-clock' }[s]||'pi pi-circle');

const backLink = computed(() => {
  const from = route.query.from;
  const tab = route.query.tab;
  if (from === 'dashboard') return { path: '/club-admin' };
  if (tab) return { path: '/club-admin/clubs', query: { tab } };
  return { path: '/club-admin/clubs' };
});
const roleText  = r => ({ leader:'Trưởng CLB', deputy:'Phó CLB', member:'Thành viên' }[r]||'Thành viên');
const roleClass = r => ({ leader:'role-leader', deputy:'role-deputy', member:'role-member' }[r]||'role-member');
const msText    = s => ({ approved:'Đã duyệt', pending:'Chờ duyệt', rejected:'Từ chối', removed:'Đã xóa' }[s]||s);
const msClass   = s => ({ approved:'ms-ok', pending:'ms-wait', rejected:'ms-no', removed:'ms-rm' }[s]||'');

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message };
  setTimeout(() => { toast.value.show = false; }, 3500);
};

const confirmSuspend = async () => {
  if (!suspendModal.value.reason.trim()) return;
  processing.value = true;
  const result = await clubRepository.suspend(club.value.id, suspendModal.value.reason.trim());
  processing.value = false;
  suspendModal.value.show = false;
  if (result.isOk()) {
    showToast('success', 'Đã vô hiệu hóa', `CLB "${club.value.name}" đã bị vô hiệu hóa.`);
    await loadClub();
  } else {
    showToast('error', 'Lỗi', result.getError());
  }
};

const confirmReject = async () => {
  if (!rejectModal.value.reason.trim()) return;
  processing.value = true;
  const result = await clubRepository.reject(club.value.id, rejectModal.value.reason.trim());
  processing.value = false;
  rejectModal.value.show = false;
  if (result.isOk()) {
    showToast('error', 'Đã từ chối', `Câu lạc bộ "${club.value.name}" đã bị từ chối.`);
    // redirect to approvals list to keep admin context
    router.push('/club-admin/approvals');
  } else {
    showToast('error', 'Lỗi', result.getError());
  }
};

const restore = async () => {
  processing.value = true;
  const result = await clubRepository.approve(club.value.id);
  processing.value = false;
  if (result.isOk()) {
    showToast('success', 'Đã khôi phục', `CLB "${club.value.name}" đã được khôi phục.`);
    await loadClub();
  } else {
    showToast('error', 'Lỗi', result.getError());
  }
};

const approve = async () => {
  processing.value = true;
  try {
    const result = await clubRepository.approve(club.value.id);
    processing.value = false;
    if (result.isOk()) {
      showToast('success', 'Đã phê duyệt', `CLB "${club.value.name}" đã được phê duyệt.`);
      // after approving, go back to clubs list showing approved tab
      router.push({ path: '/club-admin/clubs', query: { tab: 'approved' } });
    } else {
      showToast('error', 'Lỗi', result.getError());
    }
  } catch (err) {
    processing.value = false;
    showToast('error', 'Lỗi', err.message);
  }
};

const loadClub = async () => {
  const result = await clubRepository.findWithDetails(route.params.id);
  if (result.isOk()) {
    club.value = result.getValue();
    members.value = club.value.members || [];
  }
};

onMounted(async () => {
  await loadClub();

  // fetch members with email
  if (club.value?.id) {
    const { data } = await supabase
      .from('club_members')
      .select('id, role, status, joined_at, user:profiles(id, full_name, avatar_url, email)')
      .eq('club_id', club.value.id)
      .order('joined_at', { ascending: false });
    if (data) members.value = data;
  }
  loading.value = false;
});
</script>

<style scoped>
.page-wrapper { min-height:100vh; padding:1.5rem 1.5rem 3rem; }

.back-link {
  display:inline-flex; align-items:center; gap:.5rem;
  color:rgba(255,255,255,.45); font-size:.875rem; font-weight:600;
  text-decoration:none; margin-bottom:1.5rem; transition:color .2s;
}
.back-link:hover { color:white; }

/* Header card */
.header-card {
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
  border-radius:1.25rem; padding:1.75rem;
  display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:1.5rem;
  margin-bottom:1.25rem;
}
.club-identity { display:flex; align-items:flex-start; gap:1.25rem; }
.club-logo {
  width:80px; height:80px; border-radius:1rem; flex-shrink:0; overflow:hidden;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  display:flex; align-items:center; justify-content:center;
  font-size:1.75rem; font-weight:800; color:white;
  box-shadow:0 8px 32px rgba(99,102,241,.3); border:1px solid rgba(255,255,255,.1);
}
.club-logo img { width:100%; height:100%; object-fit:cover; }
.status-badge {
  display:inline-flex; align-items:center; gap:.35rem;
  padding:.3rem .75rem; border-radius:999px; font-size:.72rem; font-weight:700; margin-bottom:.4rem;
}
.sb-approved { background:rgba(34,197,94,.15);  color:#86efac; border:1px solid rgba(34,197,94,.25); }
.sb-suspended{ background:rgba(251,191,36,.15); color:#fde68a; border:1px solid rgba(251,191,36,.25); }
.sb-rejected { background:rgba(239,68,68,.15);  color:#fca5a5; border:1px solid rgba(239,68,68,.25); }
.sb-pending  { background:rgba(99,102,241,.15); color:#a5b4fc; border:1px solid rgba(99,102,241,.25); }
.club-name { font-size:1.75rem; font-weight:800; color:white; margin-bottom:.35rem; }
.club-desc { font-size:.875rem; color:rgba(255,255,255,.45); max-width:500px; line-height:1.6; }

.action-group { display:flex; gap:.75rem; flex-wrap:wrap; }
.btn-suspend {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.65rem 1.25rem; border-radius:.875rem;
  background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.25);
  color:#fde68a; font-size:.875rem; font-weight:600; cursor:pointer; transition:all .2s;
}
.btn-suspend:hover { background:rgba(245,158,11,.2); color:white; }
.btn-restore {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.65rem 1.25rem; border-radius:.875rem;
  background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25);
  color:#6ee7b7; font-size:.875rem; font-weight:600; cursor:pointer; transition:all .2s;
}
.btn-restore:hover { background:rgba(16,185,129,.2); color:white; }
.btn-restore:disabled { opacity:.5; cursor:not-allowed; }

.btn-reject {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.65rem 1.25rem; border-radius:.875rem;
  background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.18);
  color:#fca5a5; font-size:.875rem; font-weight:600; cursor:pointer; transition:all .2s;
}
.btn-reject:hover { background:rgba(239,68,68,.14); color:white; }

.btn-approve {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.65rem 1.25rem; border-radius:.875rem;
  background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.18);
  color:#6ee7b7; font-size:.875rem; font-weight:600; cursor:pointer; transition:all .2s;
}
.btn-approve:hover { background:rgba(16,185,129,.18); color:white; }

.reject-icon { background:linear-gradient(135deg,#ef4444,#f97316); box-shadow:0 4px 12px rgba(239,68,68,.2); }
.btn-confirm-rej {
  display:flex; align-items:center; gap:0.5rem; padding:0.65rem 1.25rem;
  background:linear-gradient(135deg,#ef4444,#f97316); color:white; border-radius:0.625rem; font-weight:600; cursor:pointer;
}
.btn-confirm-rej:hover { transform:translateY(-1px); }

/* Info grid */
.info-grid {
  display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:1rem; margin-bottom:1.25rem;
}
.info-card {
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
  border-radius:1rem; padding:1.25rem;
  display:flex; align-items:center; gap:1rem;
}
.info-icon {
  width:46px; height:46px; border-radius:12px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:1.2rem;
}
.info-num   { font-size:1.75rem; font-weight:800; color:white; line-height:1; }
.info-label { font-size:.78rem; color:rgba(255,255,255,.4); margin-top:.2rem; }

/* Section card */
.section-card {
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
  border-radius:1.25rem; overflow:hidden; margin-bottom:1.25rem;
}
.section-hdr {
  display:flex; align-items:center; gap:.75rem;
  padding:1rem 1.5rem; border-bottom:1px solid rgba(255,255,255,.06);
  background:linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.03));
}
.section-icon {
  width:32px; height:32px; border-radius:9px;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  display:flex; align-items:center; justify-content:center;
  font-size:.8rem; color:white;
}
.section-title { font-size:1rem; font-weight:700; color:white; }

/* Leader */
.leader-row { display:flex; align-items:center; gap:1rem; padding:1.25rem 1.5rem; }
.avatar {
  width:46px; height:46px; border-radius:50%; flex-shrink:0; overflow:hidden;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  display:flex; align-items:center; justify-content:center;
  font-size:.8rem; font-weight:700; color:white;
}
.avatar.sm { width:36px; height:36px; font-size:.7rem; }
.avatar img { width:100%; height:100%; object-fit:cover; }
.leader-name  { font-size:.95rem; font-weight:600; color:white; }
.leader-email { font-size:.8rem; color:rgba(255,255,255,.4); }

/* Members */
.no-members { padding:2rem; text-align:center; color:rgba(255,255,255,.35); }
.members-list { padding:.5rem 0; }
.member-row {
  display:flex; align-items:center; gap:.875rem;
  padding:.75rem 1.5rem; border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .2s; flex-wrap:wrap;
}
.member-row:last-child { border-bottom:none; }
.member-row:hover { background:rgba(255,255,255,.03); }
.member-info { flex:1; min-width:100px; }
.member-name  { font-size:.875rem; font-weight:600; color:white; }
.member-email { font-size:.75rem; color:rgba(255,255,255,.35); }
.member-date  { font-size:.75rem; color:rgba(255,255,255,.35); white-space:nowrap; }
.role-chip  { padding:.2rem .6rem; border-radius:999px; font-size:.7rem; font-weight:700; white-space:nowrap; }
.role-leader { background:rgba(168,85,247,.2); color:#c084fc; border:1px solid rgba(168,85,247,.3); }
.role-deputy { background:rgba(99,102,241,.2); color:#a5b4fc; border:1px solid rgba(99,102,241,.3); }
.role-member { background:rgba(255,255,255,.07); color:rgba(255,255,255,.5); border:1px solid rgba(255,255,255,.1); }
.ms-chip { padding:.2rem .6rem; border-radius:999px; font-size:.7rem; font-weight:700; white-space:nowrap; }
.ms-ok   { background:rgba(34,197,94,.15);  color:#86efac; border:1px solid rgba(34,197,94,.25); }
.ms-wait { background:rgba(251,191,36,.15); color:#fde68a; border:1px solid rgba(251,191,36,.25); }
.ms-no   { background:rgba(239,68,68,.15);  color:#fca5a5; border:1px solid rgba(239,68,68,.25); }
.ms-rm   { background:rgba(107,114,128,.2); color:#d1d5db; border:1px solid rgba(107,114,128,.3); }

/* Warn card */
.warn-card {
  display:flex; align-items:flex-start; gap:1rem;
  background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2);
  border-radius:1rem; padding:1.25rem 1.5rem; margin-bottom:1.25rem;
}
.warn-icon { font-size:1.25rem; color:#fde68a; flex-shrink:0; margin-top:.1rem; }
.warn-title { font-size:.875rem; font-weight:700; color:#fde68a; margin-bottom:.25rem; }
.warn-body  { font-size:.85rem; color:rgba(255,255,255,.6); }

/* Empty */
.empty-state { text-align:center; padding:6rem 1rem; }
.empty-icon {
  width:90px; height:90px; border-radius:50%;
  background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.2);
  display:flex; align-items:center; justify-content:center;
  margin:0 auto 1.5rem; font-size:2.5rem; color:rgba(99,102,241,.5);
}
.empty-state h2 { font-size:1.5rem; font-weight:700; color:white; }

/* Modal */
.modal-overlay {
  position:fixed; inset:0; z-index:50;
  display:flex; align-items:center; justify-content:center;
  background:rgba(2,6,23,.8); backdrop-filter:blur(8px); padding:1rem;
}
.modal-panel {
  width:min(480px,100%);
  background:rgba(13,11,40,.98); border:1px solid rgba(255,255,255,.1);
  border-radius:1.25rem; overflow:hidden;
  box-shadow:0 32px 80px rgba(0,0,0,.6);
  animation:modalIn .25s cubic-bezier(.16,1,.3,1);
}
@keyframes modalIn { from{opacity:0;transform:scale(.94) translateY(-12px)} to{opacity:1;transform:scale(1) translateY(0)} }
.modal-hdr {
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
  padding:1.25rem 1.5rem; border-bottom:1px solid rgba(255,255,255,.08);
  background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(234,179,8,.04));
}
.modal-icon {
  width:36px; height:36px; border-radius:9px;
  background:linear-gradient(135deg,#f59e0b,#d97706);
  display:flex; align-items:center; justify-content:center;
  font-size:.9rem; color:white; box-shadow:0 4px 12px rgba(245,158,11,.3);
}
.modal-title { font-size:1.1rem; font-weight:700; color:white; }
.modal-close {
  width:34px; height:34px; border-radius:8px;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
  color:rgba(255,255,255,.6); display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all .2s;
}
.modal-close:hover { background:rgba(255,255,255,.14); color:white; }
.modal-body { padding:1.5rem; }
.modal-sub { font-size:.875rem; color:rgba(255,255,255,.55); margin-bottom:1rem; }
.modal-sub strong { color:rgba(255,255,255,.85); }
.field-label { display:flex; flex-direction:column; gap:.4rem; color:rgba(255,255,255,.8); font-size:.85rem; font-weight:600; }
.req { color:#f87171; }
.field-ta {
  padding:.75rem .875rem; background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1); border-radius:.625rem;
  color:white; font:inherit; font-size:.875rem; resize:vertical; margin-top:.25rem;
}
.field-ta:focus { outline:none; border-color:rgba(245,158,11,.4); box-shadow:0 0 0 3px rgba(245,158,11,.08); }
.field-ta::placeholder { color:rgba(255,255,255,.25); }
.modal-actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.25rem; }
.btn-cancel {
  padding:.65rem 1.25rem; background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.12); color:rgba(255,255,255,.7);
  border-radius:.625rem; font-weight:600; cursor:pointer; transition:all .2s; font-size:.875rem;
}
.btn-cancel:hover { background:rgba(255,255,255,.12); }
.btn-confirm-sus {
  display:flex; align-items:center; gap:.5rem;
  padding:.65rem 1.25rem; background:linear-gradient(135deg,#f59e0b,#d97706);
  color:white; border-radius:.625rem; font-weight:600; cursor:pointer;
  transition:all .25s; font-size:.875rem; box-shadow:0 4px 16px rgba(245,158,11,.25);
}
.btn-confirm-sus:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(245,158,11,.4); }
.btn-confirm-sus:disabled { opacity:.55; cursor:not-allowed; transform:none; }

/* Toast */
.toast {
  position:fixed; bottom:2rem; right:2rem; z-index:9999;
  display:flex; align-items:flex-start; gap:.875rem;
  padding:1rem 1.25rem; background:rgba(13,11,40,.95);
  border-radius:1rem; backdrop-filter:blur(16px);
  box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06);
  min-width:280px; max-width:380px;
}
.toast.success { border-left:3px solid #10b981; }
.toast.error   { border-left:3px solid #ef4444; }
.toast-icon { font-size:1.25rem; margin-top:.1rem; flex-shrink:0; }
.toast.success .toast-icon { color:#10b981; }
.toast.error   .toast-icon { color:#ef4444; }
.toast-title { font-weight:700; color:white; font-size:.9rem; margin-bottom:.2rem; }
.toast-msg   { font-size:.8rem; color:rgba(255,255,255,.55); }
.toast-close {
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
  color:rgba(255,255,255,.4); border-radius:6px;
  width:24px; height:24px; display:flex; align-items:center; justify-content:center;
  font-size:.65rem; cursor:pointer; transition:all .2s; flex-shrink:0; margin-left:auto;
}
.toast-close:hover { background:rgba(255,255,255,.14); color:white; }
.toast-enter-active { animation:slideIn .35s cubic-bezier(.16,1,.3,1); }
.toast-leave-active { animation:slideOut .25s ease forwards; }
@keyframes slideIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideOut { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(40px)} }
</style>
