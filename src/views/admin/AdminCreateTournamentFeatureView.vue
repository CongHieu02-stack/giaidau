<template>
  <div class="create-page">
    <div class="page-shell">
      <div class="page-head">
        <div>
          <p class="eyebrow">Admin - Quản lý giải</p>
          <h1>Thêm giải đấu</h1>
        </div>
        <RouterLink :to="basePath" class="ghost-button">
          <i class="pi pi-arrow-left"></i>
          Quay lại
        </RouterLink>
      </div>

      <form class="form-panel" @submit.prevent="handleSubmit">
        <section class="form-section">
          <h2>Thông tin cơ bản</h2>
          <div class="form-grid">
            <label class="field field-wide">
              <span>Tên giải đấu</span>
              <input v-model.trim="form.name" type="text" placeholder="VD: GDU Open 2026" required>
            </label>

            <label class="field">
              <span>Bộ môn</span>
              <select v-model="form.sportCategoryId" required>
                <option value="">Chọn bộ môn</option>
                <option v-for="sport in sports" :key="sport.id" :value="sport.id">
                  {{ sport.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Hình thức thi đấu</span>
              <select v-model="form.format">
                <option value="knockout">Loại trực tiếp</option>
                <option value="group_stage">Vòng bảng</option>
              </select>
            </label>
            
            <label class="field">
              <span>Sân thi đấu</span>
              <select v-model="form.venueId">
                <option value="">Chọn sân đấu </option>
                <option v-for="venue in filteredVenues" :key="venue.id" :value="venue.id">
                  {{ venue.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>{{ form.participantType === 'individual' ? 'Số người chơi tối thiểu' : 'Số CLB tối thiểu' }}</span>
              <input v-model.number="form.minTeams" type="number" min="2" :max="form.maxTeams" required>
            </label>

            <label class="field">
              <span>{{ form.participantType === 'individual' ? 'Số lượng người chơi tham gia' : 'Số lượng CLB tham gia' }}</span>
              <input v-model.number="form.maxTeams" type="number" min="2" required>
            </label>

            <label class="field" v-if="form.participantType !== 'individual'">
              <span>Số VĐV mỗi đội (mỗi trận)</span>
              <input v-model.number="form.maxPlayersPerMatch" type="number" min="0" required>
            </label>
          </div>
        </section>

        <section class="form-section">
          <h2>Thời gian và lịch thi đấu</h2>
          <div class="form-grid">
            <label class="field field-wide">
              <span>Ngày hết hạn đăng ký</span>
              <input v-model="form.registrationDeadline" type="datetime-local" required>
            </label>

            <label class="field">
              <span>Ngày thi đấu</span>
              <input v-model="form.startDate" type="date" required>
            </label>

            <label class="field">
              <span>Giờ thi đấu</span>
              <input v-model="form.startTime" type="time" required>
            </label>

            <label class="field">
              <span>Ngày kết thúc</span>
              <input v-model="form.endDate" type="date">
            </label>

            <label class="field">
              <span>Giờ kết thúc</span>
              <input v-model="form.endTime" type="time">
            </label>
          </div>


        </section>

        <section class="form-section">
          <h2>Thể lệ và ghi chú</h2>
          <label class="field">
            <span>Thể lệ</span>
            <textarea v-model.trim="form.rules" rows="5" placeholder="Nhập thể lệ để các câu lạc bộ xem trước khi đăng ký" required></textarea>
          </label>

          <label class="field">
            <span>Lịch thi đấu / yêu cầu địa điểm</span>
            <textarea v-model.trim="form.scheduleNote" rows="3" placeholder="VD: Thi đấu vào cuối tuần, sân có đèn, mỗi trận 60 phút"></textarea>
          </label>
        </section>

        <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="message success">{{ successMessage }}</p>

        <div class="actions">
          <button type="submit" class="primary-button" :disabled="loading">
            <i :class="loading ? 'pi pi-spinner pi-spin' : 'pi pi-check'"></i>
            {{ loading ? 'Đang tạo...' : 'Xác nhận tạo giải' }}
          </button>
          <RouterLink :to="basePath" class="secondary-button">Hủy</RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import {
  createTournamentForAdmin,
  fetchSportCategories,
  fetchVenues
} from '../../features/tournaments/adminCreateTournament.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sports = ref([]);
const venues = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const basePath = computed(() => (
  route.path.startsWith('/tournament-admin') ? '/tournament-admin/tournaments' : '/admin/tournaments'
));

const weekDays = [
  { value: 1, label: 'Thu 2' },
  { value: 2, label: 'Thu 3' },
  { value: 3, label: 'Thu 4' },
  { value: 4, label: 'Thu 5' },
  { value: 5, label: 'Thu 6' },
  { value: 6, label: 'Thu 7' },
  { value: 0, label: 'CN' }
];

const form = reactive({
  name: '',
  description: '',
  sportCategoryId: '',
  format: 'knockout',
  participantType: 'club',
  rules: '',
  minTeams: 4,
  maxTeams: 16,
  maxPlayersPerMatch: 5,
  registrationDeadline: '',
  startDate: '',
  startTime: '17:00',
  endDate: '',
  endTime: '19:00',
  matchDays: [6, 0],
  matchTimes: '17:00, 19:00',
  scheduleNote: '',
  venueId: ''
});

const filteredVenues = computed(() => {
  if (!form.sportCategoryId) return [];
  return venues.value.filter(v => v.sport_category_id === form.sportCategoryId);
});

watch(() => form.sportCategoryId, (newVal) => {
  form.venueId = '';
  if (newVal) {
    const sport = sports.value.find(s => s.id === newVal);
    if (sport) {
      // Map 'single' -> 'individual', others -> 'club'
      const sportType = sport.participant_type || sport.type || 'team';
      form.participantType = sportType === 'single' ? 'individual' : 'club';
    }
  }
});

onMounted(async () => {
  try {
    if (!authStore.user) {
      await authStore.fetchUser();
    }
    sports.value = await fetchSportCategories();
    venues.value = await fetchVenues();
  } catch (error) {
    errorMessage.value = error.message || 'Không tải được danh sách bộ môn.';
  }
});

async function handleSubmit() {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  const result = await createTournamentForAdmin(form, authStore.user?.id);

  if (!result.success) {
    errorMessage.value = result.error;
    loading.value = false;
    return;
  }

  successMessage.value = 'Đã tạo giải đấu. Đang chuyển về danh sách...';
  setTimeout(() => {
    router.push(basePath.value);
  }, 500);
}
</script>

<style scoped>
.create-page {
  min-height: 100%;
  padding: 32px 20px 56px;
  text-align: left;
}

.page-shell {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  color: #a5b4fc;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1,
h2 {
  color: #ffffff;
  letter-spacing: 0;
}

h1 {
  margin: 4px 0 0;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
}

h2 {
  margin: 0 0 18px;
  font-size: 1.15rem;
  font-weight: 700;
}

.form-panel {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.35);
}

.form-section {
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.95rem;
  font-weight: 600;
}

.field-wide {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  width: 100%;
  min-height: 46px;
  padding: 11px 13px;
  border: 1px solid rgba(203, 213, 225, 0.28);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
  color: #ffffff;
  font: inherit;
  letter-spacing: 0;
}

textarea {
  resize: vertical;
  line-height: 1.5;
}

input:focus,
select:focus,
textarea:focus {
  outline: 2px solid rgba(96, 165, 250, 0.45);
  border-color: #60a5fa;
}

option {
  background-color: #0f172a;
  color: #ffffff;
}

.day-picker {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 700;
}

.day-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.day-chip {
  cursor: pointer;
}

.day-chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.day-chip span {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(203, 213, 225, 0.24);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.78);
  background: rgba(15, 23, 42, 0.65);
}

.day-chip input:checked + span {
  border-color: rgba(96, 165, 250, 0.75);
  color: #ffffff;
  background: rgba(37, 99, 235, 0.52);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.primary-button,
.secondary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.primary-button {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.secondary-button,
.ghost-button {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
}

.message {
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 700;
}

.message.error {
  color: #fecaca;
  background: rgba(220, 38, 38, 0.18);
}

.message.success {
  color: #bbf7d0;
  background: rgba(22, 163, 74, 0.18);
}

@media (max-width: 760px) {
  .page-head,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-head {
    align-items: stretch;
    flex-direction: column;
  }

  .form-panel,
  .form-section {
    padding: 16px;
  }
}
</style>
