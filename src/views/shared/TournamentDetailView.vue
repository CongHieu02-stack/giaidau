<template>
  <div class="tournament-detail-page">
    <ConfirmDialog />
    <div class="min-h-screen py-6 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <i class="pi pi-spinner pi-spin text-4xl text-white/60"></i>
      </div>

      <!-- Tournament Info -->
      <div v-else-if="tournament" class="space-y-4">
        <!-- Header Card -->
        <div class="header-card">
          <div class="header-content">
            <!-- Icon -->
            <div class="tournament-icon">
              {{ tournament.sportCategory?.icon_emoji || tournament.sportCategory?.icon_url || '🏆' }}
            </div>

            <!-- Title & Info -->
            <div class="header-info">
              <div class="title-row">
                <h1 class="tournament-title">{{ tournament.name }}</h1>
                <span class="status-badge" :class="statusClass">{{ statusText }}</span>
              </div>
              
              <p class="sport-name">{{ tournament.sportCategory?.name || 'Thể thao' }}</p>

              <!-- Meta Info -->
              <div class="meta-row">
                <div class="meta-item">
                  <i class="pi pi-calendar meta-icon"></i>
                  <span>{{ formatDate(tournament.startDate) }} - {{ formatDate(tournament.endDate) }}</span>
                </div>
                <div class="meta-item">
                  <i class="pi pi-users meta-icon"></i>
                  <span>{{ approvedRegistrations.length }}/{{ tournament.maxTeams }} {{ tournament.participantType === 'individual' ? 'vận động viên' : 'đội' }}</span>
                </div>
                <div class="meta-item">
                  <i class="pi pi-clock meta-icon"></i>
                  <span>Hạn đăng ký: {{ formatDate(tournament.registrationDeadline) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Layout: 2 columns on desktop -->
        <div class="main-layout">
          <!-- Left Column (Main Content) -->
          <div class="left-column">
            <!-- Description -->
            <div class="section-card">
              <h2 class="section-title">
                <i class="pi pi-info-circle section-icon blue"></i>
                Giới thiệu
              </h2>
              <p class="section-content">{{ tournament.description || 'Chưa có mô tả' }}</p>
            </div>

            <!-- Rules -->
            <div class="section-card">
              <h2 class="section-title">
                <i class="pi pi-book section-icon green"></i>
                Thể lệ giải đấu
              </h2>
              <div class="rules-box">
                <p class="section-content">{{ tournament.rules || 'Chưa có thể lệ' }}</p>
              </div>
            </div>

            <!-- Schedule -->
            <div class="section-card">
              <h2 class="section-title">
                <i class="pi pi-calendar section-icon orange"></i>
                Lịch thi đấu
                <span class="match-count" v-if="tournament.matches && tournament.matches.length > 0">{{ tournament.matches.length }} trận</span>
              </h2>
              <div v-if="tournament.matches && tournament.matches.length > 0" class="schedule-list">
                <div v-for="match in tournament.matches" :key="match.id" class="match-row">
                  <div class="match-main-info">
                    <div class="match-teams">
                      <div class="team home">{{ match.home_club?.name || 'TBD' }}</div>
                      <div class="vs">VS</div>
                      <div class="team away">{{ match.away_club?.name || 'TBD' }}</div>
                    </div>
                    
                    <div class="match-meta">
                      <div class="match-meta-info">
                        <span class="info-item"><i class="pi pi-calendar"></i> {{ formatDate(match.match_date) }}</span>
                        <span class="info-item" v-if="match.match_time"><i class="pi pi-clock"></i> {{ match.match_time }}</span>
                        <span class="info-item" v-if="match.venue?.name"><i class="pi pi-map-marker"></i> {{ match.venue.name }}</span>
                      </div>
                      <div class="match-referee" :class="{'no-ref': !match.referee}">
                        <i class="pi pi-flag"></i> 
                        {{ match.referee?.full_name || 'Chưa có trọng tài' }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="match-actions-area">
                    <div class="match-score-area">
                      <div class="match-score" v-if="match.home_score !== null && match.away_score !== null">
                        <span class="score">{{ match.home_score }} - {{ match.away_score }}</span>
                      </div>
                      <span v-if="match.status === 'completed'" class="fulltime-badge">Full-time</span>
                    </div>

                    <div v-if="canManage" class="match-admin-actions">
                      <button v-if="match.status !== 'completed'" class="icon-btn-small" @click="openRefereeModal(match)" title="Phân công trọng tài">
                        <i class="pi pi-user-edit"></i>
                      </button>
                      <RouterLink v-if="match.referee" :to="`/referee/matches/${match.id}`" class="icon-btn-small primary" title="Điều khiển trận đấu">
                        <i class="pi pi-play"></i>
                      </RouterLink>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-schedule">
                <i class="pi pi-calendar"></i>
                <p>Lịch thi đấu sẽ được cập nhật sau khi đóng đăng ký</p>
                <p class="sub-text">(Cần ít nhất {{ tournament.minTeams }} đội để bắt đầu)</p>
              </div>
            </div>

            <!-- Registered Teams / Standings -->
            <div class="section-card">
              <div class="flex justify-between items-center mb-6">
                <h2 class="section-title mb-0">
                  <i class="pi pi-chart-bar section-icon purple"></i>
                  Bảng xếp hạng
                </h2>
                <div v-if="tournament.status === 'registration_open'" class="team-count">
                  {{ approvedRegistrations.length }}/{{ tournament.maxTeams }} đội
                </div>
              </div>

              <div v-if="tournament.status === 'ongoing' || tournament.status === 'completed'">
                <TournamentStandings :tournament="tournament" :loading="loading" />
              </div>
              
              <div v-else-if="approvedRegistrations.length > 0" class="teams-list">
                <div v-for="reg in approvedRegistrations" :key="reg.id" class="team-row">
                  <div class="team-avatar-small">
                    <img v-if="tournament.participantType === 'individual' ? reg.user?.avatar_url : reg.club?.logo_url" 
                         :src="tournament.participantType === 'individual' ? reg.user?.avatar_url : reg.club?.logo_url" 
                         :alt="tournament.participantType === 'individual' ? reg.user?.full_name : reg.club?.name" 
                         class="w-full h-full object-cover">
                    <span v-else>{{ getInitials(tournament.participantType === 'individual' ? reg.user?.full_name : reg.club?.name) }}</span>
                  </div>
                  <span class="team-name">{{ tournament.participantType === 'individual' ? reg.user?.full_name : reg.club?.name }}</span>
                </div>
              </div>
              <div v-else class="empty-teams">
                <i class="pi pi-users"></i>
                <p>Chưa có câu lạc bộ nào tham gia</p>
              </div>
            </div>

            <!-- Admin: Pending Registrations -->
            <div v-if="canManage && pendingRegistrations.length > 0" class="section-card admin-section">
              <h2 class="section-title">
                <i class="pi pi-clock section-icon yellow"></i>
                Đăng ký chờ duyệt
                <span class="team-count yellow">{{ pendingRegistrations.length }}</span>
              </h2>
              <div class="teams-list">
                <div v-for="reg in pendingRegistrations" :key="reg.id" class="team-row pending">
                  <div class="team-avatar-small">
                    <img v-if="tournament.participantType === 'individual' ? reg.user?.avatar_url : reg.club?.logo_url" 
                         :src="tournament.participantType === 'individual' ? reg.user?.avatar_url : reg.club?.logo_url" 
                         :alt="tournament.participantType === 'individual' ? reg.user?.full_name : reg.club?.name" 
                         class="w-full h-full object-cover">
                    <span v-else>{{ getInitials(tournament.participantType === 'individual' ? reg.user?.full_name : reg.club?.name) }}</span>
                  </div>
                  <div class="flex-1">
                    <span class="team-name">{{ tournament.participantType === 'individual' ? reg.user?.full_name : reg.club?.name }}</span>
                    <p class="text-xs text-white/40">Gửi lúc: {{ formatDate(reg.registered_at) }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button class="icon-btn-small success" @click="handleApprove(reg.id)" title="Duyệt">
                      <i class="pi pi-check"></i>
                    </button>
                    <button class="icon-btn-small danger" @click="handleReject(reg.id)" title="Từ chối">
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="mt-4">
                <RouterLink :to="adminEditPath" class="text-sm text-blue-400 hover:underline">
                  <i class="pi pi-external-link mr-1"></i>
                  Quản lý tất cả đăng ký trong Dashboard
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Right Column (Sidebar) -->
          <div class="right-column">
            <!-- Actions -->
            <div class="section-card" v-if="canRegister">
              <button class="btn-join" @click="handleRegister" :disabled="registering">
                <i :class="registering ? 'pi pi-spinner pi-spin' : 'pi pi-sign-in'"></i>
                {{ registering ? 'Đang xử lý...' : 'Đăng ký tham gia' }}
              </button>
            </div>

            <!-- Admin Start Action -->
            <div class="section-card" v-if="canStartTournament">
              <button class="btn-start-tournament" @click="handleStartTournament" :disabled="loading">
                <i class="pi pi-play"></i>
                Bắt đầu giải đấu
              </button>
              <p class="text-[10px] text-center text-white/40 mt-2 italic">
                (Đã đủ số lượng đội tối thiểu để bắt đầu)
              </p>
            </div>

            <!-- Registration Modal -->
            <Dialog v-model:visible="showRegModal" :header="`Đăng ký tham gia: ${tournament?.name}`" :modal="true" :style="{ width: '500px' }" class="custom-tournament-dialog">
              <div class="flex flex-column gap-4 py-2">
                <section>
                  <h4 class="text-sm font-semibold mb-2 text-white/70">1. Chọn Câu lạc bộ</h4>
                  <div class="flex flex-column gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    <div v-for="club in unregisteredClubs" :key="club.id" 
                         class="club-select-item"
                         :class="{'selected': selectedClubId === club.id, 'pending-club': club.status !== 'approved'}"
                         @click="handleClubSelect(club.id)">
                      <div class="club-avatar-modal">
                        <img v-if="club.logoUrl" :src="club.logoUrl" :alt="club.name" class="club-logo-img" />
                        <span v-else>{{ getInitials(club.name) }}</span>
                      </div>
                      <div class="club-select-info">
                        <div class="flex align-items-center gap-2">
                          <span class="club-select-name">{{ club.name }}</span>
                          <span v-if="club.status !== 'approved'" class="pending-badge">Chờ duyệt</span>
                        </div>
                        <span class="club-select-leader" v-if="club.leaderName">
                          <i class="pi pi-user text-[10px]"></i> {{ club.leaderName }}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section v-if="selectedClubId && tournament?.maxPlayersPerMatch > 0">
                  <div class="flex justify-between items-center mb-2">
                    <h4 class="text-sm font-semibold text-white/70">2. Chọn vận động viên</h4>
                    <span class="text-xs font-bold px-2 py-1 rounded" :class="regStore.isReadyToSubmit ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'">
                      Đã chọn {{ regStore.selectedCount }}/{{ tournament.maxPlayersPerMatch }}
                    </span>
                  </div>
                  
                  <div v-if="clubMembersLoading" class="flex justify-center p-4">
                    <i class="pi pi-spinner pi-spin text-xl"></i>
                  </div>
                  <div v-else-if="availableMembers.length === 0" class="text-center p-4 text-white/40 text-sm">
                    Câu lạc bộ chưa có thành viên nào được duyệt
                  </div>
                  <div v-else class="member-selection-list max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    <div v-for="member in availableMembers" :key="member.user_id" 
                         class="member-item"
                         :class="{'selected': regStore.isSelected(member.user_id), 'disabled': regStore.isLimitReached && !regStore.isSelected(member.user_id)}"
                         @click="regStore.togglePlayer(member.user_id)">
                      <div class="member-checkbox">
                        <i :class="regStore.isSelected(member.user_id) ? 'pi pi-check-circle text-blue-400' : 'pi pi-circle'"></i>
                      </div>
                      <div class="member-avatar">
                        <img v-if="member.profile?.avatar_url" :src="member.profile.avatar_url" class="w-full h-full object-cover rounded-full" />
                        <div v-else class="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-xs">
                          {{ getInitials(member.profile?.full_name) }}
                        </div>
                      </div>
                      <div class="member-info">
                        <p class="member-name">{{ member.profile?.full_name }}</p>
                        <p class="member-email text-xs text-white/40">{{ member.profile?.email }}</p>
                      </div>
                    </div>
                  </div>
                  <p v-if="regStore.isLimitReached" class="text-[10px] text-yellow-500/70 mt-2 text-center italic">
                    Đã đạt số lượng tối đa. Bỏ chọn để thay đổi.
                  </p>
                </section>
              </div>
              <template #footer>
                <button class="action-btn secondary" @click="showRegModal = false" :disabled="registering">Hủy</button>
                <button class="btn-join" 
                        @click="submitRegistration(selectedClubId)" 
                        :disabled="!selectedClubId || registering || (tournament?.maxPlayersPerMatch > 0 && !regStore.isReadyToSubmit)"
                        :class="{'opacity-50 grayscale cursor-not-allowed': tournament?.maxPlayersPerMatch > 0 && !regStore.isReadyToSubmit}">
                  Xác nhận đăng ký
                </button>
              </template>
            </Dialog>

            <!-- Referee Assignment Modal -->
            <Dialog v-model:visible="showRefereeModal" header="Phân công trọng tài" :modal="true" :style="{ width: '450px' }" class="custom-tournament-dialog">
              <div class="flex flex-column gap-3 py-2">
                <div v-if="refereesLoading" class="flex justify-center p-4">
                  <i class="pi pi-spinner pi-spin"></i>
                </div>
                <div v-else-if="availableReferees.length === 0" class="text-center p-4 text-white/50">
                  Không tìm thấy trọng tài nào khả dụng
                </div>
                <div v-else v-for="ref in availableReferees" :key="ref.id" 
                     class="club-select-item"
                     :class="{'selected': selectedRefereeId === ref.id}"
                     @click="selectedRefereeId = ref.id">
                  <div class="club-avatar-modal">
                    <img v-if="ref.avatarUrl" :src="ref.avatarUrl" :alt="ref.fullName" class="club-logo-img" />
                    <span v-else>{{ getInitials(ref.fullName) }}</span>
                  </div>
                  <div class="club-select-info">
                    <span class="club-select-name">{{ ref.fullName }}</span>
                    <span class="club-select-leader">{{ ref.email }}</span>
                    <span class="club-select-status" v-if="selectedRefereeId === ref.id">
                      <i class="pi pi-check-circle"></i> Đã chọn
                    </span>
                  </div>
                </div>
              </div>
              <template #footer>
                <button class="action-btn secondary" @click="showRefereeModal = false">Hủy</button>
                <button class="btn-join" @click="assignReferee" :disabled="!selectedRefereeId || assigningReferee">
                  <i v-if="assigningReferee" class="pi pi-spinner pi-spin mr-2"></i>
                  Xác nhận phân công
                </button>
              </template>
            </Dialog>



            <!-- Admin Actions -->
            <div v-if="canManage" class="section-card admin-actions-card mb-4">
              <h3 class="sidebar-title">
                <i class="pi pi-shield sidebar-icon red"></i>
                Quản trị giải đấu
              </h3>
              <div class="admin-buttons-grid">
                <RouterLink :to="adminEditPath" class="admin-action-btn primary">
                  <i class="pi pi-cog mr-2"></i> Quản lý & Thiết lập bảng
                </RouterLink>
                
                <div v-if="approvedRegistrations.length >= (tournament.minTeams || 2) && tournament.status === 'registration_open'" class="status-ready-badge">
                  <i class="pi pi-check-circle mr-1"></i> Đủ điều kiện bắt đầu
                </div>
                <div v-else-if="tournament.status === 'registration_open'" class="status-waiting-badge">
                  <i class="pi pi-info-circle mr-1"></i> Cần thêm {{ (tournament.minTeams || 2) - approvedRegistrations.length }} đội
                </div>
              </div>
            </div>

            <!-- Registration Status -->
            <div class="section-card">
              <h3 class="sidebar-title">
                <i class="pi pi-check-circle sidebar-icon green"></i>
                Trạng thái đăng ký
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">Đã duyệt</span>
                  <span class="info-val">{{ approvedRegistrations.length }} đội</span>
                </div>
                <div v-if="pendingRegistrations.length > 0" class="info-row">
                  <span class="info-label text-yellow-400">Chờ duyệt</span>
                  <span class="info-val text-yellow-400">{{ pendingRegistrations.length }} đội</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Còn trống</span>
                  <span class="info-val">{{ tournament.maxTeams - approvedRegistrations.length }} chỗ</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tối thiểu</span>
                  <span class="info-val">{{ tournament.minTeams }} đội</span>
                </div>
                <div class="info-row" v-if="tournament.maxPlayersPerMatch > 0">
                  <span class="info-label">VĐV mỗi đội</span>
                  <span class="info-val">{{ tournament.maxPlayersPerMatch }} người</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tối đa</span>
                  <span class="info-val">{{ tournament.maxTeams }} {{ tournament.participantType === 'individual' ? 'người' : 'đội' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Hạn đăng ký</span>
                  <span class="info-val">{{ formatDate(tournament.registrationDeadline) }}</span>
                </div>
              </div>
            </div>

            <!-- Tournament Timeline -->
            <div class="section-card">
              <h3 class="sidebar-title">
                <i class="pi pi-calendar sidebar-icon yellow"></i>
                Thời gian diễn ra
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">Bắt đầu</span>
                  <span class="info-val">{{ formatDate(tournament.startDate) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kết thúc</span>
                  <span class="info-val">{{ formatDate(tournament.endDate) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Hình thức</span>
                  <span class="info-val">{{ formatFormat(tournament.format) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Bộ môn</span>
                  <span class="info-val">{{ tournament.sportCategory?.name || 'Thể thao' }}</span>
                </div>
              </div>
            </div>

            <!-- Organizer -->
            <div class="section-card">
              <h3 class="sidebar-title">
                <i class="pi pi-user sidebar-icon"></i>
                Ban tổ chức
              </h3>
              <div class="organizer-row">
                <div class="organizer-avatar-small">{{ getInitials(tournament.creator?.full_name || 'A') }}</div>
                <div>
                  <p class="organizer-name">{{ tournament.creator?.full_name || 'Admin' }}</p>
                  <p class="organizer-role">Quản trị viên</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else class="not-found">
        <i class="pi pi-exclamation-circle not-found-icon"></i>
        <h2>Không tìm thấy giải đấu</h2>
        <p>Giải đấu này không tồn tại hoặc đã bị xóa</p>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';
import { useAuthStore } from '../../stores/auth.js';
import { useTournamentStore } from '../../stores/tournament.js';
import { useRegistrationStore } from '../../stores/registration.js';
import { formatDate } from '../../utils/helpers.js';
import { clubRepository } from '../../repositories/ClubRepository.js';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { userRepository } from '../../repositories/UserRepository.js';
import { matchRepository } from '../../repositories/MatchRepository.js';
import TournamentStandings from '../../components/tournaments/TournamentStandings.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const tournamentStore = useTournamentStore();
const regStore = useRegistrationStore();
const toast = useToast();
const confirmService = useConfirm();

const tournament = computed(() => tournamentStore.currentTournament);
const loading = ref(true);
const userClubs = ref([]);
const registering = ref(false);
const showRegModal = ref(false);
const selectedClubId = ref(null);
const selectedMatchId = ref(null);
const clubMembersLoading = ref(false);
const availableMembers = ref([]);

// Referee Assignment
const showRefereeModal = ref(false);
const refereesLoading = ref(false);
const assigningReferee = ref(false);
const availableReferees = ref([]);
const selectedRefereeId = ref(null);
const activeMatch = ref(null);

const statusClass = computed(() => {
  const classes = {
    'upcoming': 'status-upcoming',
    'registration_open': 'status-open',
    'registration_closed': 'status-closed',
    'ongoing': 'status-ongoing',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  };
  return classes[tournament.value?.status] || 'status-upcoming';
});

const statusText = computed(() => {
  const texts = {
    'upcoming': 'Sắp diễn ra',
    'registration_open': 'Đang mở đăng ký',
    'registration_closed': 'Đóng đăng ký',
    'ongoing': 'Đang diễn ra',
    'completed': 'Đã kết thúc',
    'cancelled': 'Đã hủy'
  };
  return texts[tournament.value?.status] || 'Không xác định';
});

const approvedRegistrations = computed(() => {
  return tournament.value?.registrations?.filter(r => r.status === 'approved') || [];
});

const pendingRegistrations = computed(() => {
  return tournament.value?.registrations?.filter(r => r.status === 'pending') || [];
});

const adminEditPath = computed(() => {
  if (!tournament.value) return '#';
  // Super admin uses /admin, Tournament admin uses /tournament-admin
  const prefix = authStore.isSuperAdmin ? '/admin' : '/tournament-admin';
  return `${prefix}/tournaments/${tournament.value.id}/edit`;
});

const canManage = computed(() => {
  if (!authStore.isAuthenticated || !tournament.value) return false;
  
  // Super Admin, Tournament Admin hoặc Người tạo giải đều có quyền quản lý
  return authStore.isSuperAdmin || authStore.isTournamentAdmin || (tournament.value.created_by === authStore.user?.id);
});

const unregisteredClubs = computed(() => {
  if (!tournament.value || !userClubs.value) return [];
  const registeredClubIds = tournament.value.registrations?.map(r => r.club_id) || [];
  return userClubs.value.filter(club => !registeredClubIds.includes(club.id));
});

const canRegister = computed(() => {
  // Show registration button if tournament is open and has space
  if (tournament.value?.status !== 'registration_open') return false;
  if (approvedRegistrations.value.length >= (tournament.value?.maxTeams || 0)) return false;
  
  // Don't show if user is the creator (they use admin controls)
  if (authStore.user?.id === tournament.value?.created_by) return false;
  
  return true;
});

const canStartTournament = computed(() => {
  return canManage.value && 
         tournament.value?.status === 'registration_open' && 
         approvedRegistrations.value.length >= (tournament.value?.minTeams || 2);
});

const handleStartTournament = async () => {
  confirmService.require({
    message: 'Bạn có chắc chắn muốn bắt đầu giải đấu? Sau khi bắt đầu, việc đăng ký sẽ được đóng lại và giải đấu sẽ chuyển sang trạng thái đang diễn ra.',
    header: 'Bắt đầu giải đấu',
    icon: 'pi pi-play',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        const result = await tournamentStore.updateTournamentStatus(tournament.value.id, 'ongoing', authStore.user.id);
        if (result.success) {
          toast.add({ severity: 'success', summary: 'Thành công', detail: 'Giải đấu đã bắt đầu!', life: 3000 });
          
          // Auto-generate schedule if round robin and matches are empty
          if (tournament.value.format === 'round_robin' && (!tournament.value.matches || tournament.value.matches.length === 0)) {
            toast.add({ severity: 'info', summary: 'Thông báo', detail: 'Đang tạo lịch thi đấu tự động...', life: 2000 });
            await tournamentStore.generateSchedule(tournament.value.id, [], authStore.user.id);
          }
        } else {
          toast.add({ severity: 'error', summary: 'Lỗi', detail: result.error || 'Không thể bắt đầu giải đấu', life: 3000 });
        }
      } catch (err) {
        console.error('Start Tournament Error:', err);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: `Có lỗi xảy ra: ${err.message}`, life: 5000 });
      }
    }
  });
};



const handleRegister = async () => {
  if (!authStore.isAuthenticated) {
    toast.add({ severity: 'info', summary: 'Thông báo', detail: 'Vui lòng đăng nhập để đăng ký tham gia', life: 3000 });
    router.push('/login');
    return;
  }

  if (tournament.value?.participantType === 'individual') {
    confirmService.require({
      message: `Bạn có muốn đăng ký tham gia giải đấu này với tư cách cá nhân không?`,
      header: 'Xác nhận đăng ký',
      icon: 'pi pi-user',
      accept: () => submitRegistration(null),
      reject: () => {}
    });
    return;
  }

  if (unregisteredClubs.value.length === 0) {
    let detail = '';
    if (userClubs.value.length > 0) {
      detail = 'Bạn đã đăng ký giải này rồi.';
    } else {
      detail = 'Giải đấu này yêu cầu đăng ký theo Câu lạc bộ. Bạn cần là Trưởng hoặc Phó câu lạc bộ để thực hiện đăng ký.';
    }
    toast.add({ severity: 'warn', summary: 'Thông báo', detail, life: 5000 });
    return;
  }

  if (unregisteredClubs.value.length === 1 && (tournament.value?.maxPlayersPerMatch || 0) === 0) {
    const club = unregisteredClubs.value[0];
    
    if (club.status !== 'approved') {
      toast.add({ severity: 'warn', summary: 'Thông báo', detail: `Câu lạc bộ "${club.name}" của bạn đang chờ duyệt. Bạn vẫn có thể gửi yêu cầu đăng ký tham gia giải.`, life: 5000 });
    }
    confirmService.require({
      message: `Bạn có muốn đăng ký câu lạc bộ "${club.name}" tham gia giải đấu này không?`,
      header: 'Xác nhận đăng ký',
      icon: 'pi pi-exclamation-triangle',
      accept: () => submitRegistration(club.id),
      reject: () => {}
    });
  } else {
    regStore.reset();
    regStore.setMaxPlayers(tournament.value.maxPlayersPerMatch || 0);
    showRegModal.value = true;
    
    // Auto-select if only one unregistered club
    if (unregisteredClubs.value.length === 1) {
      handleClubSelect(unregisteredClubs.value[0].id);
    }
  }
};

const handleClubSelect = async (clubId) => {
  if (selectedClubId.value === clubId) return;
  selectedClubId.value = clubId;
  regStore.selectedPlayerIds = [];
  
  if (tournament.value?.maxPlayersPerMatch > 0) {
    clubMembersLoading.value = true;
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('user_id, profile:profiles(id, full_name, email, avatar_url)')
        .eq('club_id', clubId)
        .eq('status', 'approved');
      
      if (error) throw error;
      availableMembers.value = data || [];
    } catch (err) {
      console.error('Error fetching club members:', err);
      toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách thành viên', life: 3000 });
    } finally {
      clubMembersLoading.value = false;
    }
  }
};

const submitRegistration = async (clubId) => {
  registering.value = true;
  try {
    const playerIds = tournament.value?.maxPlayersPerMatch > 0 ? regStore.selectedPlayerIds : [];
    const result = await tournamentStore.registerClub(tournament.value.id, clubId, authStore.user.id, playerIds);
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Gửi yêu cầu đăng ký tham gia thành công', life: 3000 });
      showRegModal.value = false;
      // Refresh tournament data
      await tournamentStore.fetchTournament(tournament.value.id);
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: result.error || 'Đăng ký thất bại', life: 3000 });
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi đăng ký', life: 3000 });
  } finally {
    registering.value = false;
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatFormat = (format) => {
  const formats = {
    'round_robin': 'Vòng tròn',
    'knockout': 'Loại trực tiếp',
    'hybrid': 'Kết hợp'
  };
  return formats[format] || format;
};

const handleApprove = (regId) => {
  confirmService.require({
    message: 'Bạn có chắc chắn muốn duyệt câu lạc bộ này tham gia giải đấu?',
    header: 'Xác nhận duyệt',
    icon: 'pi pi-check-circle',
    acceptClass: 'p-button-success',
    acceptLabel: 'Đồng ý',
    rejectLabel: 'Hủy',
    accept: () => {
      // Execute in background so dialog closes immediately
      processApprove(regId);
    }
  });
};

const processApprove = async (regId) => {
  try {
    const result = await tournamentStore.approveRegistration(tournament.value.id, regId, authStore.user.id);
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã duyệt', life: 1500 });
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: result.error || 'Duyệt thất bại', life: 3000 });
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra', life: 3000 });
  }
};

const handleReject = (regId) => {
  confirmService.require({
    message: 'Bạn có chắc chắn muốn từ chối câu lạc bộ này?',
    header: 'Xác nhận từ chối',
    icon: 'pi pi-times-circle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Từ chối',
    rejectLabel: 'Quay lại',
    accept: () => {
      const reason = prompt('Nhập lý do từ chối:');
      if (reason === null) return;
      if (!reason.trim()) {
        toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập lý do từ chối', life: 3000 });
        return;
      }
      processReject(regId, reason);
    }
  });
};

const processReject = async (regId, reason) => {
  try {
    const result = await tournamentStore.rejectRegistration(tournament.value.id, regId, reason, authStore.user.id);
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã từ chối', life: 1500 });
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: result.error || 'Từ chối thất bại', life: 3000 });
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra', life: 3000 });
  }
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
      // Refresh tournament data to show the new referee
      await tournamentStore.fetchTournament(tournament.value.id);
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

onMounted(async () => {
  const id = route.params.id;
  if (!id) {
    loading.value = false;
    return;
  }

  try {
    const isManager = authStore.isClubLeader || authStore.isClubDeputy || authStore.isClubAdmin || authStore.isAdmin;
    
    // Fetch tournament data and user clubs in parallel to reduce loading time
    const promises = [tournamentStore.fetchTournament(id)];
    
    if (authStore.user) {
      promises.push(clubRepository.findManagedBy(authStore.user.id));
    }
    
    const [tournamentResult, clubsResult] = await Promise.all(promises);
    
    if (!tournamentResult.success) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: tournamentResult.error || 'Không thể tải thông tin giải đấu', life: 3000 });
    }
    
    if (clubsResult) {
      if (clubsResult.isOk()) {
        userClubs.value = clubsResult.getValue();
      }
    }

    // Auto-trigger registration modal if param exists
    if (route.query.register === 'true' && canRegister.value) {
      handleRegister();
    }
  } catch (err) {
    console.error('Error loading tournament details:', err);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tải dữ liệu', life: 3000 });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ========== HEADER ========== */
.header-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.25rem;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.tournament-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.tournament-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.sport-name {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8125rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: rgba(255, 255, 255, 0.6);
}

.meta-icon {
  color: #60a5fa;
  font-size: 0.875rem;
}

/* Status colors */
.status-upcoming {
  background: rgba(229, 231, 235, 0.2);
  color: #e5e7eb;
  border: 1px solid rgba(229, 231, 235, 0.3);
}

.status-open {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-closed {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.status-ongoing {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* ========== MAIN LAYOUT ========== */
.main-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .main-layout {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ========== CARDS ========== */
.section-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.75rem 0;
}

.section-icon {
  font-size: 0.875rem;
}

.section-icon.blue {
  color: #60a5fa;
}

.section-icon.green {
  color: #4ade80;
}

.section-icon.purple {
  color: #a78bfa;
}

.section-icon.orange {
  color: #fb923c;
}

.section-content {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.rules-box {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

/* ========== SCHEDULE ========== */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.match-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.match-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.match-main-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
}

.match-teams {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 320px;
  flex-shrink: 0;
}

.match-teams .team {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-teams .team.home { text-align: right; }
.match-teams .team.away { text-align: left; }

.match-teams .vs {
  font-size: 0.7rem;
  font-weight: 800;
  color: #fb923c;
  padding: 0.2rem 0.5rem;
  background: rgba(251, 146, 60, 0.1);
  border: 1px solid rgba(251, 146, 60, 0.2);
  border-radius: 0.5rem;
  text-transform: uppercase;
}

.match-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding-left: 1.5rem;
}

.match-meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.info-item i {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
}

.match-referee {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fbbf24;
  padding: 0.25rem 0.75rem;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.15);
  border-radius: 2rem;
  width: fit-content;
}

.match-referee.no-ref {
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.03);
  border-color: transparent;
  font-style: italic;
  font-weight: 400;
}

.match-actions-area {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.match-score {
  display: flex;
  align-items: center;
}

.score {
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.4rem 1rem;
  border-radius: 0.75rem;
  min-width: 70px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.match-admin-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn-small {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.icon-btn-small:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
  transform: scale(1.05);
}

.icon-btn-small.primary {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #818cf8;
}

.icon-btn-small.primary:hover {
  background: #6366f1;
  color: white;
}

.empty-schedule {
  text-align: center;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
}

.empty-schedule i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

.empty-schedule .sub-text {
  font-size: 0.75rem;
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.3);
}

/* ========== TEAMS ========== */
.team-count,
.match-count {
  background: rgba(139, 92, 246, 0.3);
  color: #a78bfa;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
}

.match-count {
  background: rgba(251, 146, 60, 0.3);
  color: #fb923c;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
}

.team-avatar-small {
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.team-name {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.empty-teams {
  text-align: center;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
}

.empty-teams i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

/* ========== SIDEBAR ========== */
.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.75rem 0;
}

.sidebar-icon {
  font-size: 0.875rem;
  color: #60a5fa;
}

.sidebar-icon.yellow {
  color: #fbbf24;
}

.sidebar-icon.green {
  color: #4ade80;
}

/* Actions */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn + .action-btn {
  margin-top: 0.5rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* Reuse club join button style for tournament CTA to keep uniform look */
.btn-join { /* uses global .btn-join from src/style.css */ }

/* Organizer */
.organizer-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.organizer-avatar-small {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.organizer-name {
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  margin: 0;
}

.organizer-role {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  margin: 0;
}

/* Player Selection */
.member-selection-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.member-item:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.member-item.selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.member-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.member-checkbox {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.2);
}

.member-avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.member-name {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

/* Info rows */
.info-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8125rem;
}

.info-val {
  color: white;
  font-weight: 500;
  font-size: 0.8125rem;
}

.info-val.text-warning {
  color: #fbbf24;
  font-style: italic;
}

/* ========== NOT FOUND ========== */
.not-found {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.not-found-icon {
  font-size: 4rem;
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
  display: block;
}

.not-found h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.not-found p {
  margin: 0;
  font-size: 0.875rem;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .tournament-icon {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1.75rem;
  }

  .tournament-title {
    font-size: 1.25rem;
  }

  .meta-row {
    justify-content: center;
  }

  .match-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
  }

  .match-main-info {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .match-teams {
    width: 100%;
  }

  .match-meta {
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-left: 0;
    padding-top: 1rem;
  }

  .match-meta-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .match-actions-area {
    justify-content: space-between;
    width: 100%;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 1rem;
  }

  .section-content, .rules-box p {
    word-break: break-word;
  }
}

.club-select-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.club-select-item:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
}

.club-select-item.selected {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.club-avatar-modal {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.club-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-select-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.club-select-name {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.club-select-short {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  font-weight: 500;
}

.club-select-leader {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  margin-top: 0.125rem;
}

.club-select-status {
  color: #4ade80;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  margin-top: 0.25rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style>
/* Global styles for the teleported Registration Dialog */
.custom-tournament-dialog.p-dialog {
  background: #0f172a !important; /* Slate 900 - Solid dark background */
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 1.25rem !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

.custom-tournament-dialog .p-dialog-header {
  background: #1e293b !important; /* Slate 800 */
  color: white !important;
  padding: 1.25rem 1.5rem !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.custom-tournament-dialog .p-dialog-title {
  font-weight: 700 !important;
  font-size: 1.125rem !important;
}

.custom-tournament-dialog .p-dialog-header-icon {
  color: rgba(255, 255, 255, 0.5) !important;
  width: 2rem !important;
  height: 2rem !important;
  border-radius: 0.5rem !important;
  transition: all 0.2s !important;
}

.custom-tournament-dialog .p-dialog-header-icon:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

.custom-tournament-dialog .p-dialog-content {
  background: #0f172a !important;
  color: white !important;
  padding: 1.5rem !important;
}

.custom-tournament-dialog .p-dialog-footer {
  background: #1e293b !important;
  padding: 1rem 1.5rem !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
}

/* Ensure text inside dialog is visible */
.custom-tournament-dialog .club-select-name {
  color: white !important;
  font-weight: 600;
}

.custom-tournament-dialog .club-select-short {
  color: rgba(255, 255, 255, 0.5) !important;
}

.custom-tournament-dialog .club-select-leader {
  color: rgba(255, 255, 255, 0.4) !important;
}
/* ========== ADMIN SECTION ========== */
.admin-section {
  border: 1px solid rgba(234, 179, 8, 0.3);
  background: rgba(234, 179, 8, 0.05);
}

.team-count.yellow {
  background: rgba(234, 179, 8, 0.3);
  color: #fbbf24;
}

.team-row.pending {
  border-left: 3px solid #fbbf24;
}

.icon-btn-small {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.icon-btn-small.success {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.icon-btn-small.success:hover {
  background: #22c55e;
  color: white;
}

.icon-btn-small.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-start-tournament {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-start-tournament:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #34d399, #10b981);
}

.btn-start-tournament:active {
  transform: translateY(0);
}

.btn-start-tournament:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-btn-small.danger:hover {
  background: #ef4444;
  color: white;
}

.text-yellow-400 {
  color: #fbbf24;
}
.admin-actions-card {
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(0, 0, 0, 0) 100%);
}

.admin-buttons-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.admin-action-btn.primary {
  background: #ef4444;
  color: white;
}

.admin-action-btn.primary:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.status-ready-badge {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  text-align: center;
  font-weight: 700;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-waiting-badge {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  text-align: center;
  font-style: italic;
}
.match-score-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.fulltime-badge {
  font-size: 0.65rem;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 800;
  text-transform: uppercase;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
</style>
