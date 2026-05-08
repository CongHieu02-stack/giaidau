<template>
  <div class="sports-page">
    <div class="sports-container">
      <div class="sports-header">
        <h1 class="sports-title">Danh mục bộ môn</h1>
        <button @click="openAddModal" class="btn-primary">
          <i class="pi pi-plus" style="margin-right: 0.5rem;"></i>
          Thêm bộ môn
        </button>
      </div>
      
      <div class="sports-grid">
        <div v-for="sport in sports" :key="sport.id" class="sport-card">
          <div class="sport-icon">{{ sport.icon_url || '🏆' }}</div>
          <div class="sport-card-header">
            <h3 class="sport-name">{{ sport.name }}</h3>
            <span v-if="sport.type" class="sport-badge">
              {{ formatType(sport.type) }}
            </span>
          </div>
          <p class="sport-desc">{{ sport.description || 'Chưa có mô tả' }}</p>
          <div class="sport-actions">
            <button @click="editSport(sport)" class="btn-action">
              <i class="pi pi-pencil"></i>
            </button>
            <button @click="deleteSport(sport.id)" class="btn-action btn-danger">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ isEditing ? 'Cập nhật bộ môn' : 'Thêm bộ môn mới' }}</h2>
          <button @click="closeModal" class="modal-close">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <form @submit.prevent="saveSport" class="modal-body">
          <div class="form-group">
            <label class="form-label">Tên bộ môn</label>
            <input v-model="form.name" type="text" class="form-input" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Loại hình</label>
            <select v-model="form.type" class="form-input" required>
              <option value="single">Cá nhân</option>
              <option value="team">Đồng đội</option>
              <option value="both">Cả hai</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Icon (Emoji)</label>
            <input v-model="form.icon_url" type="text" class="form-input" placeholder="VD: 🎾">
          </div>

          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea v-model="form.description" class="form-input" rows="3"></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn-action">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <i v-if="saving" class="pi pi-spinner pi-spin" style="margin-right: 0.5rem;"></i>
              Lưu bộ môn
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../config/supabase.js';

const sports = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const saving = ref(false);

const form = ref({
  id: null,
  name: '',
  type: 'single',
  icon_url: '',
  description: ''
});

const formatType = (type) => {
  const types = {
    single: 'Cá nhân',
    team: 'Đồng đội',
    both: 'Cả hai'
  };
  return types[type] || type;
};

const openAddModal = () => {
  isEditing.value = false;
  form.value = { id: null, name: '', type: 'single', icon_url: '', description: '' };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveSport = async () => {
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      type: form.value.type,
      icon_url: form.value.icon_url,
      icon_emoji: form.value.icon_url,
      description: form.value.description
    };

    if (isEditing.value) {
      await supabase.from('sports_categories').update(payload).eq('id', form.value.id);
    } else {
      await supabase.from('sports_categories').insert([payload]);
    }
    
    closeModal();
    loadSports();
  } catch (error) {
    alert('Lỗi khi lưu bộ môn!');
    console.error(error);
  } finally {
    saving.value = false;
  }
};

const loadSports = async () => {
  const { data } = await supabase.from('sports_categories').select('*').order('name');
  sports.value = data || [];
};

const deleteSport = async (id) => {
  if (confirm('Bạn có chắc muốn xóa bộ môn này?')) {
    await supabase.from('sports_categories').delete().eq('id', id);
    loadSports();
  }
};

const editSport = (sport) => {
  isEditing.value = true;
  form.value = { ...sport };
  showModal.value = true;
};

onMounted(loadSports);
</script>

<style scoped>
.sports-page {
  min-height: 100vh;
  padding: 2rem 1rem;
}

.sports-container {
  max-width: 56rem;
  margin: 0 auto;
}

.sports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.sports-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.sports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.sport-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  transition: all 0.3s;
}

.sport-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

.sport-icon {
  font-size: 2.25rem;
  margin-bottom: 0.75rem;
}

.sport-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.sport-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.sport-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  color: rgba(255, 255, 255, 0.8);
}

.sport-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.sport-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-action {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal-content {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
}

.modal-close:hover {
  color: white;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #60a5fa;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
