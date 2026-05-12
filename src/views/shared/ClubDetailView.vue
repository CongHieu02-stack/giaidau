<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <i class="pi pi-spinner pi-spin" style="font-size:2.5rem;color:rgba(255,255,255,0.4)"></i>
      </div>

      <div v-else-if="club" class="space-y-6">

        <!-- ── Hero card ── -->
        <div class="hero-card">
          <div class="hero-glow"></div>
          <div class="hero-inner">
            <!-- Logo -->
            <div class="club-logo">
              <img v-if="club.logoUrl" :src="club.logoUrl" :alt="club.name" />
              <template v-else>{{ getInitials(club.name) }}</template>
            </div>

            <!-- Info -->
            <div class="club-info">
              <div class="club-meta-top">
                <h1 class="club-title">{{ club.name }}</h1>
                <span class="status-badge" :class="getStatusClass(club.status)">{{ getStatusText(club.status) }}</span>
              </div>
              <p class="club-desc">{{ club.description || 'Chưa có mô tả' }}</p>

              <!-- Leader -->
              <div class="leader-row" v-if="leader">
                <div class="leader-avatar">
                  <img v-if="leader.avatar_url" :src="leader.avatar_url" :alt="leader.full_name" />
                  <span v-else>{{ getInitials(leader.full_name || '?') }}</span>
                </div>
                <div>
                  <div class="leader-label">Trưởng câu lạc bộ</div>
                  <div class="leader-name">{{ leader.full_name || leader.email || 'Không rõ' }}</div>
                </div>
              </div>

              <!-- Stats row -->
              <div class="stats-row">
                <div class="stat-chip">
                  <i class="pi pi-users"></i>
                  <span>{{ approvedMembers.length }} thành viên</span>
                </div>
                <div class="stat-chip">
                  <i class="pi pi-trophy"></i>
                  <span>{{ club.tournament_count || 0 }} giải đấu</span>
                </div>
              </div>

              <!-- Join / Status button -->
              <div v-if="authStore.isAuthenticated" class="mt-5">
                <!-- Nút cho trưởng CLB -->
                <div v-if="isLeader" class="flex gap-3 flex-wrap">
                  <div class="tag-leader">
                    <i class="pi pi-star-fill"></i> Trưởng câu lạc bộ
                  </div>
                  <button @click="openEditModal" class="btn-edit">
                    <i class="pi pi-pencil"></i> Chỉnh sửa thông tin CLB
                  </button>
                  <button @click="handleDeleteClub" :disabled="deleting" class="btn-delete-club">
                    <i :class="deleting ? 'pi pi-spinner pi-spin' : 'pi pi-trash'"></i>
                    {{ deleting ? 'Đang xóa...' : 'Xóa CLB' }}
                  </button>
                </div>
                <!-- Nút xóa cho admin QL CLB và admin hệ thống (không phải trưởng CLB) -->
                <div v-else-if="canDeleteClub" class="flex gap-3">
                  <button @click="handleDeleteClub" :disabled="deleting" class="btn-delete-club">
                    <i :class="deleting ? 'pi pi-spinner pi-spin' : 'pi pi-trash'"></i>
                    {{ deleting ? 'Đang xóa...' : 'Xóa CLB' }}
                  </button>
                </div>
                <template v-else>
                  <button v-if="canJoin" @click="handleJoin" :disabled="joining" class="btn-join">
                    <i v-if="joining" class="pi pi-spinner pi-spin"></i>
                    <i v-else class="pi pi-user-plus"></i>
                    {{ joining ? 'Đang gửi...' : 'Tham gia câu lạc bộ' }}
                  </button>
                  <div v-else-if="isPending" class="tag-pending">
                    <i class="pi pi-clock"></i> Đang chờ phê duyệt
                  </div>
                  <div v-else-if="isMember" class="tag-member">
                    <i class="pi pi-check-circle"></i> Đã tham gia
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Members table ── -->
        <div class="members-card">
          <div class="members-header">
            <div class="members-title-wrap">
              <div class="members-icon"><i class="pi pi-users"></i></div>
              <h2 class="members-title">Danh sách thành viên</h2>
            </div>
            <span class="members-count">{{ approvedMembers.length }} người</span>
          </div>

          <div v-if="membersLoading" class="members-loading">
            <i class="pi pi-spinner pi-spin"></i> Đang tải...
          </div>

          <div v-else-if="approvedMembers.length === 0" class="members-empty">
            <i class="pi pi-user-minus"></i>
            <p>Câu lạc bộ chưa có thành viên nào</p>
          </div>

          <div v-else class="members-table-wrap">
            <table class="members-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Thành viên</th>
                  <th class="th-center">Vai trò</th>
                  <th class="th-center">Ngày tham gia</th>
                  <th class="th-center">Trạng thái</th>
                  <th v-if="isLeader" class="th-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in approvedMembers" :key="m.id">
                  <td class="td-num">{{ i + 1 }}</td>
                  <td class="td-user">
                    <div class="user-cell">
                      <div class="user-avatar">
                        <img v-if="m.user?.avatar_url" :src="m.user.avatar_url" :alt="m.user?.full_name" />
                        <span v-else>{{ getInitials(m.user?.full_name || '?') }}</span>
                      </div>
                      <div>
                        <div class="user-name">{{ m.user?.full_name || 'Không rõ' }}</div>
                        <div class="user-email">{{ m.user?.email || '' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="td-center">
                    <span class="role-badge" :class="getRoleClass(m.role)">{{ getRoleText(m.role) }}</span>
                  </td>
                  <td class="td-date td-center">{{ formatDate(m.joined_at) }}</td>
                  <td class="td-center">
                    <span class="status-chip" :class="getMemberStatusClass(m.status)">{{ getMemberStatusText(m.status) }}</span>
                  </td>
                  <td v-if="isLeader" class="td-center">
                    <button 
                      v-if="m.role !== 'leader' && !String(m.id).startsWith('leader-')" 
                      class="btn-remove-member"
                      :disabled="removingId === m.id"
                      @click="handleRemove(m)"
                      title="Xóa khỏi CLB"
                    >
                      <i v-if="removingId === m.id" class="pi pi-spinner pi-spin"></i>
                      <i v-else class="pi pi-user-minus"></i>
                    </button>
                    <span v-else class="text-xs text-white/20">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── Pending requests table (Leader only) ── -->
        <div v-if="isLeader && pendingMembers.length > 0" class="members-card">
          <div class="members-header" style="background: linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04));">
            <div class="members-title-wrap">
              <div class="members-icon" style="background: linear-gradient(135deg, #fbbf24, #f59e0b);"><i class="pi pi-clock"></i></div>
              <h2 class="members-title">Yêu cầu chờ duyệt</h2>
            </div>
            <span class="members-count">{{ pendingMembers.length }} người</span>
          </div>

          <div class="members-table-wrap">
            <table class="members-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người dùng</th>
                  <th class="th-center">Ngày yêu cầu</th>
                  <th class="th-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in pendingMembers" :key="m.id">
                  <td class="td-num">{{ i + 1 }}</td>
                  <td class="td-user">
                    <div class="user-cell">
                      <div class="user-avatar">
                        <img v-if="m.user?.avatar_url" :src="m.user.avatar_url" :alt="m.user?.full_name" />
                        <span v-else>{{ getInitials(m.user?.full_name || '?') }}</span>
                      </div>
                      <div>
                        <div class="user-name">{{ m.user?.full_name || 'Không rõ' }}</div>
                        <div class="user-email">{{ m.user?.email || '' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="td-date td-center">{{ formatDate(m.joined_at) }}</td>
                  <td class="td-center">
                    <div class="action-btns">
                      <button class="btn-approve" :disabled="approvingId === m.id || rejectingId === m.id" @click="approveM(m)">
                        <i v-if="approvingId === m.id" class="pi pi-spinner pi-spin"></i>
                        <i v-else class="pi pi-check"></i> Duyệt
                      </button>
                      <button class="btn-reject" :disabled="approvingId === m.id || rejectingId === m.id" @click="rejectM(m)">
                        <i v-if="rejectingId === m.id" class="pi pi-spinner pi-spin"></i>
                        <i v-else class="pi pi-times"></i> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div v-else class="text-center py-24">
        <h2 style="font-size:1.75rem;font-weight:700;color:white">Không tìm thấy câu lạc bộ</h2>
      </div>
    </div>
    
    <!-- ── Edit Modal ── -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon"><i class="pi pi-pencil"></i></div>
            <h2 class="modal-title">Chỉnh sửa thông tin CLB</h2>
          </div>
          <button @click="showEditModal = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <form @submit.prevent="handleUpdate" class="modal-body">
          <div class="form-grid">
            <label class="field field-wide">
              <span>Tên CLB <span class="req">*</span></span>
              <input v-model.trim="editForm.name" type="text" placeholder="Nhập tên câu lạc bộ" required />
            </label>
            <label class="field">
              <span>Tên viết tắt</span>
              <input v-model.trim="editForm.short_name" type="text" placeholder="VD: MU, RM" />
            </label>
            <label class="field">
              <span>Logo URL</span>
              <input v-model.trim="editForm.logo_url" type="url" placeholder="https://..." />
            </label>
            <label class="field field-wide">
              <span>Mô tả</span>
              <textarea v-model.trim="editForm.description" rows="4" placeholder="Giới thiệu về câu lạc bộ..."></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="btn-cancel" :disabled="updating">Hủy</button>
            <button type="submit" class="btn-submit" :disabled="updating">
              <i :class="updating ? 'pi pi-spinner pi-spin' : 'pi pi-check'"></i>
              {{ updating ? 'Đang cập nhật...' : 'Lưu thay đổi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clubRepository } from '../../repositories/ClubRepository.js';
import { useAuthStore } from '../../stores/auth.js';
import { supabase } from '../../config/supabase.js';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const confirmService = useConfirm();

const club = ref(null);
const leader = ref(null);
const members = ref([]);
const loading = ref(true);
const membersLoading = ref(true);
const joining = ref(false);
const memberStatus = ref('none');
const approvingId = ref(null);
const rejectingId = ref(null);
const removingId = ref(null);

// Edit Club
const showEditModal = ref(false);
const updating = ref(false);
const deleting = ref(false);
const editForm = ref({
  name: '',
  short_name: '',
  logo_url: '',
  description: ''
});

const openEditModal = () => {
  editForm.value = {
    name: club.value.name,
    short_name: club.value.short_name || '',
    logo_url: club.value.logoUrl || '',
    description: club.value.description || ''
  };
  showEditModal.value = true;
};

const handleUpdate = async () => {
  if (!editForm.value.name.trim()) return;
  updating.value = true;
  try {
    // Chỉ gửi các trường cần thiết, không gửi createdAt để tránh lỗi schema cache
    const updatedClub = {
      id: club.value.id,
      name: editForm.value.name.trim(),
      short_name: editForm.value.short_name.trim() || null,
      logo_url: editForm.value.logo_url.trim() || null,
      description: editForm.value.description.trim() || null,
      leader_id: club.value.leaderId,
      deputy_id: club.value.deputyId || null,
      status: club.value.status,
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('clubs')
      .update(updatedClub)
      .eq('id', club.value.id)
      .select()
      .single();

    if (error) throw error;

    // Cập nhật club.value với dữ liệu mới
    club.value = { ...club.value, ...data };
    showEditModal.value = false;
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật thông tin câu lạc bộ thành công!', life: 3000 });
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 5000 });
  } finally {
    updating.value = false;
  }
};

const isLeader = computed(() => club.value?.leaderId === authStore.user?.id);

const approvedMembers = computed(() => {
  const approved = members.value.filter(m => m.status === 'approved');
  const clubLeaderId = club.value?.leaderId;
  const clubLeader = club.value?.leader || leader.value;

  if (!clubLeaderId || !clubLeader) return approved;

  // Check if leader is already in approved list
  const leaderInList = approved.some(m => m.user?.id === clubLeaderId || m.role === 'leader');

  if (!leaderInList) {
    // Inject leader as first entry
    const leaderRow = {
      id: `leader-${clubLeaderId}`,
      user: clubLeader,
      role: 'leader',
      status: 'approved',
      joined_at: club.value?.createdAt || null
    };
    return [leaderRow, ...approved];
  }

  // Fix role of leader in list if incorrect
  return approved.map(m =>
    m.user?.id === clubLeaderId ? { ...m, role: 'leader' } : m
  );
});

const pendingMembers = computed(() => members.value.filter(m => m.status === 'pending'));

const canJoin  = computed(() => authStore.isAuthenticated && !isLeader.value && memberStatus.value === 'none');
const isPending = computed(() => memberStatus.value === 'pending');
const isMember  = computed(() => memberStatus.value === 'member' || memberStatus.value === 'approved');

// Kiểm tra quyền xóa CLB: trưởng CLB, admin QL CLB, hoặc admin hệ thống
const canDeleteClub = computed(() => {
  if (!authStore.isAuthenticated || !club.value) return false;
  return isLeader.value || authStore.isClubAdmin || authStore.isSuperAdmin;
});

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
const getStatusClass = (s) => ({ pending: 'sb-pending', approved: 'sb-approved' }[s] || 'sb-default');
const getStatusText  = (s) => ({ pending: 'Chờ duyệt', approved: 'Đã duyệt' }[s] || s);

const getRoleText  = (r) => ({ leader: 'Trưởng CLB', deputy: 'Phó CLB', member: 'Thành viên' }[r] || r || 'Thành viên');
const getRoleClass = (r) => ({ leader: 'role-leader', deputy: 'role-deputy', member: 'role-member' }[r] || 'role-member');

const getMemberStatusText  = (s) => ({ approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối', removed: 'Đã xóa' }[s] || s);
const getMemberStatusClass = (s) => ({ approved: 'ms-approved', pending: 'ms-pending', rejected: 'ms-rejected', removed: 'ms-removed' }[s] || '');

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const handleJoin = async () => {
  joining.value = true;
  try {
    const { error } = await supabase.from('club_members').insert({
      club_id: club.value.id,
      user_id: authStore.user.id,
      role: 'member',
      status: 'pending',
      joined_at: new Date().toISOString()
    });
    if (error) throw error;
    memberStatus.value = 'pending';
    toast.add({ severity: 'success', summary: 'Đã gửi yêu cầu', detail: 'Vui lòng chờ ban quản trị phê duyệt', life: 3000 });
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 3000 });
  } finally {
    joining.value = false;
  }
};

const approveM = async (m) => {
  approvingId.value = m.id;
  try {
    const { error } = await supabase
      .from('club_members')
      .update({ status: 'approved' })
      .eq('id', m.id);
    if (error) throw error;
    m.status = 'approved';
    toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã duyệt thành viên ${m.user?.full_name}`, life: 2000 });
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 3000 });
  } finally {
    approvingId.value = null;
  }
};

const rejectM = async (m) => {
  rejectingId.value = m.id;
  try {
    const { error } = await supabase
      .from('club_members')
      .update({ status: 'rejected' })
      .eq('id', m.id);
    if (error) throw error;
    m.status = 'rejected';
    toast.add({ severity: 'info', summary: 'Đã từ chối', detail: `Đã từ chối yêu cầu của ${m.user?.full_name}`, life: 2000 });
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 3000 });
  } finally {
    rejectingId.value = null;
  }
};

const handleRemove = async (m) => {
  if (m.role === 'leader' || String(m.id).startsWith('leader-')) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Không thể xóa trưởng câu lạc bộ!', life: 3000 });
    return;
  }

  confirmService.require({
    message: `Bạn có chắc chắn muốn xóa thành viên "${m.user?.full_name}" ra khỏi câu lạc bộ?`,
    header: 'Xác nhận xóa',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Xóa',
    rejectLabel: 'Hủy',
    accept: async () => {
      removingId.value = m.id;
      try {
        const result = await clubRepository.removeMember(club.value.id, m.id);
        if (result.isOk()) {
          members.value = members.value.filter(item => item.id !== m.id);
          toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa thành viên thành công.', life: 3000 });
        } else {
          throw new Error(result.getError());
        }
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi khi xóa: ' + err.message, life: 3000 });
      } finally {
        removingId.value = null;
      }
    }
  });
};

// Xóa câu lạc bộ (chỉ trưởng CLB, admin QL CLB, admin hệ thống)
const handleDeleteClub = async () => {
  if (!canDeleteClub.value) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Bạn không có quyền xóa câu lạc bộ này!', life: 3000 });
    return;
  }

  confirmService.require({
    message: `Bạn có chắc chắn muốn xóa câu lạc bộ "${club.value?.name}"?\n\nHành động này không thể hoàn tác!`,
    header: 'Xác nhận xóa câu lạc bộ',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Xóa CLB',
    rejectLabel: 'Hủy',
    accept: async () => {
      deleting.value = true;
      try {
        // Xóa các thành viên của CLB trước
        const { error: membersError } = await supabase
          .from('club_members')
          .delete()
          .eq('club_id', club.value.id);

        if (membersError) throw membersError;

        // Xóa CLB
        const { error: clubError } = await supabase
          .from('clubs')
          .delete()
          .eq('id', club.value.id);

        if (clubError) throw clubError;

        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa câu lạc bộ thành công!', life: 3000 });
        // Chuyển hướng về trang danh sách CLB
        router.push('/clubs');
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi khi xóa câu lạc bộ: ' + err.message, life: 5000 });
      } finally {
        deleting.value = false;
      }
    }
  });
};

onMounted(async () => {
  const clubId = route.params.id;
  if (!clubId) {
    loading.value = false;
    membersLoading.value = false;
    return;
  }

  try {
    // Use findWithDetails to fetch club, leader, and members in a single efficient query
    // This reduces the number of network requests and speeds up initial load
    const result = await clubRepository.findWithDetails(clubId);
    
    if (result.isOk()) {
      const clubData = result.getValue();
      club.value = clubData;
      leader.value = clubData.leader;
      members.value = clubData.members || [];
      
      // Fetch current user membership status if authenticated
      if (authStore.isAuthenticated && authStore.user) {
        const { data: myData, error: memberError } = await supabase
          .from('club_members')
          .select('status')
          .eq('club_id', clubId)
          .eq('user_id', authStore.user.id)
          .maybeSingle();
          
        if (!memberError && myData) {
          memberStatus.value = myData.status;
        }
      }
    }
  } catch (err) {
    console.error('Error loading club details:', err);
  } finally {
    loading.value = false;
    membersLoading.value = false;
  }
});
</script>

<style scoped>
.page-wrapper { min-height: 100vh; padding: 6rem 1.5rem 3rem; }

/* ── Hero card ── */
.hero-card {
  position: relative; overflow: hidden;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem; padding: 2rem;
}
.hero-glow {
  position: absolute; top: -80px; left: -80px;
  width: 400px; height: 400px; pointer-events: none;
  background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%);
}
.hero-inner { display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; position: relative; }

.club-logo {
  width: 120px; height: 120px; border-radius: 1.25rem; flex-shrink: 0; overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 2.25rem; font-weight: 800; color: white;
  box-shadow: 0 8px 32px rgba(99,102,241,0.3);
  border: 1px solid rgba(255,255,255,0.1);
}
.club-logo img { width: 100%; height: 100%; object-fit: cover; }

.club-info { flex: 1; min-width: 240px; }
.club-meta-top { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.club-title { font-size: 2rem; font-weight: 800; color: white; line-height: 1.1; }

.status-badge { padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.sb-pending  { background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }
.sb-approved { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.25); }
.sb-default  { background: rgba(107,114,128,0.2); color: #d1d5db; border: 1px solid rgba(107,114,128,0.3); }

.club-desc { font-size: 0.9rem; color: rgba(255,255,255,0.55); margin-bottom: 1.25rem; line-height: 1.6; }

/* Leader */
.leader-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.leader-avatar {
  width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700; color: white;
}
.leader-avatar img { width: 100%; height: 100%; object-fit: cover; }
.leader-label { font-size: 0.72rem; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.leader-name  { font-size: 0.95rem; color: white; font-weight: 700; }

/* Stats row */
.stats-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.stat-chip {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.45rem 1rem; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 999px;
  font-size: 0.82rem; color: rgba(255,255,255,0.6);
}
.stat-chip .pi { color: #a5b4fc; font-size: 0.85rem; }

/* Join tags */
.tag-leader, .tag-pending, .tag-member {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1.25rem; border-radius: 0.875rem; font-size: 0.875rem; font-weight: 600;
}
.tag-leader  { background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.25); }
.tag-pending { background: rgba(251,191,36,0.12); color: #fde68a; border: 1px solid rgba(251,191,36,0.2); }
.tag-member  { background: rgba(34,197,94,0.12);  color: #86efac; border: 1px solid rgba(34,197,94,0.2); }
.btn-join { /* uses global .btn-join from src/style.css */ }

.btn-edit {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1.25rem; border-radius: 0.875rem; font-size: 0.875rem; font-weight: 600;
  background: rgba(255,255,255,0.06); color: white;
  border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.2s;
}
.btn-edit:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }

/* Delete Club Button */
.btn-delete-club {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1.25rem; border-radius: 0.875rem; font-size: 0.875rem; font-weight: 600;
  background: rgba(239,68,68,0.1); color: #fca5a5;
  border: 1px solid rgba(239,68,68,0.3); cursor: pointer; transition: all 0.2s;
}
.btn-delete-club:hover:not(:disabled) { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); transform: translateY(-1px); }
.btn-delete-club:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Modal Styles (Similar to ClubsView) ── */
.modal-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(2,6,23,0.85); backdrop-filter: blur(8px); padding: 1rem; }
.modal-panel { width: min(560px, 100%); background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.6); animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1); }
@keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(-10px)} to{opacity:1;transform:scale(1) translateY(0)} }

.modal-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06)); }
.modal-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.modal-icon { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: white; }
.modal-title { font-size: 1.15rem; font-weight: 700; color: white; }
.modal-close { width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.modal-close:hover { background: rgba(255,255,255,0.14); color: white; }

.modal-body { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
.field { display: flex; flex-direction: column; gap: 0.5rem; color: rgba(255,255,255,0.8); font-size: 0.875rem; font-weight: 600; }
.field-wide { grid-column: 1 / -1; }
.field input, .field textarea { padding: 0.75rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; color: white; font: inherit; transition: all 0.2s; resize: vertical; }
.field input:focus, .field textarea:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.08); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.field input::placeholder, .field textarea::placeholder { color: rgba(255,255,255,0.2); }
.req { color: #f87171; }

.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
.btn-cancel { padding: 0.7rem 1.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: rgba(255,255,255,0.1); color: white; }
.btn-submit { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 2rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }

/* ── Members card ── */
.members-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem; overflow: hidden;
}
.members-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04));
}
.members-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.members-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; color: white;
}
.members-title { font-size: 1.1rem; font-weight: 700; color: white; }
.members-count {
  font-size: 0.8rem; color: rgba(255,255,255,0.45); font-weight: 600;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
  padding: 0.3rem 0.8rem; border-radius: 999px;
}

.members-loading, .members-empty {
  padding: 3rem; text-align: center; color: rgba(255,255,255,0.35); font-size: 0.9rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.members-empty .pi { font-size: 2rem; }

/* Table */
.members-table-wrap { overflow-x: auto; }
.members-table { width: 100%; border-collapse: collapse; }
.members-table thead tr {
  background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06);
}
.members-table th {
  padding: 0.875rem 1.25rem; text-align: left;
  font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap;
}
.members-table tbody tr {
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.2s;
}
.members-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.members-table td { padding: 0.875rem 1.25rem; font-size: 0.875rem; color: rgba(255,255,255,0.7); }

.td-num  { color: rgba(255,255,255,0.3); font-size: 0.8rem; width: 40px; }
.td-date { color: rgba(255,255,255,0.4); font-size: 0.8rem; white-space: nowrap; }
.th-center { text-align: center !important; }
.td-center  { text-align: center; vertical-align: middle; }

/* Action buttons */
.action-btns { display: flex; align-items: center; justify-content: center; gap: 0.4rem; flex-wrap: wrap; }
.btn-approve {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.65rem; border-radius: 0.5rem; font-size: 0.72rem; font-weight: 700;
  background: rgba(34,197,94,0.15); color: #86efac; border: 1px solid rgba(34,197,94,0.3);
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-approve:hover:not(:disabled) { background: rgba(34,197,94,0.28); color: white; }
.btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reject {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.65rem; border-radius: 0.5rem; font-size: 0.72rem; font-weight: 700;
  background: rgba(239,68,68,0.13); color: #fca5a5; border: 1px solid rgba(239,68,68,0.25);
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-reject:hover:not(:disabled) { background: rgba(239,68,68,0.25); color: white; }
.btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-remove-member {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(239,68,68,0.1); color: #f87171;
  border: 1px solid rgba(239,68,68,0.2); cursor: pointer; transition: all 0.2s;
}
.btn-remove-member:hover:not(:disabled) { background: #ef4444; color: white; border-color: #ef4444; transform: scale(1.05); }
.btn-remove-member:disabled { opacity: 0.5; cursor: not-allowed; }

.no-action { color: rgba(255,255,255,0.2); font-size: 0.8rem; }

.user-cell { display: flex; align-items: center; gap: 0.75rem; }
.user-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: white;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-name  { font-weight: 600; color: white; font-size: 0.875rem; }
.user-email { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

/* Role badges */
.role-badge { padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.role-leader { background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
.role-deputy { background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
.role-member { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1); }

/* Member status chips */
.status-chip { padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.ms-approved { background: rgba(34,197,94,0.15); color: #86efac; border: 1px solid rgba(34,197,94,0.25); }
.ms-pending  { background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }
.ms-rejected { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.ms-removed  { background: rgba(107,114,128,0.2); color: #d1d5db; border: 1px solid rgba(107,114,128,0.3); }
</style>
