<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-32">
        <i class="pi pi-spinner pi-spin" style="font-size:2.5rem;color:rgba(255,255,255,0.35)"></i>
      </div>

      <!-- No club -->
      <div v-else-if="!club" class="no-club-state">
        <div class="no-club-icon"><i class="pi pi-building"></i></div>
        <h2>Bạn chưa quản lý câu lạc bộ nào</h2>
        <p>Hãy tạo hoặc được phân quyền quản lý câu lạc bộ để sử dụng trang này.</p>
      </div>

      <!-- Main content -->
      <template v-else>
        <!-- Header -->
        <div class="dashboard-header">
          <div class="club-identity">
            <div class="club-logo">
              <img v-if="club.logoUrl || club.logo_url" :src="club.logoUrl || club.logo_url" :alt="club.name" />
              <span v-else>{{ getInitials(club.name) }}</span>
            </div>
            <div>
              <div class="club-role-tag"><i class="pi pi-star-fill"></i> Trưởng câu lạc bộ</div>
              <h1 class="club-name">{{ club.name }}</h1>
              <div class="club-status-row">
                <span class="status-chip" :class="getStatusClass(club.status)">{{ getStatusText(club.status) }}</span>
                <span class="club-created">Thành lập {{ formatDate(club.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <router-link to="/club/edit" class="btn-edit-club">
              <i class="pi pi-pencil"></i> Chỉnh sửa CLB
            </router-link>
          </div>
        </div>

        <!-- Stats grid -->
        <div class="stats-grid">
          <div class="stat-card" style="--accent:#6366f1">
            <div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#a5b4fc"><i class="pi pi-users"></i></div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalMembers }}</div>
              <div class="stat-label">Thành viên</div>
              <div class="stat-sub" v-if="stats.pendingMembers > 0">
                <span class="pending-badge">{{ stats.pendingMembers }} chờ duyệt</span>
              </div>
            </div>
          </div>
          <div class="stat-card" style="--accent:#f59e0b">
            <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#fcd34d"><i class="pi pi-clock"></i></div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.pendingMembers }}</div>
              <div class="stat-label">Chờ duyệt</div>
              <div class="stat-sub">
                <router-link to="/club/members" class="link-sub">Xem ngay →</router-link>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="--accent:#10b981">
            <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#6ee7b7"><i class="pi pi-trophy"></i></div>
            <div class="stat-content">
              <div class="stat-number">{{ club.tournament_count || 0 }}</div>
              <div class="stat-label">Giải đấu</div>
            </div>
          </div>
          <div class="stat-card" style="--accent:#8b5cf6">
            <div class="stat-icon" style="background:rgba(139,92,246,0.15);color:#c084fc"><i class="pi pi-chart-bar"></i></div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.approvedMembers }}</div>
              <div class="stat-label">Đã duyệt</div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon"><i class="pi pi-bolt"></i></div>
            <h2 class="section-title">Thao tác nhanh</h2>
          </div>
          <div class="quick-actions">
            <router-link to="/club/members" class="qa-btn">
              <div class="qa-icon" style="background:rgba(99,102,241,0.15);color:#a5b4fc"><i class="pi pi-users"></i></div>
              <span class="qa-label">Quản lý thành viên</span>
              <span v-if="stats.pendingMembers > 0" class="qa-badge">{{ stats.pendingMembers }}</span>
            </router-link>
            <router-link to="/club/tournaments" class="qa-btn">
              <div class="qa-icon" style="background:rgba(16,185,129,0.15);color:#6ee7b7"><i class="pi pi-trophy"></i></div>
              <span class="qa-label">Giải đấu CLB</span>
            </router-link>
            <router-link to="/club/edit" class="qa-btn">
              <div class="qa-icon" style="background:rgba(245,158,11,0.15);color:#fcd34d"><i class="pi pi-pencil"></i></div>
              <span class="qa-label">Chỉnh sửa thông tin</span>
            </router-link>
            <router-link :to="`/clubs/${club.id}`" class="qa-btn">
              <div class="qa-icon" style="background:rgba(139,92,246,0.15);color:#c084fc"><i class="pi pi-eye"></i></div>
              <span class="qa-label">Xem trang công khai</span>
            </router-link>
          </div>
        </div>

        <!-- Recent members -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon"><i class="pi pi-users"></i></div>
            <h2 class="section-title">Thành viên gần đây</h2>
            <router-link to="/club/members" class="section-link">Xem tất cả →</router-link>
          </div>

          <div v-if="recentMembers.length === 0" class="empty-members">
            <i class="pi pi-user-minus"></i>
            <p>Chưa có thành viên nào</p>
          </div>
          <div v-else class="members-list">
            <div v-for="m in recentMembers" :key="m.id" class="member-row">
              <div class="member-avatar">
                <img v-if="m.user?.avatar_url" :src="m.user.avatar_url" :alt="m.user?.full_name" />
                <span v-else>{{ getInitials(m.user?.full_name || '?') }}</span>
              </div>
              <div class="member-info">
                <div class="member-name">{{ m.user?.full_name || 'Không rõ' }}</div>
                <div class="member-email">{{ m.user?.email || '' }}</div>
              </div>
              <span class="role-chip" :class="getRoleClass(m.role)">{{ getRoleText(m.role) }}</span>
              <span class="status-chip-sm" :class="getMsClass(m.status)">{{ getMsText(m.status) }}</span>
              <span class="member-date">{{ formatDate(m.joined_at) }}</span>
            </div>
          </div>
        </div>
      </template>
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
import { useAuthStore } from '../../stores/auth.js';
import { supabase } from '../../config/supabase.js';

const authStore = useAuthStore();

const club = ref(null);
const members = ref([]);
const loading = ref(true);
const toast = ref({ show: false, type: 'success', title: '', message: '' });

const stats = computed(() => ({
  totalMembers: members.value.filter(m => m.status !== 'rejected' && m.status !== 'removed').length,
  pendingMembers: members.value.filter(m => m.status === 'pending').length,
  approvedMembers: members.value.filter(m => m.status === 'approved').length,
}));

const recentMembers = computed(() =>
  [...members.value]
    .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
    .slice(0, 5)
);

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
const getStatusClass = (s) => ({ pending: 'sc-pending', approved: 'sc-approved', rejected: 'sc-rejected' }[s] || 'sc-default');
const getStatusText  = (s) => ({ pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }[s] || s || '');
const getRoleText    = (r) => ({ leader: 'Trưởng CLB', deputy: 'Phó CLB', member: 'Thành viên' }[r] || 'Thành viên');
const getRoleClass   = (r) => ({ leader: 'role-leader', deputy: 'role-deputy', member: 'role-member' }[r] || 'role-member');
const getMsText      = (s) => ({ approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối', removed: 'Đã xóa' }[s] || s);
const getMsClass     = (s) => ({ approved: 'ms-approved', pending: 'ms-pending', rejected: 'ms-rejected', removed: 'ms-removed' }[s] || '');
const formatDate     = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message };
  setTimeout(() => { toast.value.show = false; }, 3500);
};

onMounted(async () => {
  try {
    // Fetch the club led by current user
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('leader_id', authStore.user?.id)
      .maybeSingle();

    if (clubError) throw clubError;
    club.value = clubData;

    if (club.value) {
      // Fetch members
      const { data: membersData } = await supabase
        .from('club_members')
        .select('id, role, status, joined_at, user:profiles(id, full_name, avatar_url, email)')
        .eq('club_id', club.value.id)
        .order('joined_at', { ascending: false });
      members.value = membersData || [];
    }
  } catch (err) {
    showToast('error', 'Lỗi tải dữ liệu', err.message);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-wrapper { min-height: 100vh; padding: 6rem 1.5rem 3rem; }

/* No club */
.no-club-state {
  text-align: center; padding: 6rem 1rem;
}
.no-club-icon {
  width: 90px; height: 90px; border-radius: 50%; margin: 0 auto 1.5rem;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; color: rgba(99,102,241,0.5);
}
.no-club-state h2 { font-size: 1.5rem; font-weight: 700; color: white; margin-bottom: 0.75rem; }
.no-club-state p  { color: rgba(255,255,255,0.4); }

/* Header */
.dashboard-header {
  display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;
  margin-bottom: 2rem;
}
.club-identity { display: flex; align-items: center; gap: 1.25rem; }
.club-logo {
  width: 80px; height: 80px; border-radius: 1rem; flex-shrink: 0; overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; font-weight: 800; color: white;
  box-shadow: 0 8px 32px rgba(99,102,241,0.3);
  border: 1px solid rgba(255,255,255,0.1);
}
.club-logo img { width: 100%; height: 100%; object-fit: cover; }
.club-role-tag {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.25rem 0.75rem; border-radius: 999px;
  background: rgba(168,85,247,0.15); color: #c084fc;
  border: 1px solid rgba(168,85,247,0.25);
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
}
.club-name { font-size: 1.875rem; font-weight: 800; color: white; line-height: 1.15; margin-bottom: 0.5rem; }
.club-status-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.club-created { font-size: 0.8rem; color: rgba(255,255,255,0.35); }

.btn-edit-club {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8); border-radius: 0.875rem;
  font-size: 0.875rem; font-weight: 600; transition: all 0.2s;
  text-decoration: none;
}
.btn-edit-club:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); color: white; }

/* Status chips */
.status-chip { padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.sc-approved { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.25); }
.sc-pending  { background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }
.sc-rejected { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.sc-default  { background: rgba(107,114,128,0.2); color: #d1d5db; border: 1px solid rgba(107,114,128,0.3); }

/* Stats grid */
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; padding: 1.25rem;
  display: flex; align-items: center; gap: 1rem;
  transition: all 0.3s; position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--accent); opacity: 0; transition: opacity 0.3s;
}
.stat-card:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-3px); }
.stat-card:hover::before { opacity: 1; }
.stat-icon {
  width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
}
.stat-number { font-size: 2rem; font-weight: 800; color: white; line-height: 1; }
.stat-label  { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-top: 0.2rem; }
.stat-sub    { margin-top: 0.35rem; }
.pending-badge {
  font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px;
  background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.2);
}
.link-sub { font-size: 0.75rem; color: #a5b4fc; font-weight: 600; text-decoration: none; }
.link-sub:hover { color: white; }

/* Section card */
.section-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.5rem;
}
.section-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1.125rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03));
}
.section-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; color: white; flex-shrink: 0;
}
.section-title { font-size: 1.05rem; font-weight: 700; color: white; flex: 1; }
.section-link  { font-size: 0.8rem; color: #a5b4fc; font-weight: 600; text-decoration: none; }
.section-link:hover { color: white; }

/* Quick actions */
.quick-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; padding: 1.5rem; }
.qa-btn {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 1.5rem 1rem; border-radius: 1rem; text-decoration: none;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  transition: all 0.3s; position: relative;
}
.qa-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); transform: translateY(-3px); }
.qa-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
.qa-label { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.75); text-align: center; }
.qa-badge {
  position: absolute; top: 0.75rem; right: 0.75rem;
  background: #ef4444; color: white; font-size: 0.65rem; font-weight: 700;
  padding: 0.1rem 0.45rem; border-radius: 999px; min-width: 18px; text-align: center;
}

/* Members list */
.empty-members {
  padding: 3rem; text-align: center; color: rgba(255,255,255,0.35);
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.empty-members .pi { font-size: 2rem; }
.members-list { padding: 0.5rem 0; }
.member-row {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.2s; flex-wrap: wrap;
}
.member-row:last-child { border-bottom: none; }
.member-row:hover { background: rgba(255,255,255,0.03); }

.member-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: white;
}
.member-avatar img { width: 100%; height: 100%; object-fit: cover; }
.member-info { flex: 1; min-width: 100px; }
.member-name  { font-size: 0.875rem; font-weight: 600; color: white; }
.member-email { font-size: 0.75rem; color: rgba(255,255,255,0.35); }
.member-date  { font-size: 0.75rem; color: rgba(255,255,255,0.35); white-space: nowrap; }

/* Role & status chips */
.role-chip { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
.role-leader { background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
.role-deputy { background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
.role-member { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1); }

.status-chip-sm { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
.ms-approved { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.25); }
.ms-pending  { background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }
.ms-rejected { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.ms-removed  { background: rgba(107,114,128,0.2); color: #d1d5db; border: 1px solid rgba(107,114,128,0.3); }

/* Toast */
.toast {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: rgba(13,11,40,0.95); border-radius: 1rem;
  backdrop-filter: blur(16px);
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
