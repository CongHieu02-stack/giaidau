<template>
  <div class="venues-view py-8 px-4">
    <div class="container mx-auto max-w-6xl">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Quản lý Sân đấu</h1>
          <p class="text-white/60">Tạo và quản lý thông tin các sân thi đấu</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          <i class="pi pi-plus mr-2"></i> Thêm sân đấu mới
        </button>
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
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="venue in venues" :key="venue.id" class="venue-card bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-all">
          <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button @click="openEditModal(venue)" class="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Sửa">
              <i class="pi pi-pencil"></i>
            </button>
            <button @click="deleteVenue(venue)" class="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors" title="Xóa">
              <i class="pi pi-trash"></i>
            </button>
          </div>
          
          <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">
            <i class="pi pi-map-marker text-xl"></i>
          </div>
          
          <h3 class="text-xl font-bold text-white mb-2">{{ venue.name }}</h3>
          
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
            <div class="mt-2 text-xs bg-white/5 p-2 rounded-lg border border-white/5" v-if="venue.facilities">
              <div class="font-medium text-white/50 mb-1">Cơ sở vật chất:</div>
              <p class="line-clamp-2">{{ venue.facilities }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal (Teleported to body to avoid layout issues) -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
          <div class="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
            <h3 class="text-xl font-bold text-white">{{ editingVenue ? 'Cập nhật sân đấu' : 'Thêm sân đấu mới' }}</h3>
            <button @click="closeModal" class="text-white/60 hover:text-white transition-colors">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>
          
          <div class="overflow-y-auto flex-1 custom-scrollbar">
            <form @submit.prevent="saveVenue" class="p-6 space-y-4">
              <div class="form-group">
                <label class="block text-sm font-medium text-white/80 mb-1">Tên sân đấu <span class="text-red-400">*</span></label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  required
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="VD: Sân vận động Mỹ Đình"
                />
              </div>
              
              <div class="form-group">
                <label class="block text-sm font-medium text-white/80 mb-1">Địa chỉ</label>
                <textarea 
                  v-model="formData.address" 
                  rows="3"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="Nhập địa chỉ chi tiết"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="block text-sm font-medium text-white/80 mb-1">Số điện thoại liên hệ</label>
                <input 
                  v-model="formData.contactPhone" 
                  type="text" 
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="VD: 0912345678"
                />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="block text-sm font-medium text-white/80 mb-1">Sức chứa (người)</label>
                  <input 
                    v-model.number="formData.capacity" 
                    type="number" 
                    min="0"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="VD: 40000"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="block text-sm font-medium text-white/80 mb-1">Cơ sở vật chất</label>
                <textarea 
                  v-model="formData.facilities" 
                  rows="2"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="VD: Wifi, Đèn chiếu sáng, Căng tin..."
                ></textarea>
              </div>
              
              <div class="pt-4 flex gap-3">
                <button type="button" @click="closeModal" class="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors">
                  Hủy
                </button>
                <button type="submit" :disabled="saving" class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                  <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
                  {{ saving ? 'Đang lưu...' : 'Lưu lại' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { venueRepository } from '../../repositories/VenueRepository.js';

const venues = ref([]);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const editingVenue = ref(null);

const formData = reactive({
  name: '',
  address: '',
  capacity: null,
  facilities: '',
  contactPhone: ''
});

const loadVenues = async () => {
  loading.value = true;
  try {
    const result = await venueRepository.findAll();
    if (result.isOk()) {
      venues.value = result.getValue();
    } else {
      console.error('Failed to load venues:', result.getError());
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
  formData.facilities = '';
  formData.contactPhone = '';
  showModal.value = true;
};

const openEditModal = (venue) => {
  editingVenue.value = venue;
  formData.name = venue.name;
  formData.address = venue.address;
  formData.capacity = venue.capacity;
  formData.facilities = venue.facilities;
  formData.contactPhone = venue.contactPhone;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveVenue = async () => {
  saving.value = true;
  try {
    const venueData = {
      name: formData.name,
      address: formData.address,
      capacity: formData.capacity || 0,
      facilities: formData.facilities,
      contact_phone: formData.contactPhone
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
      alert('Có lỗi xảy ra: ' + result.getError());
    }
  } catch (error) {
    console.error('Error saving venue:', error);
    alert('Có lỗi xảy ra khi lưu sân đấu');
  } finally {
    saving.value = false;
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
