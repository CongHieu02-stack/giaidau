<template>
  <div class="list-page">
    <div class="page-shell">
      <div class="page-head">
        <div>
          <p class="eyebrow">Admin - Quản lý giải</p>
          <h1>Danh sách giải đấu</h1>
        </div>
        <RouterLink :to="`${basePath}/create`" class="primary-button">
          <i class="pi pi-plus"></i>
          Tạo giải đấu
        </RouterLink>
      </div>

      <div v-if="loading" class="state-panel">
        <i class="pi pi-spinner pi-spin"></i>
        Đang tải danh sách giải đấu...
      </div>

      <div v-else-if="errorMessage" class="state-panel error">
        {{ errorMessage }}
      </div>

      <div v-else class="table-panel">
        <table>
          <thead>
            <tr>
              <th>Tên giải</th>
              <th>Bộ môn</th>
              <th>Trạng thái</th>
              <th>Đăng ký</th>
              <th>Ngày thi đấu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tournament in tournaments" :key="tournament.id">
              <td>
                <strong>{{ tournament.name }}</strong>
                <span v-if="tournament.cancellation_reason" class="note">
                  {{ tournament.cancellation_reason }}
                </span>
              </td>
              <td>{{ tournament.sport_category?.name || 'Chưa chọn' }}</td>
              <td>
                <span class="status" :class="`status-${tournament.status}`">
                  {{ getStatusLabel(tournament.status) }}
                </span>
              </td>
              <td>{{ tournament.registration_count }}/{{ tournament.max_teams }}</td>
              <td>{{ formatDate(tournament.start_date) }}</td>
              <td>
                <div class="row-actions">
                  <RouterLink
                    :to="`${basePath}/${tournament.id}/edit`"
                    class="icon-button"
                    title="Chỉnh sửa giải"
                  >
                    <i class="pi pi-pencil"></i>
                  </RouterLink>
                  <button
                    type="button"
                    class="icon-button danger"
                    title="Hủy giải"
                    :disabled="!canCancel(tournament)"
                    @click="openCancel(tournament)"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="tournaments.length === 0">
              <td colspan="6" class="empty">Chưa có giải đấu nào.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="cancelTarget" class="modal-backdrop" @click.self="closeCancel">
      <form class="cancel-modal" @submit.prevent="confirmCancel">
        <h2>Hủy giải đấu</h2>
        <p>{{ cancelTarget.name }}</p>
        <label class="field">
          <span>Lý do hủy</span>
          <textarea v-model.trim="cancelReason" rows="4" placeholder="Nhập lý do để câu lạc bộ và thành viên nắm được" required></textarea>
        </label>
        <p v-if="cancelError" class="message error">{{ cancelError }}</p>
        <div class="modal-actions">
          <button type="submit" class="danger-button" :disabled="cancelLoading">
            <i :class="cancelLoading ? 'pi pi-spinner pi-spin' : 'pi pi-check'"></i>
            {{ cancelLoading ? 'Đang hủy...' : 'Xác nhận hủy' }}
          </button>
          <button type="button" class="secondary-button" @click="closeCancel">Đóng</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  cancelTournamentForAdmin,
  fetchAdminTournaments
} from '../../features/tournaments/adminTournamentManagement.js';

const route = useRoute();
const tournaments = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const cancelTarget = ref(null);
const cancelReason = ref('');
const cancelError = ref('');
const cancelLoading = ref(false);
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

onMounted(loadTournaments);

async function loadTournaments() {
  loading.value = true;
  errorMessage.value = '';

  try {
    tournaments.value = await fetchAdminTournaments();
  } catch (error) {
    errorMessage.value = error.message || 'Không tải được danh sách giải đấu.';
  } finally {
    loading.value = false;
  }
}

function getStatusLabel(status) {
  return statusLabels[status] || status;
}

function formatDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function canCancel(tournament) {
  return !['completed', 'cancelled'].includes(tournament.status);
}

function openCancel(tournament) {
  cancelTarget.value = tournament;
  cancelReason.value = '';
  cancelError.value = '';
}

function closeCancel() {
  cancelTarget.value = null;
  cancelReason.value = '';
  cancelError.value = '';
}

async function confirmCancel() {
  cancelLoading.value = true;
  cancelError.value = '';

  const result = await cancelTournamentForAdmin(cancelTarget.value.id, cancelReason.value);

  if (!result.success) {
    cancelError.value = result.error;
    cancelLoading.value = false;
    return;
  }

  cancelLoading.value = false;
  closeCancel();
  await loadTournaments();
}
</script>

<style scoped>
.list-page {
  min-height: 100%;
  padding: 32px 20px 56px;
  text-align: left;
}

.page-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
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
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
}

.table-panel,
.state-panel,
.cancel-modal {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.76);
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.35);
}

.state-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 180px;
  color: #e2e8f0;
  font-weight: 800;
}

.state-panel.error {
  color: #fecaca;
}

.table-panel {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.78);
  vertical-align: top;
}

th {
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
}

td strong {
  display: block;
  color: #ffffff;
  font-weight: 800;
}

.note {
  display: block;
  margin-top: 5px;
  color: #fca5a5;
  font-size: 0.85rem;
}

.empty {
  text-align: center;
}

.status {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 800;
  background: rgba(148, 163, 184, 0.16);
  color: #e2e8f0;
}

.status-registration_open {
  background: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
}

.status-ongoing {
  background: rgba(59, 130, 246, 0.18);
  color: #bfdbfe;
}

.status-completed {
  background: rgba(168, 85, 247, 0.18);
  color: #e9d5ff;
}

.status-cancelled {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

.row-actions,
.modal-actions {
  display: flex;
  gap: 10px;
}

.primary-button,
.secondary-button,
.danger-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.primary-button {
  padding: 0 18px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
}

.secondary-button {
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
}

.danger-button {
  padding: 0 18px;
  background: #dc2626;
}

.icon-button {
  width: 42px;
  background: rgba(255, 255, 255, 0.1);
}

.icon-button.danger {
  color: #fecaca;
  background: rgba(220, 38, 38, 0.18);
}

.icon-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(2, 6, 23, 0.72);
}

.cancel-modal {
  display: grid;
  gap: 16px;
  width: min(520px, 100%);
  padding: 22px;
}

.cancel-modal p {
  color: #cbd5e1;
}

.field {
  display: grid;
  gap: 8px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 700;
}

textarea {
  width: 100%;
  min-height: 110px;
  padding: 12px;
  border: 1px solid rgba(203, 213, 225, 0.28);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
  color: #ffffff;
  font: inherit;
  letter-spacing: 0;
  resize: vertical;
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

@media (max-width: 760px) {
  .page-head {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
