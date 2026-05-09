<template>
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
                  <span>{{ approvedRegistrations.length }}/{{ tournament.maxTeams }} đội</span>
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
                  <div class="match-teams">
                    <span class="team home">{{ match.home_club?.name || 'TBD' }}</span>
                    <span class="vs">VS</span>
                    <span class="team away">{{ match.away_club?.name || 'TBD' }}</span>
                  </div>
                  <div class="match-meta">
                    <span class="match-date"><i class="pi pi-calendar"></i> {{ formatDate(match.match_date) }}</span>
                    <span class="match-time" v-if="match.match_time"><i class="pi pi-clock"></i> {{ match.match_time }}</span>
                    <span class="match-venue" v-if="match.venue?.name"><i class="pi pi-map-marker"></i> {{ match.venue.name }}</span>
                  </div>
                  <div class="match-score" v-if="match.home_score !== null && match.away_score !== null">
                    <span class="score">{{ match.home_score }} - {{ match.away_score }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-schedule">
                <i class="pi pi-calendar"></i>
                <p>Lịch thi đấu sẽ được cập nhật sau khi đóng đăng ký</p>
                <p class="sub-text">(Cần ít nhất {{ tournament.minTeams }} đội để bắt đầu)</p>
              </div>
            </div>

            <!-- Registered Teams -->
            <div class="section-card">
              <h2 class="section-title">
                <i class="pi pi-users section-icon purple"></i>
                Câu lạc bộ đã đăng ký
                <span class="team-count">{{ approvedRegistrations.length }}</span>
              </h2>

              <div v-if="approvedRegistrations.length > 0" class="teams-list">
                <div v-for="reg in approvedRegistrations" :key="reg.id" class="team-row">
                  <div class="team-avatar-small">{{ getInitials(reg.club?.name) }}</div>
                  <span class="team-name">{{ reg.club?.name }}</span>
                </div>
              </div>
              <div v-else class="empty-teams">
                <i class="pi pi-users"></i>
                <p>Chưa có câu lạc bộ nào đăng ký</p>
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

            <!-- Registration Modal -->
            <Dialog v-model:visible="showRegModal" :header="`Đăng ký tham gia: ${tournament?.name}`" :modal="true" :style="{ width: '450px' }" class="custom-tournament-dialog">
              <div class="flex flex-column gap-3 py-2">
                <div v-for="club in userClubs" :key="club.id" 
                     class="club-select-item"
                     :class="{'selected': selectedClubId === club.id}"
                     @click="selectedClubId = club.id">
                  <div class="club-avatar-modal">
                    <img v-if="club.logoUrl" :src="club.logoUrl" :alt="club.name" class="club-logo-img" />
                    <span v-else>{{ getInitials(club.name) }}</span>
                  </div>
                  <div class="club-select-info">
                    <div class="flex align-items-center gap-2">
                      <span class="club-select-name">{{ club.name }}</span>
                      <span v-if="club.short_name" class="club-select-short">({{ club.short_name }})</span>
                    </div>
                    <span class="club-select-leader" v-if="club.leaderName">
                      <i class="pi pi-user text-xs"></i> {{ club.leaderName }}
                    </span>
                    <span class="club-select-status" v-if="selectedClubId === club.id">
                      <i class="pi pi-check-circle"></i> Đã chọn
                    </span>
                  </div>
                </div>
              </div>
              <template #footer>
                <button class="action-btn secondary" @click="showRegModal = false" :disabled="registering">Hủy</button>
                <button class="btn-join" @click="submitRegistration(selectedClubId)" :disabled="!selectedClubId || registering">
                  Xác nhận đăng ký
                </button>
              </template>
            </Dialog>

            <!-- Registration Status -->
            <div class="section-card">
              <h3 class="sidebar-title">
                <i class="pi pi-check-circle sidebar-icon green"></i>
                Trạng thái đăng ký
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">Đã đăng ký</span>
                  <span class="info-val">{{ approvedRegistrations.length }} đội</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Còn trống</span>
                  <span class="info-val">{{ tournament.maxTeams - approvedRegistrations.length }} chỗ</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tối thiểu</span>
                  <span class="info-val">{{ tournament.minTeams }} đội</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tối đa</span>
                  <span class="info-val">{{ tournament.maxTeams }} đội</span>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Dialog from 'primevue/dialog';
import { useAuthStore } from '../../stores/auth.js';
import { useTournamentStore } from '../../stores/tournament.js';
import { formatDate } from '../../utils/helpers.js';
import { clubRepository } from '../../repositories/ClubRepository.js';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const route = useRoute();
const authStore = useAuthStore();
const tournamentStore = useTournamentStore();
const toast = useToast();
const confirm = useConfirm();

const tournament = ref(null);
const loading = ref(true);
const userClubs = ref([]);
const registering = ref(false);
const showRegModal = ref(false);
const selectedClubId = ref(null);

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

const canRegister = computed(() => {
  // Tournament managers should not be able to register clubs
  if (authStore.isTournamentManager) return false;
  const isManager = authStore.isClubLeader || authStore.isClubDeputy || authStore.isClubAdmin || authStore.isAdmin;
  const hasManagedClub = userClubs.value && userClubs.value.length > 0;
  return (isManager || hasManagedClub) &&
         tournament.value?.status === 'registration_open' &&
         tournament.value?.registrationCount < tournament.value?.maxTeams;
});

const handleRegister = async () => {
  if (userClubs.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Thông báo', detail: 'Bạn chưa có câu lạc bộ nào được duyệt để đăng ký', life: 3000 });
    return;
  }

  if (userClubs.value.length === 1) {
    const club = userClubs.value[0];
    confirm.require({
      message: `Bạn có muốn đăng ký câu lạc bộ "${club.name}" tham gia giải đấu này không?`,
      header: 'Xác nhận đăng ký',
      icon: 'pi pi-exclamation-triangle',
      accept: () => submitRegistration(club.id),
      reject: () => {}
    });
  } else {
    showRegModal.value = true;
  }
};

const submitRegistration = async (clubId) => {
  registering.value = true;
  try {
    const result = await tournamentStore.registerClub(tournament.value.id, clubId, authStore.user.id);
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Gửi yêu cầu đăng ký tham gia thành công', life: 3000 });
      showRegModal.value = false;
      // Refresh tournament data
      const fetchResult = await tournamentStore.fetchTournament(tournament.value.id);
      if (fetchResult.success) {
        tournament.value = tournamentStore.currentTournament;
      }
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
    
    if (isManager && authStore.user) {
      promises.push(clubRepository.findManagedBy(authStore.user.id));
    }
    
    const [tournamentResult, clubsResult] = await Promise.all(promises);
    
    if (tournamentResult.success) {
      tournament.value = tournamentStore.currentTournament;
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: tournamentResult.error || 'Không thể tải thông tin giải đấu', life: 3000 });
    }
    
    if (isManager && clubsResult) {
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
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-weight: 500;
}

.match-teams .team {
  color: white;
  font-size: 0.875rem;
  flex: 1;
  text-align: center;
}

.match-teams .vs {
  color: #fb923c;
  font-weight: 700;
  font-size: 0.75rem;
}

.match-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.match-meta i {
  font-size: 0.625rem;
}

.match-date {
  color: #60a5fa;
}

.match-time {
  color: #fbbf24;
}

.match-venue {
  color: #a78bfa;
}

.match-score {
  text-align: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.score {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 0.25rem 1rem;
  border-radius: 0.5rem;
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
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  margin: 0.125rem 0 0 0;
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
</style>
