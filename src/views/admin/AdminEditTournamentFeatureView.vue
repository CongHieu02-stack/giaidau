<template>
  <div class="edit-page">
    <div class="page-shell">
      <div class="page-head">
        <div>
          <p class="eyebrow">Admin - Quản lý giải</p>
          <h1>Chỉnh sửa giải</h1>
        </div>
        <RouterLink :to="basePath" class="secondary-button">
          <i class="pi pi-arrow-left"></i>
          Quay lại
        </RouterLink>
      </div>

      <div v-if="loading" class="state-panel">
        <i class="pi pi-spinner pi-spin"></i>
        Đang tải thông tin giải đấu...
      </div>

      <form v-else class="form-panel" @submit.prevent="handleSubmit">
        <section class="form-section">
          <h2>Thông tin không chỉnh sửa</h2>
          <div class="form-grid">
            <label class="field">
              <span>Tên giải đấu</span>
              <input :value="tournament?.name" disabled>
            </label>
            <label class="field">
              <span>Bộ môn</span>
              <input :value="tournament?.sport_category?.name || 'Chưa chọn'" disabled>
            </label>
            <label class="field">
              <span>Trạng thái</span>
              <input :value="statusLabels[tournament?.status] || tournament?.status" disabled>
            </label>
            <label class="field">
              <span>Số đội đã đăng ký</span>
              <input :value="tournament?.registration_count || 0" disabled>
            </label>
          </div>
        </section>

        <section class="form-section">
          <h2>Thông tin được chỉnh sửa</h2>
          <div class="form-grid">
            <label class="field">
              <span>Số lượng CLB tham gia</span>
              <input
                v-model.number="form.maxTeams"
                type="number"
                min="2"
                :disabled="readOnly"
                required
              >
            </label>

            <label class="field">
              <span>Ngày hết hạn đăng ký</span>
              <input v-model="form.registrationDeadline" type="datetime-local" :disabled="readOnly" required>
            </label>

            <label class="field">
              <span>Ngày thi đấu</span>
              <input v-model="form.startDate" type="date" :disabled="readOnly" required>
            </label>

            <label class="field">
              <span>Ngày kết thúc</span>
              <input v-model="form.endDate" type="date" :disabled="readOnly">
            </label>

            <label class="field field-wide">
              <span>Giờ thi đấu</span>
              <input v-model="form.matchTimes" type="text" placeholder="17:00, 19:00" :disabled="readOnly" required>
            </label>
          </div>

          <div class="day-picker">
            <span>Ngày thi đấu trong tuần</span>
            <div class="day-list">
              <label v-for="day in weekDays" :key="day.value" class="day-chip">
                <input v-model="form.matchDays" type="checkbox" :value="day.value" :disabled="readOnly">
                <span>{{ day.label }}</span>
              </label>
            </div>
          </div>

          <label class="field block-field">
            <span>Thể lệ</span>
            <textarea v-model.trim="form.rules" rows="5" :disabled="readOnly" required></textarea>
          </label>

          <label class="field block-field">
            <span>Lịch thi đấu / yêu cầu địa điểm</span>
            <textarea v-model.trim="form.scheduleNote" rows="3" :disabled="readOnly"></textarea>
          </label>
        </section>

        <p v-if="readOnly" class="message warning">
          Giải đã kết thúc hoặc đã hủy nên không thể chỉnh sửa.
        </p>
        <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="message success">{{ successMessage }}</p>

        <div class="actions">
          <button type="submit" class="primary-button" :disabled="saving || readOnly">
            <i :class="saving ? 'pi pi-spinner pi-spin' : 'pi pi-check'"></i>
            {{ saving ? 'Đang lưu...' : 'Xác nhận chỉnh sửa' }}
          </button>
          <RouterLink :to="basePath" class="secondary-button">Hủy</RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  fetchAdminTournament,
  updateTournamentForAdmin
} from '../../features/tournaments/adminTournamentManagement.js';

const route = useRoute();
const router = useRouter();

const tournament = ref(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const basePath = computed(() => (
  route.path.startsWith('/tournament-admin') ? '/tournament-admin/tournaments' : '/admin/tournaments'
));

const statusLabels = {
  upcoming: 'Sắp diễn ra',
  registration_open: 'Mở đăng ký',
  registration_closed: 'Đóng đăng ký',
  ongoing: 'Đang diễn ra',
  completed: 'Đã kết thúc',
  cancelled: 'Đã hủy'
};

const weekDays = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'CN' }
];

const form = reactive({
  rules: '',
  maxTeams: 16,
  registrationDeadline: '',
  startDate: '',
  endDate: '',
  matchDays: [],
  matchTimes: '',
  scheduleNote: ''
});

const readOnly = computed(() => ['completed', 'cancelled'].includes(tournament.value?.status));

onMounted(loadTournament);

async function loadTournament() {
  loading.value = true;
  errorMessage.value = '';

  try {
    tournament.value = await fetchAdminTournament(route.params.id);
    form.rules = tournament.value.rules || '';
    form.maxTeams = tournament.value.max_teams || 16;
    form.registrationDeadline = toDateTimeLocal(tournament.value.registration_deadline);
    form.startDate = tournament.value.start_date || '';
    form.endDate = tournament.value.end_date || '';
    form.matchDays = tournament.value.match_days || [];
    form.matchTimes = (tournament.value.match_times || []).map((time) => String(time).slice(0, 5)).join(', ');
    form.scheduleNote = tournament.value.venue_requirements || '';
  } catch (error) {
    errorMessage.value = error.message || 'Không tải được thông tin giải đấu.';
  } finally {
    loading.value = false;
  }
}

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

async function handleSubmit() {
  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  const result = await updateTournamentForAdmin(
    route.params.id,
    form,
    tournament.value?.registration_count || 0
  );

  if (!result.success) {
    errorMessage.value = result.error;
    saving.value = false;
    return;
  }

  successMessage.value = 'Đã cập nhật giải đấu. Đang chuyển về danh sách...';
  setTimeout(() => {
    router.push(basePath.value);
  }, 500);
}
</script>

<style scoped>
.edit-page {
  min-height: 100%;
  padding: 32px 20px 56px;
  text-align: left;
}

.page-shell {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.page-head,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.page-head {
  margin-bottom: 24px;
}

.actions {
  justify-content: flex-start;
}

.eyebrow {
  color: #a5b4fc;
  font-size: 0.85rem;
  font-weight: 800;
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
  font-weight: 800;
}

.form-panel,
.state-panel {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.35);
}

.state-panel {
  place-items: center;
  min-height: 180px;
  color: #e2e8f0;
  font-weight: 800;
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
  font-weight: 700;
}

.field-wide,
.block-field {
  grid-column: 1 / -1;
}

.block-field {
  margin-top: 16px;
}

input,
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

input:disabled,
textarea:disabled {
  color: rgba(255, 255, 255, 0.58);
  background: rgba(15, 23, 42, 0.46);
  filter: blur(0.2px);
  cursor: not-allowed;
}

.day-picker {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 800;
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

.primary-button,
.secondary-button {
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

.secondary-button {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.message {
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 800;
}

.message.error {
  color: #fecaca;
  background: rgba(220, 38, 38, 0.18);
}

.message.success {
  color: #bbf7d0;
  background: rgba(22, 163, 74, 0.18);
}

.message.warning {
  color: #fde68a;
  background: rgba(217, 119, 6, 0.18);
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
}
</style>
