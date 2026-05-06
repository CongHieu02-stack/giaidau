<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Câu lạc bộ</h1>
          <p class="text-white/60">Danh sách các câu lạc bộ đã đăng ký</p>
        </div>
        <div class="flex gap-3">
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm câu lạc bộ..."
              class="search-input"
            />
          </div>
          <button v-if="authStore.isAuthenticated" @click="showCreateModal = true" class="btn-primary">
            <i class="pi pi-plus mr-2"></i>
            Tạo CLB
          </button>
        </div>
      </div>

      <!-- Club Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="club in filteredClubs" :key="club.id" class="club-card">
          <div class="club-header">
            <div class="club-logo">
              <img v-if="club.logo_url" :src="club.logo_url" :alt="club.name" />
              <div v-else class="logo-placeholder">{{ getInitials(club.name) }}</div>
            </div>
            <div class="status-badge" :class="getStatusClass(club.status)">
              {{ getStatusText(club.status) }}
            </div>
          </div>
          
          <div class="club-content">
            <h3 class="club-name">{{ club.name }}</h3>
            <p class="club-description">{{ club.description || 'Chưa có mô tả' }}</p>
            
            <div class="club-stats">
              <div class="stat">
                <i class="pi pi-users"></i>
                <span>{{ club.member_count || 0 }} thành viên</span>
              </div>
              <div class="stat">
                <i class="pi pi-trophy"></i>
                <span>{{ club.tournament_count || 0 }} giải đấu</span>
              </div>
            </div>
          </div>

          <div class="club-footer">
            <router-link :to="`/clubs/${club.id}`" class="btn-view">
              Xem chi tiết
              <i class="pi pi-arrow-right ml-2"></i>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredClubs.length === 0" class="text-center py-16">
        <i class="pi pi-users text-6xl text-white/20 mb-4"></i>
        <p class="text-white/60">Không tìm thấy câu lạc bộ nào</p>
      </div>
    </div>

    <!-- Create Club Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-panel">
        <div class="modal-header">
          <h2 class="modal-title">Tạo câu lạc bộ mới</h2>
          <button @click="showCreateModal = false" class="modal-close">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <form @submit.prevent="handleCreate">
          <div class="form-grid">
            <label class="field field-wide">
              <span>Tên CLB <span class="required">*</span></span>
              <input v-model.trim="createForm.name" type="text" placeholder="Nhập tên câu lạc bộ" required>
            </label>

            <label class="field">
              <span>Tên viết tắt</span>
              <input v-model.trim="createForm.short_name" type="text" placeholder="VD: MU, RM, BAR">
            </label>

            <label class="field">
              <span>Logo URL</span>
              <input v-model.trim="createForm.logo_url" type="url" placeholder="https://example.com/logo.png">
            </label>

            <label class="field field-wide">
              <span>Mô tả</span>
              <textarea v-model.trim="createForm.description" rows="3" placeholder="Giới thiệu về câu lạc bộ..."></textarea>
            </label>
          </div>

          <div v-if="createError" class="form-error">{{ createError }}</div>

          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn-secondary" :disabled="creating">
              Hủy
            </button>
            <button type="submit" class="btn-primary" :disabled="creating">
              <i v-if="creating" class="pi pi-spinner pi-spin mr-2"></i>
              <i v-else class="pi pi-check mr-2"></i>
              {{ creating ? 'Đang tạo...' : 'Tạo CLB' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { clubRepository } from '../../repositories/ClubRepository.js';
import { supabase } from '../../config/supabase.js';

const authStore = useAuthStore();
const clubs = ref([]);
const searchQuery = ref('');
const loading = ref(false);

const filteredClubs = computed(() => {
  if (!searchQuery.value) return clubs.value;
  const query = searchQuery.value.toLowerCase();
  return clubs.value.filter(club => 
    club.name.toLowerCase().includes(query) ||
    (club.description && club.description.toLowerCase().includes(query))
  );
});

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getStatusClass = (status) => {
  const classes = {
    'pending': 'status-pending',
    'approved': 'status-approved',
    'rejected': 'status-rejected',
    'suspended': 'status-suspended',
    'dissolved': 'status-dissolved'
  };
  return classes[status] || 'status-pending';
};

const getStatusText = (status) => {
  const texts = {
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'rejected': 'Từ chối',
    'suspended': 'Tạm khóa',
    'dissolved': 'Giải thể'
  };
  return texts[status] || 'Không xác định';
};

const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref('');
const createForm = ref({
  name: '',
  short_name: '',
  description: '',
  logo_url: ''
});

const resetCreateForm = () => {
  createForm.value = { name: '', short_name: '', description: '', logo_url: '' };
  createError.value = '';
};

const handleCreate = async () => {
  if (!createForm.value.name.trim()) {
    createError.value = 'Vui lòng nhập tên câu lạc bộ';
    return;
  }

  creating.value = true;
  createError.value = '';

  try {
    const now = new Date().toISOString();
    const payload = {
      name: createForm.value.name.trim(),
      short_name: createForm.value.short_name.trim() || null,
      description: createForm.value.description.trim() || null,
      logo_url: createForm.value.logo_url.trim() || null,
      leader_id: authStore.user?.id || null,
      status: 'pending',
      member_count: 0,
      tournament_count: 0,
      created_at: now,
      updated_at: now
    };

    console.log('[ClubsView] Insert payload:', payload);

    const { data, error } = await supabase
      .from('clubs')
      .insert(payload)
      .select()
      .single();

    console.log('[ClubsView] Insert response:', { data, error });

    if (error) {
      console.error('[ClubsView] Supabase error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Không nhận được dữ liệu sau khi tạo. Có thể do chính sách bảo mật (RLS) chặn thao tác này.');
    }

    clubs.value.unshift(data);
    showCreateModal.value = false;
    resetCreateForm();
  } catch (err) {
    console.error('[ClubsView] Create club failed:', err);
    createError.value = err.message || err?.error_description || 'Tạo câu lạc bộ thất bại';
  } finally {
    creating.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const result = await clubRepository.findByStatus('approved');
    if (result.isOk()) {
      clubs.value = result.getValue();
    }
  } catch (error) {
    console.error('Failed to load clubs:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.search-input {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
  min-width: 300px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.club-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.club-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.club-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.club-logo {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.club-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #dcfce7;
  color: #166534;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-suspended {
  background: #f3f4f6;
  color: #374151;
}

.status-dissolved {
  background: #f3f4f6;
  color: #6b7280;
}

.club-content {
  padding: 0 1.5rem 1rem;
}

.club-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.club-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.club-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.stat i {
  color: #3b82f6;
}

.club-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-view:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(6px);
  padding: 1rem;
}

.modal-panel {
  width: min(560px, 100%);
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.45);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 20px 22px;
}

.field {
  display: grid;
  gap: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  font-weight: 600;
}

.field-wide {
  grid-column: 1 / -1;
}

.field input,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(203, 213, 225, 0.25);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
  color: #ffffff;
  font: inherit;
}

.field input:focus,
.field textarea:focus {
  outline: 2px solid rgba(96, 165, 250, 0.45);
  border-color: #60a5fa;
}

.required {
  color: #f87171;
}

.form-error {
  margin: 0 22px 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.18);
  color: #fecaca;
  font-weight: 600;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px 18px;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.1rem;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-weight: 600;
  border-radius: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 520px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
