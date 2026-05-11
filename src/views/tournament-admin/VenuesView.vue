<template>
  <div class="venues-view py-8 px-4">
    <div class="container mx-auto max-w-6xl">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Quản lý Sân đấu</h1>
          <p class="text-white/60">Tạo và quản lý thông tin các sân thi đấu</p>
        </div>
        <div class="flex gap-3 items-center">
          <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <input v-model="showHidden" type="checkbox" class="w-4 h-4" />
            <span class="text-sm text-white">Hiển thị sân bị ẩn</span>
          </label>
          <button @click="openCreateModal" class="btn-primary">
            <i class="pi pi-plus mr-2"></i> Thêm sân đấu mới
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>

      <!-- Empty State -->
      <div v-else-if="venues.length === 0" class="empty-state text-center py-16 bg-white/5 rounded-2xl border border-white/10">
        <i class="pi pi-map-marker text-6xl text-white/20 mb-4"></i>
        <h3 class="text-xl font-semibold text-white mb-2">Chưa có sân đấu nào</h3>
        <p class="text-white/60 mb-6">Hãy thêm sân đấu đầu tiên để lên lịch các trận đấu</p>
        <button @click="openCreateModal" class="btn-primary inline-flex">
          <i class="pi pi-plus mr-2"></i> Thêm sân đấu
        </button>
      </div>

      <!-- Venue Grid -->
      <div v-if="filteredVenues.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="venue in filteredVenues" :key="venue.id" class="venue-card bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-all" :class="{ 'opacity-60': venue.status === 'hidden' }">
          <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button @click="openEditModal(venue)" class="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Sửa">
              <i class="pi pi-pencil"></i>
            </button>
            <button v-if="venue.status === 'active'" @click="hideVenue(venue)" class="p-2 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-lg text-yellow-400 transition-colors" title="Ẩn">
              <i class="pi pi-eye-slash"></i>
            </button>
            <button v-else @click="restoreVenue(venue)" class="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-lg text-green-400 transition-colors" title="Khôi phục">
              <i class="pi pi-eye"></i>
            </button>
          </div>
          
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <i class="pi pi-map-marker text-xl"></i>
            </div>
            <span v-if="venue.status === 'hidden'" class="status-badge status-hidden">
              <i class="pi pi-eye-slash"></i> Đã ẩn
            </span>
          </div>
          
          <h3 class="text-xl font-bold text-white mb-2">{{ venue.name }}</h3>
          
          <div v-if="venue.sportCategoryId" class="mb-4">
            <span class="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
              <i class="pi pi-tag mr-1"></i> {{ getSportName(venue.sportCategoryId) }}
            </span>
          </div>
          
          <div class="space-y-2 text-sm text-white/70">
            <div class="flex items-start gap-2">
              <i class="pi pi-compass mt-1 opacity-70"></i>
              <span class="line-clamp-2">{{ venue.address || 'Chưa cập nhật địa chỉ' }}</span>
            </div>
            <div class="flex items-center gap-2" v-if="venue.contactPhone">
              <i class="pi pi-phone opacity-70"></i>
              <span>SĐT: {{ venue.contactPhone }}</span>
            </div>
            <div class="flex items-center gap-2" v-if="venue.capacity">
              <i class="pi pi-users opacity-70"></i>
              <span>Sức chứa: {{ venue.capacity }} người</span>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon"><i class="pi pi-plus"></i></div>
            <h2 class="modal-title">{{ editingVenue ? 'Cập nhật sân đấu' : 'Thêm sân đấu mới' }}</h2>
          </div>
          <button @click="closeModal" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <form @submit.prevent="saveVenue" class="modal-body">
          <div class="form-grid">
            <label class="field field-wide">
              <span>Tên sân đấu <span class="req">*</span></span>
              <input v-model.trim="formData.name" type="text" placeholder="VD: Sân vận động Mỹ Đình" required />
            </label>
            <label class="field field-wide">
              <span>Địa chỉ <span class="req">*</span></span>
              <textarea v-model.trim="formData.address" rows="3" placeholder="Nhập địa chỉ chi tiết" required></textarea>
            </label>
            <label class="field field-wide">
              <span>Bộ môn <span class="req">*</span></span>
              <select v-model="formData.sportCategoryId" required>
                <option value="">Chọn bộ môn</option>
                <option v-for="sport in sports" :key="sport.id" :value="sport.id">
                  {{ sport.name }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>Số điện thoại liên hệ <span class="req">*</span></span>
              <input v-model.trim="formData.contactPhone" type="text" placeholder="VD: 0912345678" required />
            </label>
            <label class="field">
              <span>Sức chứa (người) <span class="req">*</span></span>
              <input v-model.number="formData.capacity" type="number" min="0" placeholder="VD: 40000" required />
            </label>
          </div>
          <div v-if="formError" class="form-error"><i class="pi pi-exclamation-circle"></i> {{ formError }}</div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel" :disabled="saving">Hủy</button>
            <button type="submit" class="btn-submit" :disabled="saving || !isFormValid">
              <i :class="saving ? 'pi pi-spinner pi-spin' : 'pi pi-check'"></i>
              {{ saving ? 'Đang lưu...' : 'Lưu lại' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { supabase } from '../../config/supabase.js';
import { venueRepository } from '../../repositories/VenueRepository.js';

const venues = ref([]);
const sports = ref([]);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const editingVenue = ref(null);
const formError = ref('');
const showHidden = ref(false);

const formData = reactive({
  name: '',
  address: '',
  capacity: null,
  contactPhone: '',
  sportCategoryId: ''
});

const isFormValid = computed(() => {
  return (
    formData.name.trim().length > 0 &&
    formData.address.trim().length > 0 &&
    formData.contactPhone.trim().length > 0 &&
    formData.sportCategoryId !== '' &&
    formData.capacity !== null && formData.capacity >= 0
  );
});

const getSportName = (id) => {
  const sport = sports.value.find(s => s.id === id);
  return sport ? sport.name : 'Chưa xác định';
};

const filteredVenues = computed(() => {
  if (showHidden.value) {
    return venues.value;
  }
  return venues.value.filter(v => v.status !== 'hidden');
});

const loadVenues = async () => {
  loading.value = true;
  try {
    const [venueResult, sportResult] = await Promise.all([
      venueRepository.findAll(),
      supabase.from('sports_categories').select('id, name').order('name')
    ]);

    if (venueResult.isOk()) {
      venues.value = venueResult.getValue();
    }
    
    if (!sportResult.error) {
      sports.value = sportResult.data;
    }
  } catch (error) {
    console.error('Error loading venues:', error);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingVenue.value = null;
  formData.name = '';
  formData.address = '';
  formData.capacity = null;
  formData.contactPhone = '';
  formData.sportCategoryId = '';
  formError.value = '';
  showModal.value = true;
};

const openEditModal = (venue) => {
  editingVenue.value = venue;
  formData.name = venue.name;
  formData.address = venue.address;
  formData.capacity = venue.capacity;
  formData.contactPhone = venue.contactPhone;
  formData.sportCategoryId = venue.sportCategoryId || '';
  formError.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveVenue = async () => {
  formError.value = '';
  
  // Validate form
  if (!formData.name.trim()) {
    formError.value = 'Vui lòng nhập tên sân đấu';
    return;
  }
  if (!formData.address.trim()) {
    formError.value = 'Vui lòng nhập địa chỉ';
    return;
  }
  if (!formData.contactPhone.trim()) {
    formError.value = 'Vui lòng nhập số điện thoại liên hệ';
    return;
  }
  if (!formData.sportCategoryId) {
    formError.value = 'Vui lòng chọn bộ môn';
    return;
  }
  if (formData.capacity === null || formData.capacity < 0) {
    formError.value = 'Vui lòng nhập sức chứa hợp lệ';
    return;
  }
  
  saving.value = true;
  try {
    const venueData = {
      name: formData.name,
      address: formData.address,
      capacity: formData.capacity || 0,
      contact_phone: formData.contactPhone,
      sport_category_id: formData.sportCategoryId
    };

    let result;
    if (editingVenue.value) {
      result = await venueRepository.update(editingVenue.value.id, venueData);
    } else {
      result = await venueRepository.create(venueData);
    }

    if (result.isOk()) {
      await loadVenues();
      closeModal();
      // Optional: Add toast notification
    } else {
      console.error('Failed to save venue:', result.getError());
      formError.value = 'Có lỗi xảy ra: ' + result.getError();
    }
  } catch (error) {
    console.error('Error saving venue:', error);
    alert('Có lỗi xảy ra khi lưu sân đấu');
  } finally {
    saving.value = false;
  }
};

const hideVenue = async (venue) => {
  if (confirm(`Bạn có chắc chắn muốn ẩn sân đấu "${venue.name}"?`)) {
    try {
      const result = await venueRepository.softDelete(venue.id);
      if (result.isOk()) {
        await loadVenues();
      } else {
        console.error('Failed to hide venue:', result.getError());
        alert('Có lỗi xảy ra khi ẩn sân đấu: ' + result.getError());
      }
    } catch (error) {
      console.error('Error hiding venue:', error);
    }
  }
};

const restoreVenue = async (venue) => {
  if (confirm(`Bạn có chắc chắn muốn khôi phục sân đấu "${venue.name}"?`)) {
    try {
      const result = await venueRepository.restore(venue.id);
      if (result.isOk()) {
        await loadVenues();
      } else {
        console.error('Failed to restore venue:', result.getError());
        alert('Có lỗi xảy ra khi khôi phục sân đấu: ' + result.getError());
      }
    } catch (error) {
      console.error('Error restoring venue:', error);
    }
  }
};

const deleteVenue = async (venue) => {
  if (confirm(`Bạn có chắc chắn muốn xóa sân đấu "${venue.name}"? Hành động này không thể hoàn tác.`)) {
    try {
      const result = await venueRepository.delete(venue.id);
      if (result.isOk()) {
        await loadVenues();
      } else {
        console.error('Failed to delete venue:', result.getError());
        alert('Có lỗi xảy ra khi xóa sân đấu: ' + result.getError());
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
    }
  }
};

onMounted(() => {
  loadVenues();
});
</script>

<style scoped>
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* Modal */
.modal-overlay { 
  position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; 
  background: rgba(2,6,23,0.8); backdrop-filter: blur(8px); padding: 1rem; 
}

.modal-panel { 
  width: min(620px, 100%); 
  background: rgba(15, 12, 45, 0.95); 
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12); 
  border-radius: 1.5rem; 
  overflow: hidden; 
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(99, 102, 241, 0.15); 
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
}

@keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(-12px)} to{opacity:1;transform:scale(1) translateY(0)} }

.modal-header { 
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.5rem 2rem; 
  border-bottom: 1px solid rgba(255, 255, 255, 0.08); 
  background: linear-gradient(to right, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04)); 
}

.modal-title-wrap { display: flex; align-items: center; gap: 0.75rem; }

.modal-icon { 
  width: 36px; height: 36px; border-radius: 9px; 
  background: linear-gradient(135deg,#6366f1,#8b5cf6); 
  display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: white; 
}

.modal-title { font-size: 1.25rem; font-weight: 800; color: white; letter-spacing: -0.025em; }

.modal-close { 
  width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,0.07); 
  border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); 
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; 
}

.modal-close:hover { background: rgba(255,255,255,0.14); color: white; }

.modal-body { padding: 2rem; }

.form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 1rem; }

.field { display: flex; flex-direction: column; gap: 0.4rem; color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; }

.field-wide { grid-column: 1 / -1; }

.field input, .field textarea, .field select { 
  padding: 0.8rem 1rem; 
  background: rgba(255, 255, 255, 0.04); 
  border: 1px solid rgba(255, 255, 255, 0.12); 
  border-radius: 0.75rem; 
  color: white; 
  font: inherit; 
  transition: all 0.25s ease; 
  resize: vertical; 
}

.field select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}

.field select option {
  background-color: #1e1b4b;
  color: white;
}

.field input:focus, .field textarea:focus, .field select:focus { 
  outline: none; 
  border-color: rgba(99, 102, 241, 0.6); 
  background: rgba(255, 255, 255, 0.07); 
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15); 
}

.field input::placeholder, .field textarea::placeholder { color: rgba(255,255,255,0.25); }

.req { color: #f87171; }

.form-error { 
  display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 0.875rem; 
  background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); 
  border-radius: 0.625rem; color: #fca5a5; font-size: 0.85rem; margin-bottom: 1rem; 
}

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }

.btn-cancel { 
  padding: 0.65rem 1.25rem; background: rgba(255,255,255,0.07); 
  border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); 
  border-radius: 0.625rem; font-weight: 600; cursor: pointer; transition: all 0.2s; 
  font-size: 0.875rem; 
}

.btn-cancel:hover { background: rgba(255,255,255,0.12); }

.btn-submit { 
  display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.5rem; 
  background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; 
  border-radius: 0.625rem; font-weight: 600; cursor: pointer; transition: all 0.25s; 
  font-size: 0.875rem; box-shadow: 0 4px 16px rgba(99,102,241,0.3); 
}

.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }

.btn-cancel:disabled, .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.status-badge {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.65rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700;
}

.status-hidden { 
  background: rgba(107,114,128,0.2); 
  color: #d1d5db; 
  border: 1px solid rgba(107,114,128,0.3); 
}

@media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
