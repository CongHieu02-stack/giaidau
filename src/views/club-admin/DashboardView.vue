<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      
      <!-- Hero Header -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-shield"></i></div>
          <div>
            <h1 class="hero-title">Quản lý Câu lạc bộ</h1>
            <p class="hero-subtitle">Hệ thống giám sát, phê duyệt và quản lý toàn bộ các câu lạc bộ trên MyLeague.</p>
          </div>
        </div>
      </div>
      
      <!-- Stats Summary -->
      <div class="stats-overview">
        <div class="stat-item" v-for="s in statsItems" :key="s.label">
          <div class="stat-icon-mini" :style="{ background: s.bg, color: s.color }">
            <i :class="s.icon"></i>
          </div>
          <div class="stat-details">
            <span class="stat-val" :style="{ color: s.color }">{{ s.value }}</span>
            <span class="stat-lab">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Search -->
      <div class="actions-bar mb-6">
        <div class="search-box">
          <i class="pi pi-search search-ico"></i>
          <input v-model="searchQuery" type="text" placeholder="Tìm kiếm tên câu lạc bộ..." class="search-input" />
        </div>
        <div class="filter-tabs">
          <button 
            v-for="f in statusFilters" 
            :key="f.key"
            @click="activeFilter = f.key"
            :class="['filter-btn', activeFilter === f.key ? 'active' : '']"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Main Table -->
      <div class="table-container">
        <div v-if="loading" class="flex justify-center py-20">
          <i class="pi pi-spinner pi-spin text-3xl text-white/20"></i>
        </div>
        
        <table v-else-if="filteredClubs.length > 0" class="admin-table">
          <thead>
            <tr>
              <th class="text-left">Câu lạc bộ</th>
              <th class="text-left">Người quản lý</th>
              <th class="text-center">Thành viên</th>
              <th class="text-center">Ngày tạo</th>
              <th class="text-center">Trạng thái</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="club in filteredClubs" :key="club.id">
              <td>
                <div class="club-cell">
                  <div class="club-avatar">
                    <img v-if="club.logoUrl" :src="club.logoUrl" :alt="club.name" />
                    <span v-else>{{ getInitials(club.name) }}</span>
                  </div>
                  <div class="club-info">
                    <div class="club-name-row">
                      <span class="club-name">{{ club.name }}</span>
                      <span v-if="club.shortName" class="club-short">({{ club.shortName }})</span>
                    </div>
                    <span class="club-id">ID: {{ club.id.substring(0, 8) }}</span>
                  </div>
                </div>
              </td>
              <td class="text-left">
                <div class="manager-cell" v-if="club.leader">
                  <span class="manager-name">{{ club.leader.full_name }}</span>
                </div>
                <span v-else class="text-white/30 text-xs italic">Chưa cập nhật</span>
              </td>
              <td class="text-center">
                <span class="member-count">{{ club.member_count || 0 }} đội viên</span>
              </td>
              <td class="text-center">
                <span class="date-cell">{{ formatDate(club.createdAt) }}</span>
              </td>
              <td class="text-center">
                <span class="status-badge" :class="getStatusClass(club.status)">
                  {{ getStatusText(club.status) }}
                </span>
              </td>
              <td>
                <div class="actions-cell">
                  <router-link :to="{ path: `/club-admin/clubs/${club.id}`, query: { from: 'dashboard' } }" class="action-btn-icon view" title="Xem chi tiết">
                    <i class="pi pi-eye"></i>
                  </router-link>
                  
                  <!-- Toggle Status Action -->
                  <button 
                    v-if="club.status === 'approved'" 
                    @click="openSuspendModal(club)"
                    class="action-btn-icon suspend" 
                    title="Vô hiệu hóa"
                    :disabled="processingId === club.id"
                  >
                    <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
                    <i v-else class="pi pi-ban"></i>
                  </button>
                  
                  <button 
                    v-else-if="club.status === 'suspended'" 
                    @click="restoreClub(club)"
                    class="action-btn-icon restore" 
                    title="Khôi phục"
                    :disabled="processingId === club.id"
                  >
                    <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
                    <i v-else class="pi pi-refresh"></i>
                  </button>

                    <button 
                      v-else-if="club.status === 'pending'" 
                      @click="approveClub(club)"
                      class="action-btn-icon approve" 
                      title="Phê duyệt"
                      :disabled="processingId === club.id"
                    >
                      <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
                      <i v-else class="pi pi-check"></i>
                    </button>

                    <button 
                      @click="openDeleteModal(club)"
                      class="action-btn-icon delete" 
                      title="Xóa câu lạc bộ"
                      :disabled="processingId === club.id"
                    >
                      <i v-if="processingId === club.id" class="pi pi-spinner pi-spin"></i>
                      <i v-else class="pi pi-trash"></i>
                    </button>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-else class="empty-state py-20">
          <div class="empty-icon-wrap"><i class="pi pi-search"></i></div>
          <h3 class="text-xl font-semibold text-white/80 mt-4">Không tìm thấy kết quả</h3>
          <p class="text-white/40">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      </div>

    </div>

    <!-- Suspend Confirmation Modal -->
    <div v-if="suspendModal.show" class="modal-overlay" @click.self="suspendModal.show = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Vô hiệu hóa câu lạc bộ</h3>
          <button @click="suspendModal.show = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="mb-4 text-white/70">Bạn đang thực hiện vô hiệu hóa CLB: <strong>{{ suspendModal.club?.name }}</strong></p>
          <div class="form-group">
            <label class="form-label">Lý do vô hiệu hóa <span class="text-red-500">*</span></label>
            <textarea 
              v-model="suspendModal.reason" 
              class="form-textarea" 
              placeholder="Nhập lý do cụ thể..."
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="suspendModal.show = false" class="btn-secondary">Hủy bỏ</button>
          <button 
            @click="confirmSuspend" 
            class="btn-danger"
            :disabled="!suspendModal.reason.trim() || processingId === suspendModal.club?.id"
          >
            <i v-if="processingId === suspendModal.club?.id" class="pi pi-spinner pi-spin mr-2"></i>
            Xác nhận vô hiệu hóa
          </button>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div v-if="deleteModal.show" class="modal-overlay" @click.self="deleteModal.show = false">
      <div class="modal-card">
        <div class="modal-header delete-header">
          <h3>Xóa câu lạc bộ</h3>
          <button @click="deleteModal.show = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="mb-2 text-white/70">Bạn đang thực hiện xóa vĩnh viễn CLB: <strong>{{ deleteModal.club?.name }}</strong></p>
          <div class="delete-warning-box">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Hành động này không thể hoàn tác. Tất cả dữ liệu thành viên liên quan sẽ bị xóa.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="deleteModal.show = false" class="btn-secondary">Hủy bỏ</button>
          <button 
            @click="confirmDelete" 
            class="btn-danger"
            :disabled="processingId === deleteModal.club?.id"
          >
            <i v-if="processingId === deleteModal.club?.id" class="pi pi-spinner pi-spin mr-2"></i>
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="fade">
      <div v-if="toast.show" class="toast-msg" :class="toast.type">
        <i :class="toast.icon"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { clubRepository } from '../../repositories/ClubRepository.js';
import { supabase } from '../../config/supabase.js';
import { formatDate } from '../../utils/helpers.js';

const clubs = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const activeFilter = ref('all');
const processingId = ref(null);
const toast = ref({ show: false, type: 'success', message: '', icon: '' });

const suspendModal = ref({ show: false, club: null, reason: '' });
const deleteModal = ref({ show: false, club: null });

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đang hoạt động' },
  { key: 'suspended', label: 'Vô hiệu hóa' }
];

const statsItems = computed(() => [
  { label: 'Tổng số CLB', value: clubs.value.length, icon: 'pi pi-building', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  { label: 'Đang hoạt động', value: clubs.value.filter(c => c.status === 'approved').length, icon: 'pi pi-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { label: 'Chờ phê duyệt', value: clubs.value.filter(c => c.status === 'pending').length, icon: 'pi pi-clock', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { label: 'Bị vô hiệu', value: clubs.value.filter(c => c.status === 'suspended').length, icon: 'pi pi-ban', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
]);

const filteredClubs = computed(() => {
  let result = clubs.value;
  
  if (activeFilter.value !== 'all') {
    result = result.filter(c => c.status === activeFilter.value);
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.shortName?.toLowerCase().includes(q)
    );
  }
  
  return result;
});

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getStatusClass = (s) => ({
  'status-pending': s === 'pending',
  'status-approved': s === 'approved',
  'status-suspended': s === 'suspended',
  'status-rejected': s === 'rejected'
});

const getStatusText = (s) => {
  const texts = {
    pending: 'Chờ duyệt',
    approved: 'Đang hoạt động',
    suspended: 'Vô hiệu hóa',
    rejected: 'Đã từ chối'
  };
  return texts[s] || s;
};

const showToast = (message, type = 'success') => {
  const icon = type === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-circle';
  toast.value = { show: true, message, type, icon };
  setTimeout(() => { toast.value.show = false; }, 3000);
};

const loadClubs = async () => {
  loading.value = true;
  try {
    const result = await clubRepository.findWithMemberCount();
    if (result.isOk()) {
      clubs.value = result.getValue();
    }
  } catch (err) {
    console.error('Error loading clubs:', err);
    showToast('Không thể tải danh sách câu lạc bộ', 'error');
  } finally {
    loading.value = false;
  }
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
      showToast(`Đã vô hiệu hóa CLB ${club.name}`);
      suspendModal.value.show = false;
      await loadClubs();
    } else {
      showToast(result.getError(), 'error');
    }
  } catch (err) {
    showToast('Có lỗi xảy ra', 'error');
  } finally {
    processingId.value = null;
  }
};

const restoreClub = async (club) => {
  processingId.value = club.id;
  try {
    const result = await clubRepository.approve(club.id); // Re-approve to restore
    if (result.isOk()) {
      showToast(`Đã khôi phục CLB ${club.name}`);
      await loadClubs();
    }
  } catch (err) {
    showToast('Có lỗi xảy ra', 'error');
  } finally {
    processingId.value = null;
  }
};

const approveClub = async (club) => {
  processingId.value = club.id;
  try {
    const result = await clubRepository.approve(club.id);
    if (result.isOk()) {
      showToast(`Đã phê duyệt CLB ${club.name}`);
      await loadClubs();
    }
  } catch (err) {
    showToast('Có lỗi xảy ra', 'error');
  } finally {
    processingId.value = null;
  }
};

const openDeleteModal = (club) => {
  deleteModal.value = { show: true, club };
};

const confirmDelete = async () => {
  const club = deleteModal.value.club;
  if (!club) return;
  
  processingId.value = club.id;
  try {
    // Delete club members
    const { error: mErr } = await supabase.from('club_members').delete().eq('club_id', club.id);
    if (mErr) throw mErr;
    
    // Delete club
    const { error: cErr } = await supabase.from('clubs').delete().eq('id', club.id);
    if (cErr) throw cErr;
    
    showToast(`Đã xóa CLB ${club.name}`);
    deleteModal.value.show = false;
    await loadClubs();
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Không thể xóa câu lạc bộ', 'error');
  } finally {
    processingId.value = null;
  }
};

onMounted(loadClubs);
</script>

<style scoped>
.page-hero {
  position: relative; margin-bottom: 2rem;
  padding: 3rem; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 2.5rem; overflow: hidden;
}
.hero-glow {
  position: absolute; top: -100px; left: -100px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 2rem; position: relative; z-index: 1; }
.hero-icon {
  width: 80px; height: 80px; border-radius: 1.5rem; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: white;
  box-shadow: 0 20px 40px rgba(99,102,241,0.3);
}
.hero-title { font-size: 2.5rem; font-weight: 800; color: white; line-height: 1.1; margin: 0; }
.hero-subtitle { font-size: 1.1rem; color: rgba(255,255,255,0.5); margin-top: 0.75rem; }

.stats-overview {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;
  margin-bottom: 2rem;
}
.stat-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.25rem; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 1.5rem;
}
.stat-icon-mini {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
}
.stat-val { display: block; font-size: 1.5rem; font-weight: 800; }
.stat-lab { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.4); }

/* Actions Bar */
.actions-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .actions-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-ico {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: white;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.filter-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: white;
}

.filter-btn.active {
  background: #6366f1;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Table */
.table-container {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  padding: 1.25rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.admin-table td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-align: left; /* Default to left to override global center */
}

.text-left { text-align: left !important; }
.text-center { text-align: center !important; }
.text-right { text-align: right !important; }

.admin-table tr:last-child td {
  border-bottom: none;
}

.admin-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Cell Styles */
.club-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.club-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.club-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-name {
  display: block;
  font-weight: 600;
  color: white;
}

.club-short {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.club-id {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  font-family: monospace;
}

.manager-name {
  color: white;
  font-weight: 500;
}

.member-count {
  color: #a5b4fc;
  font-weight: 500;
}

.date-cell {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.4);
}

.status-badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-pending { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
.status-approved { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
.status-suspended { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.action-btn-icon:hover {
  transform: translateY(-2px);
}

.action-btn-icon.view:hover { background: rgba(99, 102, 241, 0.1); color: #818cf8; border-color: rgba(99, 102, 241, 0.2); }
.action-btn-icon.suspend:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2); }
.action-btn-icon.delete:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
.action-btn-icon.restore:hover { background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.2); }
.action-btn-icon.approve:hover { background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.2); }

/* Empty State */
.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.2);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.modal-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.modal-close:hover {
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

.form-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: white;
  padding: 0.75rem;
  font: inherit;
  outline: none;
  resize: none;
}

.form-textarea:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.delete-header {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
}

.delete-warning-box {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.75rem;
  color: #fca5a5;
  font-size: 0.875rem;
}

.delete-warning-box i {
  color: #ef4444;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger {
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  background: #ef4444;
  border: none;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toast */
.toast-msg {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 200;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.toast-msg.success i { color: #10b981; }
.toast-msg.error i { color: #ef4444; }

.fade-enter-active, .fade-leave-active { transition: all 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>
