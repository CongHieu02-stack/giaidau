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

      <div v-else-if="errorMessage && !tournament" class="state-panel error">
        <div class="error-content">
          <i class="pi pi-exclamation-circle text-2xl"></i>
          <p>{{ errorMessage }}</p>
          <button @click="loadTournament" class="secondary-button mt-4"> Thử lại </button>
        </div>
      </div>

      <form v-else-if="tournament" class="form-panel" @submit.prevent="handleSubmit">
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

            <label class="field field-wide">
              <span>Ngày hết hạn đăng ký</span>
              <input v-model="form.registrationDeadline" type="datetime-local" :disabled="readOnly" required>
            </label>

            <label class="field">
              <span>Ngày thi đấu</span>
              <input v-model="form.startDate" type="date" :disabled="readOnly" required>
            </label>

            <label class="field">
              <span>Giờ thi đấu</span>
              <input v-model="form.startTime" type="time" :disabled="readOnly" required>
            </label>

            <label class="field">
              <span>Ngày kết thúc</span>
              <input v-model="form.endDate" type="date" :disabled="readOnly">
            </label>

            <label class="field">
              <span>Giờ kết thúc</span>
              <input v-model="form.endTime" type="time" :disabled="readOnly">
            </label>

            <label class="field">
              <span>Sân thi đấu</span>
              <select v-model="form.venueId" :disabled="readOnly">
                <option value="">Chọn sân đấu (không bắt buộc)</option>
                <option v-for="venue in filteredVenues" :key="venue.id" :value="venue.id">
                  {{ venue.name }}
                </option>
              </select>
            </label>
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

      <!-- Pairing & Group Configuration Section -->
      <section v-if="tournament && !loading" class="form-section pairing-section">
        <div class="section-header">
          <h2>Bố cục & Lịch thi đấu</h2>
          <div class="header-actions">
            <span class="teams-count">Đã duyệt: <strong>{{ tournament.approved_count }}</strong> đội</span>
            <button 
              v-if="!showConfigurator && tournament.status !== 'ongoing'"
              type="button" 
              class="primary-button" 
              :disabled="tournament.approved_count < (tournament.min_teams || 2) || readOnly"
              @click="showConfigurator = true"
            >
              <i class="pi pi-cog mr-1"></i> Thiết lập bảng đấu
            </button>
            <button 
              v-else-if="showConfigurator"
              type="button" 
              class="secondary-button"
              @click="showConfigurator = false"
            >
              Hủy thiết lập
            </button>
          </div>
        </div>

        <div v-if="showConfigurator" class="configurator-wrapper">
          <GroupConfigurator 
            :approved-teams="approvedTeams"
            :initial-groups="draftGroups"
            @confirm="handleConfirmGroups"
            @change="onGroupsChange"
          />
        </div>

        <div v-else-if="matches.length > 0" class="matches-list">
          <div class="matches-grid">
            <div v-for="match in matches" :key="match.id" class="match-item">
              <div class="match-time">
                <div class="flex gap-2">
                  <span v-if="match.group_name || match.group?.name" class="group-badge">
                    {{ match.group_name || match.group?.name }}
                  </span>
                  <span v-else-if="match.round" class="round-badge">Vòng {{ match.round }}</span>
                </div>
                <div class="flex gap-3">
                  <span><i class="pi pi-calendar mr-1"></i>{{ formatDate(match.match_date) }}</span>
                  <span><i class="pi pi-clock mr-1"></i>{{ match.match_time }}</span>
                </div>
              </div>
              <div class="match-pairing">
                <span class="club">{{ match.home_club?.name || '???' }}</span>
                <div v-if="match.home_score !== null && match.away_score !== null" class="score-container">
                  <span class="score">{{ match.home_score }} - {{ match.away_score }}</span>
                  <span v-if="match.status === 'completed'" class="ft-badge">FT</span>
                </div>
                <span v-else class="vs">VS</span>
                <span class="club">{{ match.away_club?.name || '???' }}</span>
              </div>
              <div class="match-venue">
                <i class="pi pi-map-marker"></i>
                {{ match.venue?.name || 'Chưa chọn sân' }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-matches">
          <p>Chưa có lịch thi đấu. Hãy duyệt các đội và bấm nút "Thiết lập bảng đấu" để bắt đầu.</p>
        </div>
      </section>

      <!-- Registration List Section -->
      <section v-if="tournament?.registrations?.length" class="registrations-section">
        <div class="section-header">
          <h2>Danh sách đăng ký ({{ tournament.registrations.length }})</h2>
        </div>
        
        <div class="registrations-grid">
          <div 
            v-for="reg in tournament.registrations" 
            :key="reg.id" 
            class="registration-card"
          >
            <div class="club-info">
              <div class="club-logo">
                <img v-if="reg.club?.logo_url" :src="reg.club.logo_url" :alt="reg.club.name">
                <i v-else class="pi pi-shield"></i>
              </div>
              <div class="club-details">
                <h3>{{ reg.club?.name }}</h3>
                <p class="reg-date">Đăng ký: {{ formatDate(reg.registered_at) }}</p>
              </div>
            </div>
            
            <div class="reg-status">
              <span :class="['status-badge', reg.status]">
                {{ statusLabels[reg.status] || reg.status }}
              </span>
            </div>

            <div v-if="reg.status === 'pending' && !readOnly" class="reg-actions">
              <button 
                type="button" 
                class="approve-btn" 
                title="Duyệt đăng ký"
                @click="handleApprove(reg.id)"
              >
                <i class="pi pi-check"></i>
              </button>
              <button 
                type="button" 
                class="reject-btn" 
                title="Từ chối"
                @click="handleReject(reg.id)"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section v-else-if="!loading" class="registrations-section empty">
        <div class="empty-state">
          <i class="pi pi-users"></i>
          <p>Chưa có câu lạc bộ nào đăng ký tham gia.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../../config/supabase.js';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import {
  fetchAdminTournament,
  updateTournamentForAdmin,
  approveTournamentRegistration,
  rejectTournamentRegistration,
  startTournament
} from '../../features/tournaments/adminTournamentManagement.js';
import { fetchVenues } from '../../features/tournaments/adminCreateTournament.js';
import GroupConfigurator from '../../components/tournaments/GroupConfigurator.vue';
import { useTournamentStore } from '../../stores/tournament.js';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirmService = useConfirm();

const tournament = ref(null);
const venues = ref([]);
const loading = ref(true);
const saving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const generatingMatches = ref(false);
const matches = ref([]);
const showConfigurator = ref(false);
const tournamentStore = useTournamentStore();

const approvedTeams = computed(() => {
  return (tournament.value?.registrations || [])
    .filter(r => r.status === 'approved')
    .map(r => r.club);
});

const draftGroups = computed(() => tournamentStore.draftGroups);
const basePath = computed(() => (
  route.path.startsWith('/tournament-admin') ? '/tournament-admin/tournaments' : '/admin/tournaments'
));

const filteredVenues = computed(() => {
  const sportId = tournament.value?.sport_category_id;
  if (!sportId) return [];
  return venues.value.filter(v => v.sport_category_id === sportId);
});

const statusLabels = {
  upcoming: 'Sắp diễn ra',
  registration_open: 'Mở đăng ký',
  registration_closed: 'Đóng đăng ký',
  ongoing: 'Đang diễn ra',
  completed: 'Đã kết thúc',
  cancelled: 'Đã hủy',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối'
};

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}



const form = reactive({
  rules: '',
  maxTeams: 16,
  registrationDeadline: '',
  startDate: '',
  startTime: '08:00',
  endDate: '',
  endTime: '17:00',
  matchDays: [],
  matchTimes: '',
  scheduleNote: '',
  venueId: ''
});

const readOnly = computed(() => ['completed', 'cancelled'].includes(tournament.value?.status));

onMounted(loadTournament);

async function loadTournament() {
  loading.value = true;
  errorMessage.value = '';

  try {
    tournament.value = await fetchAdminTournament(route.params.id);
    
    // Fetch matches
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        home_club:clubs!matches_home_club_id_fkey(id, name, logo_url),
        away_club:clubs!matches_away_club_id_fkey(id, name, logo_url),
        venue:venues(id, name)
      `)
      .eq('tournament_id', route.params.id)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true });

    if (!matchError) {
      matches.value = matchData || [];
    }

    form.rules = tournament.value.rules || '';
    form.maxTeams = tournament.value.max_teams || 16;
    form.registrationDeadline = toDateTimeLocal(tournament.value.registration_deadline);
    form.startDate = tournament.value.start_date || '';
    form.endDate = tournament.value.end_date || '';
    const times = tournament.value.match_times || [];
    form.startTime = times.length > 0 ? String(times[0]).slice(0, 5) : '08:00';
    form.endTime = times.length > 1 ? String(times[1]).slice(0, 5) : '17:00';
    form.scheduleNote = tournament.value.venue_requirements || '';
    form.venueId = tournament.value.venue_id || '';
    venues.value = await fetchVenues();
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

async function handleApprove(regId) {
  confirmService.require({
    message: 'Bạn có chắc chắn muốn duyệt câu lạc bộ này tham gia giải đấu?',
    header: 'Xác nhận duyệt',
    icon: 'pi pi-check-circle',
    accept: async () => {
      try {
        const result = await approveTournamentRegistration(regId);
        if (result.success) {
          toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã duyệt đăng ký.', life: 3000 });
          await loadTournament();
        } else {
          toast.add({ severity: 'error', summary: 'Lỗi', detail: result.error, life: 3000 });
        }
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: error.message || 'Lỗi khi duyệt đăng ký.', life: 3000 });
      }
    }
  });
}

async function handleReject(regId) {
  const reason = prompt('Nhập lý do từ chối đăng ký:');
  if (reason === null) return;
  if (!reason.trim()) {
    alert('Vui lòng nhập lý do từ chối.');
    return;
  }
  
  try {
    const result = await rejectTournamentRegistration(regId, reason);
    if (result.success) {
      successMessage.value = 'Đã từ chối đăng ký.';
      await loadTournament();
    } else {
      errorMessage.value = result.error;
    }
  } catch (error) {
    errorMessage.value = error.message || 'Lỗi khi từ chối đăng ký.';
  }
}

function onGroupsChange(groups) {
  tournamentStore.setDraftGroups(groups);
}

async function handleConfirmGroups(groups) {
  if (!tournament.value) return;

  confirmService.require({
    message: 'Xác nhận bắt đầu giải đấu với bố cục này? Hành động này sẽ tạo lịch thi đấu và KHÓA việc đăng ký/chỉnh sửa nhân sự.',
    header: 'Xác nhận bắt đầu giải',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      generatingMatches.value = true;
      errorMessage.value = '';
      
      let venueIds = [];
      if (form.venueId) {
        venueIds = [form.venueId];
      } else {
        const sportVenues = venues.value.filter(v => v.sport_category_id === tournament.value.sport_category_id);
        if (sportVenues.length > 0) {
          venueIds = [sportVenues[0].id];
        }
      }

      if (venueIds.length === 0) {
        toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Không có sân đấu hợp lệ để ghép lịch.', life: 5000 });
        generatingMatches.value = false;
        return;
      }

      const result = await startTournament(tournament.value.id, groups, venueIds);
      
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Giải đấu đã bắt đầu và lịch thi đấu đã được tạo.', life: 3000 });
        showConfigurator.value = false;
        tournamentStore.clearDraftGroups();
        await loadTournament();
      } else {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: result.error, life: 5000 });
      }
      
      generatingMatches.value = false;
    }
  });
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
  margin-bottom: 24px;
}

.pairing-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.pairing-section .section-header h2 {
  margin-bottom: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.teams-count {
  color: #94a3b8;
  font-size: 0.95rem;
}

.teams-count strong {
  color: #ffffff;
  font-size: 1.1rem;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.match-item {
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: grid;
  gap: 10px;
}

.match-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #a5b4fc;
  font-weight: 700;
}

.group-badge,
.round-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.group-badge {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.round-badge {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.match-pairing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.match-pairing .club {
  flex: 1;
  text-align: center;
  font-weight: 800;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-pairing .vs {
  font-size: 0.75rem;
  font-weight: 900;
  color: #f43f5e;
  padding: 2px 6px;
  background: rgba(244, 63, 94, 0.1);
  border-radius: 4px;
}

.score-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.score-container .score {
  font-size: 1.1rem;
  font-weight: 900;
  color: #ffffff;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  line-height: 1;
}

.ft-badge {
  font-size: 0.6rem;
  font-weight: 900;
  color: #4ade80;
  background: rgba(34, 197, 94, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  text-transform: uppercase;
}

.match-venue {
  font-size: 0.85rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-matches {
  padding: 32px;
  text-align: center;
  background: rgba(15, 23, 42, 0.4);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  font-style: italic;
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
textarea,
select {
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
textarea:disabled,
select:disabled {
  color: rgba(255, 255, 255, 0.58);
  background: rgba(15, 23, 42, 0.46);
  filter: blur(0.2px);
  cursor: not-allowed;
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

.registrations-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.registrations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.registration-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: transform 0.2s;
}

.registration-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.08);
}

.club-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.club-logo {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.club-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-logo i {
  font-size: 1.5rem;
  color: #a5b4fc;
}

.club-details h3 {
  margin: 0;
  font-size: 1rem;
  color: #fff;
}

.reg-date {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.status-badge.approved { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.status-badge.rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.reg-actions {
  display: flex;
  gap: 8px;
}

.approve-btn,
.reject-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.approve-btn {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.approve-btn:hover {
  background: #10b981;
  color: white;
}

.reject-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.reject-btn:hover {
  background: #ef4444;
  color: white;
}

.registrations-section.empty {
  text-align: center;
  padding: 48px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state i {
  font-size: 3rem;
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

  .registrations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
