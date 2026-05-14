<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">
      <!-- Hero -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-map"></i></div>
          <div>
            <h1 class="hero-title">Quản lý Sân đấu</h1>
            <p class="hero-subtitle">Tạo và quản lý thông tin các sân thi đấu</p>
          </div>
        </div>
        <div class="controls-row">
          <label class="toggle-hidden">
            <input v-model="showHidden" type="checkbox" />
            <span>Hiển thị sân bị ẩn</span>
          </label>
          <button @click="openCreateModal" class="btn-create">
            <i class="pi pi-plus"></i> Thêm sân đấu mới
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl" style="color: rgba(255,255,255,0.3)"></i>
      </div>

      <!-- Empty State -->
      <div v-else-if="venues.length === 0" class="empty-state">
        <div class="empty-icon"><i class="pi pi-map-marker"></i></div>
        <h3>Chưa có sân đấu nào</h3>
        <p>Hãy thêm sân đấu đầu tiên để lên lịch các trận đấu</p>
        <button @click="openCreateModal" class="btn-create mx-auto mt-4">
          <i class="pi pi-plus"></i> Thêm sân đấu
        </button>
      </div>

      <!-- Venue Grid -->
      <div v-if="filteredVenues.length > 0" class="venues-grid">
        <div v-for="(venue, i) in filteredVenues" :key="venue.id" class="venue-card" :style="{ animationDelay: `${i * 0.05}s` }" :class="{ 'is-hidden': venue.status === 'hidden' }">
          <div class="card-glow"></div>
          
          <div class="card-actions">
            <button @click="openEditModal(venue)" class="action-btn edit-btn" title="Sửa"><i class="pi pi-pencil"></i></button>
            <button v-if="venue.status === 'active'" @click="hideVenue(venue)" class="action-btn hide-btn" title="Ẩn"><i class="pi pi-eye-slash"></i></button>
            <button v-else @click="restoreVenue(venue)" class="action-btn restore-btn" title="Khôi phục"><i class="pi pi-eye"></i></button>
          </div>

          <div class="venue-header">
            <div class="venue-icon">
              <i class="pi pi-map-marker"></i>
            </div>
            <span v-if="venue.status === 'hidden'" class="status-badge status-hidden">
              <i class="pi pi-eye-slash"></i> Đã ẩn
            </span>
          </div>
          
          <div class="venue-body">
            <h3 class="venue-name">{{ venue.name }}</h3>
            <div class="venue-sport" v-if="venue.sportCategoryId">
              <span class="sport-tag"><i class="pi pi-tag"></i> {{ getSportName(venue.sportCategoryId) }}</span>
            </div>
            
            <div class="venue-details">
              <div class="detail-row">
                <i class="pi pi-compass"></i>
                <span class="truncate-2">{{ venue.address || 'Chưa cập nhật địa chỉ' }}</span>
              </div>
              <div class="detail-row" v-if="venue.contactPhone">
                <i class="pi pi-phone"></i>
                <span>SĐT: {{ venue.contactPhone }}</span>
              </div>
              <div class="detail-row" v-if="venue.capacity">
                <i class="pi pi-users"></i>
                <span>Sức chứa: {{ venue.capacity }} người</span>
              </div>
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
      result = await venueRepository.update({ id: editingVenue.value.id, ...venueData });
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
.page-wrapper { min-height: 100vh; padding: 1.5rem 1.5rem 3rem; }

/* Hero */
.page-hero {
  position: relative; margin-bottom: 2.5rem;
  padding: 2rem 2rem 1.5rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem; overflow: hidden;
  display: flex; flex-direction: column; gap: 1.5rem;
}
.hero-glow {
  position: absolute; top: -60px; left: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 1rem; }
.hero-icon {
  width: 56px; height: 56px; border-radius: 1rem; flex-shrink: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: white;
  box-shadow: 0 8px 24px rgba(59,130,246,0.4);
}
.hero-title { font-size: 2rem; font-weight: 800; color: white; line-height: 1.1; margin: 0; }
.hero-subtitle { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-top: 0.25rem; }

.controls-row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; }
@media(min-width: 768px) { .controls-row { justify-content: flex-end; } }

.toggle-hidden {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem;
  color: white; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
}
.toggle-hidden:hover { background: rgba(255,255,255,0.1); }
.toggle-hidden input { cursor: pointer; }

.btn-create {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white; font-size: 0.875rem; font-weight: 600;
  border-radius: 0.875rem; transition: all 0.25s; border: none; cursor: pointer;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
}
.btn-create:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.45); }

/* Empty */
.empty-state { text-align: center; padding: 5rem 1rem; }
.empty-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem; font-size: 2rem; color: rgba(59,130,246,0.5);
}
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
.empty-state p { font-size: 0.875rem; color: rgba(255,255,255,0.4); margin-bottom: 1rem; }

/* Grid */
.venues-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }

/* Card */
.venue-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0; animation: fadeUp 0.5s ease forwards;
  display: flex; flex-direction: column;
}
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.venue-card:hover { transform: translateY(-6px); border-color: rgba(59,130,246,0.3); box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.1); }
.venue-card.is-hidden { opacity: 0.6; }

.card-glow {
  position: absolute; inset: 0; opacity: 0; pointer-events: none;
  background: radial-gradient(circle at 50% 0%, rgba(59,130,246,0.12), transparent 65%);
  transition: opacity 0.3s;
}
.venue-card:hover .card-glow { opacity: 1; }

.card-actions {
  position: absolute; top: 1.25rem; right: 1.25rem;
  display: flex; gap: 0.5rem; opacity: 0; transition: opacity 0.2s; z-index: 10;
}
.venue-card:hover .card-actions { opacity: 1; }
.action-btn {
  width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; color: white;
}
.edit-btn { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.15); }
.edit-btn:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); }
.hide-btn { background: rgba(245,158,11,0.15); color: #fcd34d; border-color: rgba(245,158,11,0.25); }
.hide-btn:hover { background: rgba(245,158,11,0.25); border-color: rgba(245,158,11,0.4); }
.restore-btn { background: rgba(34,197,94,0.15); color: #86efac; border-color: rgba(34,197,94,0.25); }
.restore-btn:hover { background: rgba(34,197,94,0.25); border-color: rgba(34,197,94,0.4); }

.venue-header { padding: 1.25rem 1.25rem 0; display: flex; align-items: flex-start; justify-content: space-between; }
.venue-icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: rgba(59,130,246,0.15); color: #60a5fa;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  border: 1px solid rgba(59,130,246,0.25);
}

.venue-body { padding: 1.25rem; display: flex; flex-direction: column; flex: 1; }
.venue-name { font-size: 1.15rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }

.venue-sport { margin-bottom: 1rem; }
.sport-tag {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.25rem 0.6rem; background: rgba(59,130,246,0.1);
  border: 1px solid rgba(59,130,246,0.2); border-radius: 999px;
  color: #93c5fd; font-size: 0.75rem; font-weight: 600;
}

.venue-details { display: flex; flex-direction: column; gap: 0.6rem; margin-top: auto; }
.detail-row {
  display: flex; align-items: flex-start; gap: 0.6rem;
  font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.4;
}
.detail-row i { margin-top: 0.15rem; color: rgba(255,255,255,0.4); }
.truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Modal styles preserved from before */
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

.modal-title { font-size: 1.25rem; font-weight: 800; color: white; letter-spacing: -0.025em; margin: 0; }

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

.field select option { background-color: #1e1b4b; color: white; }

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
  display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
  height: 34px; padding: 0 0.75rem; box-sizing: border-box;
  border-radius: 999px; font-size: 0.75rem; font-weight: 700;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.venue-card:hover .status-badge {
  transform: translateX(-85px);
}

.status-hidden { 
  background: rgba(107,114,128,0.2); 
  color: #d1d5db; 
  border: 1px solid rgba(107,114,128,0.3); 
}

@media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }
</style>
