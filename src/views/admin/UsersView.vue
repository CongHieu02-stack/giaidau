<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header with Search -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <i class="pi pi-users title-icon"></i>
            Quản lý người dùng
          </h1>
          <p class="page-subtitle">Quản lý và phân quyền người dùng hệ thống</p>
        </div>
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc email..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ users.length }}</span>
            <span class="stat-label">Tổng người dùng</span>
          </div>
        </div>
        <div class="stat-card active">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ activeCount }}</span>
            <span class="stat-label">Đang hoạt động</span>
          </div>
        </div>
        <div class="stat-card suspended">
          <div class="stat-icon"><i class="pi pi-ban"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ suspendedCount }}</span>
            <span class="stat-label">Bị khóa</span>
          </div>
        </div>
        <div class="stat-card roles">
          <div class="stat-icon"><i class="pi pi-star"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ adminCount }}</span>
            <span class="stat-label">Admin/Super</span>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="skeleton-grid">
          <div v-for="n in 6" :key="n" class="skeleton-card">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line half"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Cards Grid -->
      <div v-else-if="filteredUsers.length > 0" class="users-grid">
        <div 
          v-for="(user, index) in filteredUsers" 
          :key="user.id" 
          class="user-card"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="showUserDetail(user)"
        >
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="card-header">
              <div class="avatar" :style="{ backgroundColor: user.avatarColor }">
                <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.fullName" />
                <span v-else>{{ user.initials }}</span>
              </div>
              <div class="status-dot" :class="user.status"></div>
            </div>
            
            <div class="card-body">
              <h3 class="user-name">{{ user.fullName }}</h3>
              <p class="user-email">{{ user.email }}</p>
              <div class="card-tags">
                <span class="tag role" :class="user.role">
                  <i :class="getRoleIcon(user.role)"></i>
                  {{ getRoleText(user.role) }}
                </span>
                <span class="tag status" :class="user.status">
                  {{ getStatusText(user.status) }}
                </span>
              </div>
            </div>
            
            <div class="card-footer">
              <span class="join-date">
                <i class="pi pi-calendar"></i>
                {{ formatDate(user.createdAt) }}
              </span>
              <button class="view-btn">
                <i class="pi pi-eye"></i>
                Xem
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="pi pi-search"></i>
        </div>
        <h3>Không tìm thấy người dùng</h3>
        <p>Thử tìm kiếm với từ khóa khác</p>
      </div>
    </div>

    <!-- User Detail Modal -->
    <Transition name="modal">
      <div v-if="selectedUser" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-glow"></div>
          <div class="modal-header">
            <div class="modal-title">
              <div class="title-icon-wrapper">
                <i class="pi pi-user"></i>
              </div>
              <div>
                <h2>Chi tiết người dùng</h2>
                <p>ID: {{ selectedUser.id.slice(0, 8) }}...</p>
              </div>
            </div>
            <button @click="closeModal" class="close-btn">
              <i class="pi pi-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- Avatar Section -->
            <div class="profile-section">
              <div class="avatar-showcase" :style="{ backgroundColor: selectedUser.avatarColor }">
                <img v-if="selectedUser.avatarUrl" :src="selectedUser.avatarUrl" :alt="selectedUser.fullName" />
                <span v-else class="showcase-text">{{ selectedUser.initials }}</span>
                <div class="avatar-ring"></div>
              </div>
              <div class="profile-info">
                <h3 class="profile-name">{{ selectedUser.fullName }}</h3>
                <div class="profile-badges">
                  <span class="badge role" :class="selectedUser.role">
                    <i :class="getRoleIcon(selectedUser.role)"></i>
                    {{ getRoleText(selectedUser.role) }}
                  </span>
                  <span class="badge status" :class="selectedUser.status">
                    <i :class="selectedUser.status === 'active' ? 'pi pi-check-circle' : 'pi pi-ban'"></i>
                    {{ getStatusText(selectedUser.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Info Cards -->
            <div class="info-section">
              <h4 class="section-title">
                <i class="pi pi-info-circle"></i>
                Thông tin cá nhân
              </h4>
              <div class="info-cards">
                <div class="info-card">
                  <div class="info-icon email">
                    <i class="pi pi-envelope"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ selectedUser.email }}</span>
                  </div>
                </div>
                
                <div class="info-card">
                  <div class="info-icon phone">
                    <i class="pi pi-phone"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Điện thoại</span>
                    <span class="info-value">{{ selectedUser.phone || 'Chưa cập nhật' }}</span>
                  </div>
                </div>
                
                <div class="info-card">
                  <div class="info-icon gender">
                    <i class="pi pi-user"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Giới tính</span>
                    <span class="info-value">{{ formatGender(selectedUser.gender) }}</span>
                  </div>
                </div>
                
                <div class="info-card">
                  <div class="info-icon birthday">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Ngày sinh</span>
                    <span class="info-value">{{ formatDate(selectedUser.birthDate) }}</span>
                  </div>
                </div>
                
                <div class="info-card">
                  <div class="info-icon joined">
                    <i class="pi pi-clock"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Ngày tham gia</span>
                    <span class="info-value">{{ formatDate(selectedUser.createdAt) }}</span>
                  </div>
                </div>
                
                <div class="info-card">
                  <div class="info-icon updated">
                    <i class="pi pi-refresh"></i>
                  </div>
                  <div class="info-content">
                    <span class="info-label">Cập nhật lần cuối</span>
                    <span class="info-value">{{ formatDate(selectedUser.updatedAt) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="actions-section">
              <h4 class="section-title">
                <i class="pi pi-cog"></i>
                Thao tác
              </h4>
              <div class="actions-grid">
                <div class="action-group">
                  <label class="action-label">
                    <i class="pi pi-id-card"></i>
                    Phân quyền
                  </label>
                  <div class="role-selector">
                    <button 
                      v-for="role in availableRoles" 
                      :key="role.value"
                      :class="['role-btn', { active: selectedUser.role === role.value }]"
                      @click="updateRole(selectedUser.id, role.value)"
                    >
                      <i :class="role.icon"></i>
                      {{ role.label }}
                    </button>
                  </div>
                </div>
                
                <div class="action-group">
                  <label class="action-label">
                    <i class="pi pi-shield"></i>
                    Trạng thái tài khoản
                  </label>
                  <button 
                    v-if="selectedUser.status === 'active'"
                    @click="suspendUser(selectedUser.id)"
                    class="status-btn suspend"
                  >
                    <i class="pi pi-ban"></i>
                    <span>Khóa tài khoản</span>
                    <small>Tạm thời vô hiệu hóa tài khoản này</small>
                  </button>
                  <button 
                    v-else
                    @click="unlockUser(selectedUser.id)"
                    class="status-btn unlock"
                  >
                    <i class="pi pi-check-circle"></i>
                    <span>Mở khóa tài khoản</span>
                    <small>Kích hoạt lại tài khoản này</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Suspend Reason Modal -->
    <Transition name="modal">
      <div v-if="showSuspendModal" class="modal-overlay" @click.self="showSuspendModal = false">
        <div class="modal-content suspension-modal">
          <div class="modal-glow"></div>
          <div class="modal-header">
            <div class="modal-title">
              <div class="title-icon-wrapper warning">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div>
                <h2>Lý do khóa tài khoản</h2>
                <p>Vui lòng cung cấp lý do khóa tài khoản này</p>
              </div>
            </div>
            <button @click="showSuspendModal = false" class="close-btn">
              <i class="pi pi-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="input-group">
              <label class="input-label">Lý do</label>
              <textarea 
                v-model="suspendReason" 
                placeholder="Nhập lý do chi tiết tại đây..."
                rows="4"
                class="reason-textarea"
                autofocus
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showSuspendModal = false" class="secondary-button">Hủy</button>
            <button 
              @click="confirmSuspend" 
              class="primary-button suspend-confirm-btn"
              :disabled="!suspendReason.trim()"
            >
              <i class="pi pi-ban"></i>
              Xác nhận khóa
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { userRepository } from '../../repositories/UserRepository.js';

const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedUser = ref(null);

const showSuspendModal = ref(false);
const suspendReason = ref('');
const userToSuspendId = ref(null);

const availableRoles = [
  { value: 'user', label: 'Thành viên', icon: 'pi pi-user' },
  { value: 'referee', label: 'Trọng tài', icon: 'pi pi-flag' },
  { value: 'tournament_admin', label: 'Admin QL Giải đấu', icon: 'pi pi-trophy' },
  { value: 'club_admin', label: 'Admin QL Câu lạc bộ', icon: 'pi pi-shield' }
];

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.fullName?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query)
  );
});

const activeCount = computed(() => users.value.filter(u => u.status === 'active').length);
const suspendedCount = computed(() => users.value.filter(u => u.status === 'suspended' || u.status === 'banned').length);
const adminCount = computed(() => users.value.filter(u => ['admin', 'super_admin', 'tournament_admin', 'club_admin'].includes(u.role)).length);

const showUserDetail = (user) => {
  selectedUser.value = { ...user };
};

const closeModal = () => {
  selectedUser.value = null;
};

const getRoleIcon = (role) => ({
  'user': 'pi pi-user',
  'club_deputy': 'pi pi-user-minus',
  'club_leader': 'pi pi-user-plus',
  'referee': 'pi pi-flag',
  'tournament_admin': 'pi pi-trophy',
  'club_admin': 'pi pi-shield',
  'admin': 'pi pi-star',
  'super_admin': 'pi pi-crown'
}[role] || 'pi pi-user');

const getStatusClass = (s) => ({
  'active': 'bg-green-500/20 text-green-400',
  'suspended': 'bg-yellow-500/20 text-yellow-400',
  'banned': 'bg-red-500/20 text-red-400'
}[s] || 'bg-gray-500/20');

const getStatusText = (s) => ({
  'active': 'Hoạt động',
  'suspended': 'Tạm khóa',
  'banned': 'Cấm'
}[s] || s);

const getRoleText = (role) => ({
  'user': 'Thành viên',
  'club_leader': 'Trưởng CLB',
  'club_deputy': 'Phó CLB',
  'referee': 'Trọng tài',
  'tournament_admin': 'Admin QL Giải đấu',
  'club_admin': 'Admin QL Câu lạc bộ',
  'admin': 'Admin',
  'super_admin': 'Super Admin'
}[role] || role);

const getRoleClass = (role) => ({
  'user': 'bg-gray-500/20 text-gray-300',
  'club_leader': 'bg-blue-500/20 text-blue-300',
  'club_deputy': 'bg-indigo-500/20 text-indigo-300',
  'referee': 'bg-yellow-500/20 text-yellow-300',
  'tournament_admin': 'bg-orange-500/20 text-orange-300',
  'club_admin': 'bg-cyan-500/20 text-cyan-300',
  'admin': 'bg-red-500/20 text-red-300',
  'super_admin': 'bg-purple-500/20 text-purple-300'
}[role] || 'bg-gray-500/20');

const formatGender = (gender) => {
  const map = { 'male': 'Nam', 'female': 'Nữ', 'other': 'Khác' };
  return map[gender] || 'Chưa cập nhật';
};

const formatDate = (date) => {
  if (!date) return 'Chưa cập nhật';
  return new Date(date).toLocaleDateString('vi-VN');
};

const updateRole = async (id, role) => {
  const result = await userRepository.updateRole(id, role);
  if (result.isOk()) {
    // Update the selected user in modal
    if (selectedUser.value && selectedUser.value.id === id) {
      selectedUser.value.role = role;
    }
    // Reload users list to reflect changes
    await loadUsers();
    // Show success feedback on button (optional)
    console.log(`[UsersView] Role updated successfully: ${id} → ${role}`);
  } else {
    const errMsg = result.getError();
    console.error('[UsersView] updateRole failed:', errMsg);
    alert('Cập nhật vai trò thất bại!\n\n' + errMsg + '\n\nKiểm tra Console (F12) để biết thêm chi tiết.');
  }
};

const suspendUser = (id) => {
  userToSuspendId.value = id;
  suspendReason.value = '';
  showSuspendModal.value = true;
};

const confirmSuspend = async () => {
  if (!suspendReason.value.trim()) {
    return;
  }
  
  await userRepository.updateStatus(userToSuspendId.value, 'suspended', suspendReason.value);
  showSuspendModal.value = false;
  loadUsers();
  
  // Close the detail modal if it's open for this user
  if (selectedUser.value && selectedUser.value.id === userToSuspendId.value) {
    selectedUser.value.status = 'suspended';
  }
};

const unlockUser = async (id) => {
  await userRepository.updateStatus(id, 'active');
  loadUsers();
};

const loadUsers = async () => {
  loading.value = true;
  const result = await userRepository.findAll();
  if (result.isOk()) {
    users.value = result.getValue();
  }
  loading.value = false;
};

onMounted(loadUsers);
</script>

<style scoped>
/* Page Header */
.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.title-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

/* Search Box */
.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.875rem 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  color: white;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.stat-card.total .stat-icon { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.stat-card.active .stat-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
.stat-card.suspended .stat-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
.stat-card.roles .stat-icon { background: linear-gradient(135deg, #f59e0b, #ea580c); }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Loading Skeleton */
.loading-container {
  padding: 1rem 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.skeleton-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.skeleton-line.short { width: 60%; }
.skeleton-line.half { width: 40%; }

/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.user-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  overflow: hidden;
  cursor: pointer;
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
  transition: all 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 20px 60px rgba(99, 102, 241, 0.2);
}

.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card:hover .card-glow {
  opacity: 1;
}

.card-content {
  position: relative;
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  transition: transform 0.3s ease;
}

.user-card:hover .avatar {
  transform: scale(1.1);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #1e1b4b;
}

.status-dot.active { background: #22c55e; box-shadow: 0 0 10px #22c55e; }
.status-dot.suspended { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
.status-dot.banned { background: #ef4444; box-shadow: 0 0 10px #ef4444; }

.card-body {
  margin-bottom: 1rem;
}

.user-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tag.role {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.tag.role.club_leader { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.tag.role.club_deputy { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
.tag.role.referee { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.tag.role.tournament_admin { background: rgba(249, 115, 22, 0.2); color: #fdba74; }
.tag.role.club_admin { background: rgba(6, 182, 212, 0.2); color: #67e8f9; }
.tag.role.admin { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.tag.role.super_admin { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }

.tag.status {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.tag.status.suspended { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.tag.status.banned { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.join-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.view-btn {
  padding: 0.5rem 1rem;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: rgba(99, 102, 241, 0.4);
  color: white;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state h3 {
  font-size: 1.25rem;
  color: white;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Suspension Modal Specifics */
.suspension-modal {
  max-width: 500px !important;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.title-icon-wrapper.warning {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.input-group {
  margin-top: 1rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.75rem;
}

.reason-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: white;
  padding: 1rem;
  font-size: 0.875rem;
  resize: none;
  transition: all 0.3s ease;
}

.reason-textarea:focus {
  outline: none;
  border-color: #ef4444;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.secondary-button {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.primary-button.suspend-confirm-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.primary-button.suspend-confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.primary-button.suspend-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  transform-origin: center;
  transition: transform 0.3s ease;
}

.modal-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.2), transparent 60%);
  pointer-events: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-icon-wrapper {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.modal-title h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.modal-title p {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  font-family: monospace;
}

.close-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
  position: relative;
}

/* Profile Section */
.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
}

.avatar-showcase {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  position: relative;
  margin-bottom: 1rem;
}

.avatar-showcase img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border: 3px solid transparent;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 3s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.75rem;
}

.profile-badges {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge.role {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.badge.role.club_leader { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.badge.role.club_deputy { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
.badge.role.referee { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.badge.role.admin { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.badge.role.super_admin { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }

.badge.status {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.badge.status.suspended { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.badge.status.banned { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

/* Info Section */
.info-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.info-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.info-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateX(4px);
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.info-icon.email { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.info-icon.phone { background: rgba(34, 197, 94, 0.2); color: #86efac; }
.info-icon.gender { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }
.info-icon.birthday { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.info-icon.joined { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
.info-icon.updated { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; }

.info-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.info-content .info-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.125rem;
}

.info-content .info-value {
  font-size: 0.875rem;
  color: white;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Actions Section */
.actions-section {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.role-btn {
  padding: 0.75rem 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
}

.role-btn i {
  font-size: 1.125rem;
}

.role-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
  color: white;
}

.role-btn.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  color: #a5b4fc;
}

.status-btn {
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
}

.status-btn i {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.status-btn span {
  font-size: 0.875rem;
  font-weight: 600;
}

.status-btn small {
  font-size: 0.75rem;
  opacity: 0.7;
}

.status-btn.suspend {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.status-btn.suspend:hover {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.status-btn.unlock {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.status-btn.unlock:hover {
  background: rgba(34, 197, 94, 0.2);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .info-cards {
    grid-template-columns: 1fr;
  }
  
  .role-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .role-selector {
    grid-template-columns: 1fr;
  }
}
</style>
