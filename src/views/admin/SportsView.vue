<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">

      <!-- Hero Header -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-shield"></i></div>
          <div>
            <h1 class="hero-title">Danh mục Bộ môn</h1>
            <p class="hero-subtitle">Quản lý các bộ môn thể thao trong hệ thống</p>
          </div>
        </div>
        <div class="controls-row">
          <div class="stats-pill">
            <i class="pi pi-list"></i>
            <span>{{ sports.length }} bộ môn</span>
          </div>
          <button @click="openAddModal" class="btn-create">
            <i class="pi pi-plus"></i> Thêm bộ môn mới
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Đang tải dữ liệu...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="sports.length === 0" class="empty-state">
        <div class="empty-icon"><i class="pi pi-shield"></i></div>
        <h3>Chưa có bộ môn nào</h3>
        <p>Hãy thêm bộ môn đầu tiên để bắt đầu quản lý giải đấu</p>
        <button @click="openAddModal" class="btn-create">
          <i class="pi pi-plus"></i> Thêm bộ môn
        </button>
      </div>

      <!-- Sports Grid -->
      <div v-else class="sports-grid">
        <div
          v-for="(sport, i) in sports"
          :key="sport.id"
          class="sport-card"
          :style="{ animationDelay: `${i * 0.05}s` }"
        >
          <div class="card-glow"></div>

          <!-- Hover Actions -->
          <div class="card-actions">
            <button @click="editSport(sport)" class="action-btn edit-btn" title="Chỉnh sửa">
              <i class="pi pi-pencil"></i>
            </button>
            <button @click="deleteSport(sport.id)" class="action-btn delete-btn" title="Xóa">
              <i class="pi pi-trash"></i>
            </button>
          </div>

          <!-- Card Header -->
          <div class="card-header">
            <div class="sport-emoji">{{ sport.icon_url || '🏆' }}</div>
            <span :class="['type-badge', `type-${sport.type}`]">
              {{ formatType(sport.type) }}
            </span>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <h3 class="sport-name">{{ sport.name }}</h3>
            <p class="sport-desc">{{ sport.description || 'Chưa có mô tả cho bộ môn này.' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon">
              <i :class="isEditing ? 'pi pi-pencil' : 'pi pi-plus'"></i>
            </div>
            <h2 class="modal-title">{{ isEditing ? 'Cập nhật bộ môn' : 'Thêm bộ môn mới' }}</h2>
          </div>
          <button @click="closeModal" class="modal-close"><i class="pi pi-times"></i></button>
        </div>

        <form @submit.prevent="saveSport" class="modal-body">
          <div class="form-grid">
            <label class="field field-wide">
              <span>Tên bộ môn <span class="req">*</span></span>
              <input v-model="form.name" type="text" placeholder="VD: Bóng đá, Cầu lông..." required />
            </label>

            <label class="field">
              <span>Loại hình <span class="req">*</span></span>
              <select v-model="form.type" required>
                <option value="single">Cá nhân</option>
                <option value="team">Đồng đội</option>
                <option value="both">Cả hai</option>
              </select>
            </label>

            <label class="field">
              <span>Icon (Emoji)</span>
              <input v-model="form.icon_url" type="text" placeholder="VD: 🎾 🏀 ⚽" />
            </label>

            <label class="field field-wide">
              <span>Mô tả</span>
              <textarea v-model="form.description" rows="3" placeholder="Mô tả ngắn về bộ môn..."></textarea>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel" :disabled="saving">Hủy</button>
            <button type="submit" class="btn-submit" :disabled="saving">
              <i :class="saving ? 'pi pi-spinner pi-spin' : 'pi pi-check'"></i>
              {{ saving ? 'Đang lưu...' : 'Lưu bộ môn' }}
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
const loading = ref(true);

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
  loading.value = true;
  const { data } = await supabase.from('sports_categories').select('*').order('name');
  sports.value = data || [];
  loading.value = false;
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
.page-wrapper { min-height: 100vh; padding: 6rem 1.5rem 3rem; }
.max-w-7xl { max-width: 80rem; margin: 0 auto; }

/* ── Hero ── */
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
  background: radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 1rem; }
.hero-icon {
  width: 56px; height: 56px; border-radius: 1rem; flex-shrink: 0;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: white;
  box-shadow: 0 8px 24px rgba(139,92,246,0.45);
}
.hero-title { font-size: 2rem; font-weight: 800; color: white; line-height: 1.1; margin: 0; }
.hero-subtitle { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-top: 0.25rem; }

.controls-row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; }

.stats-pill {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.45rem 1rem;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 999px; color: #c4b5fd;
  font-size: 0.8rem; font-weight: 600;
}

.btn-create {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white; font-size: 0.875rem; font-weight: 600;
  border-radius: 0.875rem; transition: all 0.25s; border: none; cursor: pointer;
  box-shadow: 0 4px 16px rgba(139,92,246,0.35);
}
.btn-create:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(139,92,246,0.5); }

/* ── Loading ── */
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; padding: 5rem 0; color: rgba(255,255,255,0.4); font-size: 1rem;
}
.loading-state .pi-spinner { font-size: 2.5rem; color: rgba(139,92,246,0.5); }

/* ── Empty ── */
.empty-state { text-align: center; padding: 5rem 1rem; }
.empty-icon {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem; font-size: 2rem; color: rgba(139,92,246,0.5);
}
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
.empty-state p { font-size: 0.875rem; color: rgba(255,255,255,0.4); margin-bottom: 1.5rem; }

/* ── Grid ── */
.sports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ── Card ── */
.sport-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0; animation: fadeUp 0.5s ease forwards;
  display: flex; flex-direction: column;
  cursor: default;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sport-card:hover {
  transform: translateY(-6px);
  border-color: rgba(139,92,246,0.35);
  box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.12);
}

.card-glow {
  position: absolute; inset: 0; opacity: 0; pointer-events: none;
  background: radial-gradient(circle at 50% 0%, rgba(139,92,246,0.14), transparent 65%);
  transition: opacity 0.3s;
}
.sport-card:hover .card-glow { opacity: 1; }

/* Hover action buttons */
.card-actions {
  position: absolute; top: 1rem; right: 1rem;
  display: flex; gap: 0.4rem;
  opacity: 0; transition: opacity 0.2s; z-index: 10;
}
.sport-card:hover .card-actions { opacity: 1; }

.action-btn {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
  border: 1px solid transparent; color: white;
}
.edit-btn { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.15); }
.edit-btn:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); }
.delete-btn { background: rgba(239,68,68,0.15); color: #fca5a5; border-color: rgba(239,68,68,0.25); }
.delete-btn:hover { background: rgba(239,68,68,0.28); border-color: rgba(239,68,68,0.45); }

/* Card Header */
.card-header {
  padding: 1.25rem 1.25rem 0;
  display: flex; align-items: flex-start; justify-content: space-between;
}
.sport-emoji {
  font-size: 2.5rem; line-height: 1;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

/* Type Badge */
.type-badge {
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  white-space: nowrap;
  height: 32px;
  padding: 0 0.75rem;
  border-radius: 8px; font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sport-card:hover .type-badge {
  transform: translateX(-88px);
}
.type-single  { background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.25); }
.type-team    { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.25); }
.type-both    { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.25); }

/* Card Body */
.card-body { padding: 1rem 1.25rem 1.25rem; display: flex; flex-direction: column; flex: 1; }
.sport-name {
  font-size: 1.15rem; font-weight: 700; color: white;
  margin: 0 0 0.5rem; line-height: 1.3;
}
.sport-desc {
  font-size: 0.85rem; color: rgba(255,255,255,0.5);
  line-height: 1.55; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(2,6,23,0.8); backdrop-filter: blur(8px); padding: 1rem;
}
.modal-panel {
  width: min(560px, 100%);
  background: rgba(15,12,45,0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 1.5rem; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15);
  animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.94) translateY(-12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(to right, rgba(139,92,246,0.1), rgba(236,72,153,0.05));
}
.modal-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.modal-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; color: white;
}
.modal-title { font-size: 1.2rem; font-weight: 800; color: white; letter-spacing: -0.02em; margin: 0; }
.modal-close {
  width: 34px; height: 34px; border-radius: 8px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.modal-close:hover { background: rgba(255,255,255,0.14); color: white; }

.modal-body { padding: 1.75rem 2rem; }

.form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 1.25rem; }
.field { display: flex; flex-direction: column; gap: 0.4rem; color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; }
.field-wide { grid-column: 1 / -1; }

.field input, .field textarea, .field select {
  padding: 0.8rem 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 0.75rem; color: white;
  font: inherit; transition: all 0.25s ease; resize: vertical;
}
.field select {
  cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; padding-right: 2.5rem;
}
.field select option { background-color: #1e1b4b; color: white; }
.field input:focus, .field textarea:focus, .field select:focus {
  outline: none; border-color: rgba(139,92,246,0.6);
  background: rgba(255,255,255,0.07);
  box-shadow: 0 0 0 4px rgba(139,92,246,0.15);
}
.field input::placeholder, .field textarea::placeholder { color: rgba(255,255,255,0.25); }
.req { color: #f87171; }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-cancel {
  padding: 0.65rem 1.25rem; background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7);
  border-radius: 0.625rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; font-size: 0.875rem;
}
.btn-cancel:hover { background: rgba(255,255,255,0.12); }
.btn-submit {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white; border-radius: 0.625rem; font-weight: 600;
  cursor: pointer; transition: all 0.25s; font-size: 0.875rem;
  box-shadow: 0 4px 16px rgba(139,92,246,0.35); border: none;
}
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(139,92,246,0.5); }
.btn-cancel:disabled, .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

@media (max-width: 520px) {
  .form-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 1.5rem; }
}
</style>
