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
              <span>Số đội đã duyệt</span>
              <input :value="tournament?.approved_count || 0" disabled>
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
                <option value="">Chọn sân đấu </option>
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
            <template v-if="tournament.status !== 'ongoing' || localMatches.length > 0 || (matches && matches.length === 0)">
              <!-- Knockout Seeding Button -->
              <button 
                v-if="!showSeeding && !localMatches.length"
                type="button" 
                class="secondary-button" 
                :disabled="tournament.approved_count < (tournament.min_teams || 2) || readOnly"
                @click="startSeeding"
              >
                <i class="pi pi-sort-alt mr-1"></i>
                Xếp hạt giống
              </button>

              <!-- Knockout Preview Button -->
              <button 
                v-if="!localMatches.length"
                type="button" 
                class="primary-button knockout-start" 
                :disabled="tournament.approved_count < (tournament.min_teams || 2) || readOnly || generatingMatches"
                @click="handlePreviewBracket"
              >
                <i :class="generatingMatches ? 'pi pi-spinner pi-spin' : 'pi pi-sitemap'"></i>
                {{ generatingMatches ? 'Đang tạo...' : 'Tạo sơ đồ thi đấu' }}
              </button>
              
              <template v-else>
                <button type="button" class="secondary-button" @click="localMatches = []">
                  <i class="pi pi-refresh mr-1"></i> Làm lại
                </button>
                <button 
                  type="button" 
                  class="primary-button save-bracket-btn" 
                  @click="handleSaveBracket"
                  :disabled="savingBracket"
                >
                  <i :class="savingBracket ? 'pi pi-spinner pi-spin' : 'pi pi-save'"></i>
                  Xác nhận & Lưu lịch thi đấu
                </button>
              </template>
            </template>
          </div>
        </div>

        <!-- Seeding UI -->
        <div v-if="showSeeding" class="seeding-container mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="m-0"><i class="pi pi-sort-alt mr-2 text-blue-400"></i>Sắp xếp hạt giống</h3>
            <button class="icon-btn-small" @click="showSeeding = false"><i class="pi pi-times"></i></button>
          </div>
          <p class="text-sm text-white/50 mb-4 italic">Kéo thả để thay đổi thứ tự. Các cặp đấu sẽ được ghép theo thứ tự từ trên xuống dưới (1 vs 2, 3 vs 4...).</p>
          
          <draggable 
            v-model="localOrderedTeams" 
            item-key="id"
            class="seeding-list"
            handle=".drag-handle"
          >
            <template #item="{ element, index }">
              <div class="seed-item">
                <span class="seed-num">{{ index + 1 }}</span>
                <div class="seed-content">
                  <img v-if="element.logo_url" :src="element.logo_url" class="seed-logo" />
                  <span class="seed-name">{{ element.name }}</span>
                </div>
                <i class="pi pi-bars drag-handle"></i>
              </div>
            </template>
          </draggable>
        </div>

        <div v-if="filteredMatches.length > 0" class="matches-list">
          <div class="matches-grid">
            <div v-for="match in filteredMatches" :key="match.id || match.originalIdx" class="match-item">
              <div class="match-header">
                <span v-if="match.group_name || match.group?.name" class="group-badge">
                  {{ match.group_name || match.group?.name }}
                </span>
                <span v-else class="round-badge" :class="getRoundClass(match)">{{ getMatchLabel(match) }}</span>
                
                <div class="match-meta">
                  <span class="meta-item"><i class="pi pi-calendar"></i>{{ formatDate(match.match_date) }}</span>
                  <span class="meta-item"><i class="pi pi-clock"></i>{{ match.match_time }}</span>
                </div>
              </div>

              <div class="match-pairing">
                <!-- Home Side -->
                <div v-if="localMatches.length" :data-m-idx="match.originalIdx" data-side="home" class="team-side-wrapper home">
                  <draggable 
                    :model-value="match.home_club ? [match.home_club] : []" 
                    group="tournament-teams"
                    item-key="id"
                    @add="(e) => handleSwap(e, match.originalIdx, 'home')"
                    class="team-side-draggable"
                  >
                    <template #item="{ element }">
                      <div class="team-side active">
                        <div class="team-avatar">
                          <img v-if="element.logo_url" :src="element.logo_url" />
                          <i v-else :class="tournament?.participant_type === 'individual' ? 'pi pi-user' : 'pi pi-shield'"></i>
                        </div>
                        <span class="club-name">{{ element.name }}</span>
                      </div>
                    </template>
                    <template #footer v-if="!match.home_club">
                      <div class="team-side empty">
                        <div class="team-avatar"><i class="pi pi-plus"></i></div>
                        <span class="club-name placeholder">{{ match.home_source || 'TBD' }}</span>
                      </div>
                    </template>
                  </draggable>
                </div>
                <div v-else class="team-side home">
                  <div class="team-avatar">
                    <img v-if="match.home_club?.logo_url" :src="match.home_club.logo_url" />
                    <i v-else :class="tournament?.participant_type === 'individual' ? 'pi pi-user' : 'pi pi-shield'"></i>
                  </div>
                  <span class="club-name placeholder">{{ match.home_club?.name || match.home_source || 'TBD' }}</span>
                </div>
                
                <!-- Center: Score or VS -->
                <div class="match-center">
                  <div v-if="match.home_score !== null && match.away_score !== null && (match.home_club_id && match.away_club_id || match.home_user_id && match.away_user_id)" class="score-display">
                    <span class="score">{{ match.home_score }} - {{ match.away_score }}</span>
                    <span v-if="match.status === 'completed'" class="ft-tag">FT</span>
                  </div>
                  <div v-else-if="!(match.home_club_id && match.away_club_id || match.home_user_id && match.away_user_id) && !localMatches.length" class="bye-display">
                    <span class="bye-tag">MIỄN ĐẤU</span>
                  </div>
                  <div v-else class="vs-display">
                    <span class="vs-text">VS</span>
                  </div>
                </div>

                <!-- Away Side -->
                <div v-if="localMatches.length" :data-m-idx="match.originalIdx" data-side="away" class="team-side-wrapper away">
                  <draggable 
                    :model-value="match.away_club ? [match.away_club] : []" 
                    group="tournament-teams"
                    item-key="id"
                    @add="(e) => handleSwap(e, match.originalIdx, 'away')"
                    class="team-side-draggable"
                  >
                    <template #item="{ element }">
                      <div class="team-side active">
                        <span class="club-name">{{ element.name }}</span>
                        <div class="team-avatar">
                          <img v-if="element.logo_url" :src="element.logo_url" />
                          <i v-else :class="tournament?.participant_type === 'individual' ? 'pi pi-user' : 'pi pi-shield'"></i>
                        </div>
                      </div>
                    </template>
                    <template #footer v-if="!match.away_club">
                      <div class="team-side empty">
                        <span class="club-name placeholder">{{ match.away_source || 'TBD' }}</span>
                        <div class="team-avatar"><i class="pi pi-plus"></i></div>
                      </div>
                    </template>
                  </draggable>
                </div>
                <div v-else class="team-side away">
                  <span class="club-name placeholder">{{ match.away_club?.name || match.away_source || 'TBD' }}</span>
                  <div class="team-avatar">
                    <img v-if="match.away_club?.logo_url" :src="match.away_club.logo_url" />
                    <i v-else :class="tournament?.participant_type === 'individual' ? 'pi pi-user' : 'pi pi-shield'"></i>
                  </div>
                </div>
              </div>

              <div class="match-footer">
                <div class="footer-left">
                  <i class="pi pi-map-marker"></i>
                  <span class="venue-name">{{ match.venue?.name || 'Chưa chọn sân' }}</span>
                </div>
                <div class="footer-right">
                  <span v-if="match.referee_id" class="ref-badge">
                    <i class="pi pi-user-edit mr-1"></i>
                    {{ match.referee?.full_name || 'Đã gán' }}
                  </span>
                  <button 
                    v-if="!readOnly && match.id" 
                    type="button" 
                    class="ref-btn" 
                    @click="openRefereeModal(match)"
                    title="Gán trọng tài"
                  >
                    <i class="pi pi-cog"></i>
                  </button>
                </div>
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
                <img v-if="tournament?.participant_type === 'individual' ? reg.user?.avatar_url : reg.club?.logo_url" 
                     :src="tournament?.participant_type === 'individual' ? reg.user?.avatar_url : reg.club?.logo_url" 
                     :alt="tournament?.participant_type === 'individual' ? reg.user?.full_name : reg.club?.name">
                <i v-else :class="tournament?.participant_type === 'individual' ? 'pi pi-user' : 'pi pi-shield'"></i>
              </div>
              <div class="club-details">
                <h3>{{ tournament?.participant_type === 'individual' ? reg.user?.full_name : reg.club?.name }}</h3>
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

      <!-- Referee Assignment Modal -->
      <Dialog v-model:visible="showRefereeModal" header="Phân công trọng tài" :modal="true" :style="{ width: '450px' }" class="custom-admin-dialog">
        <div class="flex flex-column gap-3 py-2">
          <div v-if="refereesLoading" class="flex justify-center p-4">
            <i class="pi pi-spinner pi-spin"></i>
          </div>
          <div v-else-if="availableReferees.length === 0" class="text-center p-4 text-white/50">
            Không tìm thấy trọng tài nào khả dụng
          </div>
          <div v-else v-for="ref in availableReferees" :key="ref.id" 
               class="referee-select-item"
               :class="{'selected': selectedRefereeId === ref.id}"
               @click="selectedRefereeId = ref.id">
            <div class="referee-avatar-modal">
              <img v-if="ref.avatarUrl" :src="ref.avatarUrl" :alt="ref.fullName" class="ref-logo-img" />
              <span v-else>{{ getInitials(ref.fullName) }}</span>
            </div>
            <div class="referee-select-info">
              <span class="referee-select-name">{{ ref.fullName }}</span>
              <span class="referee-select-email">{{ ref.email }}</span>
            </div>
            <div v-if="selectedRefereeId === ref.id" class="selected-check">
              <i class="pi pi-check-circle"></i>
            </div>
          </div>
        </div>
        <template #footer>
          <button class="secondary-button" @click="showRefereeModal = false">Hủy</button>
          <button class="primary-button" @click="assignReferee" :disabled="!selectedRefereeId || assigningReferee">
            <i v-if="assigningReferee" class="pi pi-spinner pi-spin mr-2"></i>
            Xác nhận
          </button>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import { supabase } from '../../config/supabase.js';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import draggable from 'vuedraggable';
import { userRepository } from '../../repositories/UserRepository.js';
import { matchRepository } from '../../repositories/MatchRepository.js';
import {
  fetchAdminTournament,
  updateTournamentForAdmin,
  approveTournamentRegistration,
  rejectTournamentRegistration,
  startTournament,
  buildKnockoutBracket
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
const localMatches = ref([]);
const showSeeding = ref(false);
const localOrderedTeams = ref([]);
const savingBracket = ref(false);
const tournamentStore = useTournamentStore();

// Referee Assignment
const showRefereeModal = ref(false);
const refereesLoading = ref(false);
const assigningReferee = ref(false);
const availableReferees = ref([]);
const selectedRefereeId = ref(null);
const activeMatch = ref(null);

const getInitials = (name) => {
  if (!name) return 'A';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const openRefereeModal = async (match) => {
  activeMatch.value = match;
  selectedRefereeId.value = match.referee_id;
  showRefereeModal.value = true;
  
  if (availableReferees.value.length === 0) {
    refereesLoading.value = true;
    try {
      const result = await userRepository.findByRole('referee');
      if (result.isOk()) {
        availableReferees.value = result.getValue().filter(r => r.status === 'active');
      }
    } catch (err) {
      console.error('Error fetching referees:', err);
    } finally {
      refereesLoading.value = false;
    }
  }
};

const assignReferee = async () => {
  if (!activeMatch.value || !selectedRefereeId.value) return;
  
  assigningReferee.value = true;
  try {
    const result = await matchRepository.update({
      id: activeMatch.value.id,
      referee_id: selectedRefereeId.value
    });
    
    if (result.isOk()) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã phân công trọng tài', life: 3000 });
      showRefereeModal.value = false;
      // Refresh match data
      await loadTournament();
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: result.getError() || 'Phân công thất bại', life: 3000 });
    }
  } catch (err) {
    console.error('Error assigning referee:', err);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra', life: 3000 });
  } finally {
    assigningReferee.value = false;
  }
};

const approvedTeams = computed(() => {
  return (tournament.value?.registrations || [])
    .filter(r => r.status === 'approved')
    .map(r => {
      if (tournament.value.participant_type === 'individual') {
        return {
          id: r.user?.id,
          name: r.user?.full_name,
          logo_url: r.user?.avatar_url
        };
      }
      return r.club;
    })
    .filter(team => team && team.id);
});

const filteredMatches = computed(() => {
  const list = localMatches.value.length ? localMatches.value : matches.value;
  return list.map((m, originalIdx) => ({ ...m, originalIdx }));
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
        home_user:profiles!matches_home_user_id_fkey(id, full_name, avatar_url),
        away_user:profiles!matches_away_user_id_fkey(id, full_name, avatar_url),
        venue:venues(id, name)
      `)
      .eq('tournament_id', route.params.id)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true });

    if (!matchError) {
      matches.value = (matchData || []).map(m => {
        if (tournament.value?.participant_type === 'individual') {
           m.home_club = m.home_user ? { id: m.home_user.id, name: m.home_user.full_name, logo_url: m.home_user.avatar_url } : null;
           m.away_club = m.away_user ? { id: m.away_user.id, name: m.away_user.full_name, logo_url: m.away_user.avatar_url } : null;
        }
        return m;
      });
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

async function handlePreviewBracket() {
  if (!tournament.value) return;
  generatingMatches.value = true;
  
  try {
    const teams = showSeeding.value ? localOrderedTeams.value : approvedTeams.value;
    const startDate = form.startDate || tournament.value.start_date;
    const matchTimes = [form.startTime, form.endTime];
    
    let venueIds = [];
    if (form.venueId) {
      venueIds = [form.venueId];
    } else {
      const sportVenues = venues.value.filter(v => v.sport_category_id === tournament.value.sport_category_id);
      if (sportVenues.length > 0) venueIds = [sportVenues[0].id];
    }

    const bracket = buildKnockoutBracket(tournament.value.id, teams, venues.value, startDate, matchTimes, tournament.value.participant_type);
    localMatches.value = bracket;
    showSeeding.value = false;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: error.message, life: 5000 });
  } finally {
    generatingMatches.value = false;
  }
}

function handleSwap(evt, toIdx, toSide) {
  const fromEl = evt.from.closest('.team-side-wrapper');
  if (!fromEl) return;
  
  const fromIdx = parseInt(fromEl.dataset.mIdx);
  const fromSide = fromEl.dataset.side;
  
  if (isNaN(fromIdx)) return;

  const matchFrom = localMatches.value[fromIdx];
  const matchTo = localMatches.value[toIdx];

  // Get team objects
  const teamFrom = fromSide === 'home' ? matchFrom.home_club : matchFrom.away_club;
  const teamTo = toSide === 'home' ? matchTo.home_club : matchTo.away_club;

  // Swap IDs and Objects in localMatches
  if (fromSide === 'home') {
    matchFrom.home_club = teamTo;
    matchFrom.home_club_id = teamTo ? teamTo.id : null;
    if (tournament.value?.participant_type === 'individual') matchFrom.home_user_id = teamTo ? teamTo.id : null;
  } else {
    matchFrom.away_club = teamTo;
    matchFrom.away_club_id = teamTo ? teamTo.id : null;
    if (tournament.value?.participant_type === 'individual') matchFrom.away_user_id = teamTo ? teamTo.id : null;
  }

  if (toSide === 'home') {
    matchTo.home_club = teamFrom;
    matchTo.home_club_id = teamFrom ? teamFrom.id : null;
    if (tournament.value?.participant_type === 'individual') matchTo.home_user_id = teamFrom ? teamFrom.id : null;
  } else {
    matchTo.away_club = teamFrom;
    matchTo.away_club_id = teamFrom ? teamFrom.id : null;
    if (tournament.value?.participant_type === 'individual') matchTo.away_user_id = teamFrom ? teamFrom.id : null;
  }
}

async function handleSaveBracket() {
  confirmService.require({
    message: 'Xác nhận lưu sơ đồ và bắt đầu giải đấu? Hành động này sẽ tạo lịch thi đấu chính thức.',
    header: 'Xác nhận lưu',
    icon: 'pi pi-save',
    accept: async () => {
      savingBracket.value = true;
      try {
        // We need a modified startTournament that accepts pre-built matches
        const { startTournamentWithMatches } = await import('../../features/tournaments/adminTournamentManagement.js');
        const result = await startTournamentWithMatches(tournament.value.id, localMatches.value);
        if (result.success) {
          toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu lịch thi đấu.', life: 3000 });
          localMatches.value = [];
          await loadTournament();
        } else {
          toast.add({ severity: 'error', summary: 'Lỗi', detail: result.error, life: 5000 });
        }
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: error.message, life: 5000 });
      } finally {
        savingBracket.value = false;
      }
    }
  });
}

const getMatchLabel = (match) => {
  if (match.match_type === 'third_place' || match.matchType === 'third_place') return 'Tranh hạng 3';
  
  // Calculate labels based on total rounds for consistency (exclude 3rd place round)
  const allMatchRounds = (localMatches.value.length ? localMatches.value : matches.value)
    .filter(m => m.match_type !== 'third_place' && m.matchType !== 'third_place')
    .map(m => m.round || 1);
  const maxR = Math.max(...allMatchRounds, 0);
  const currentR = match.round || 1;
  const fromEnd = maxR - currentR + 1;

  if (fromEnd === 1) return 'Chung kết';
  if (fromEnd === 2) return 'Bán kết';
  if (fromEnd === 3) return 'Tứ kết';
  return 'Vòng loại';
};

const getRoundClass = (match) => {
  const type = match.match_type || match.matchType;
  if (type === 'final') return 'round-final';
  if (type === 'semifinal') return 'round-semi';
  if (type === 'quarterfinal') return 'round-quarter';
  if (type === 'third_place') return 'round-third';
  return 'round-prelim';
};

async function handleSubmit() {
  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  const result = await updateTournamentForAdmin(
    route.params.id,
    form,
    tournament.value?.approved_count || 0
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
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}

.match-item {
  position: relative;
  padding: 20px;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.match-item:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.1);
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.match-meta {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: rgba(165, 180, 252, 0.8);
  font-weight: 600;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item i {
  font-size: 0.8rem;
  color: #6366f1;
}

.group-badge,
.round-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.match-pairing {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
}

.team-side {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.team-side.home {
  justify-content: flex-start;
}

.team-side.away {
  justify-content: flex-end;
  text-align: right;
}

.team-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.team-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 2px;
}

.team-avatar i {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.4);
}

.club-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-name.placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.match-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-display .score {
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  background: rgba(99, 102, 241, 0.15);
  padding: 4px 16px;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}

.ft-tag {
  font-size: 0.6rem;
  font-weight: 900;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.vs-display {
  background: rgba(244, 63, 94, 0.1);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid rgba(244, 63, 94, 0.2);
}

.vs-text {
  font-size: 0.8rem;
  font-weight: 900;
  color: #f43f5e;
}

.bye-tag {
  font-size: 0.65rem;
  font-weight: 900;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.match-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.7);
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.venue-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-matches {
  padding: 48px;
  text-align: center;
  background: rgba(30, 41, 59, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  color: rgba(148, 163, 184, 0.6);
  font-style: italic;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.round-badge.round-final {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.round-badge.round-semi {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.round-badge.round-quarter {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.round-badge.round-prelim {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.round-badge.round-third {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.seeding-container {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.seeding-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.seed-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: grab;
}

.seed-item:active { cursor: grabbing; }

.seed-num {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  color: #6366f1;
  width: 20px;
}

.seed-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.seed-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.seed-name {
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-handle {
  color: rgba(255, 255, 255, 0.2);
}

.team-side-wrapper {
  flex: 1;
  min-width: 0;
}

.team-side.active {
  cursor: grab;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 12px;
}

.team-side.active:hover {
  background: rgba(255, 255, 255, 0.05);
}

.team-side.active:active { cursor: grabbing; }

.team-side.empty {
  opacity: 0.4;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 4px 8px;
}

.save-bracket-btn {
  background: linear-gradient(135deg, #059669, #10b981);
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
  flex: 1;
  min-width: 0;
}

.reg-status {
  margin: 0 12px;
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

.club-details {
  flex: 1;
  min-width: 0;
}

.club-details h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reg-date {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
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

.team-side {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.team-side.home {
  justify-content: flex-start;
}

.team-side.away {
  justify-content: flex-end;
  text-align: right;
}
.match-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ref-badge {
  font-size: 0.75rem;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.ref-btn {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.ref-btn:hover {
  background: #8b5cf6;
  color: white;
  transform: scale(1.1);
}

/* Modal Styling */
.referee-select-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
}

.referee-select-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.referee-select-item.selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.4);
}

.referee-avatar-modal {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  overflow: hidden;
}

.ref-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.referee-select-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.referee-select-name {
  color: white;
  font-weight: 700;
}

.referee-select-email {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
}

.selected-check {
  color: #60a5fa;
  font-size: 1.2rem;
}
</style>
