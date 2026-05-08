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
                  <span>{{ approvedRegistrations.length }}/{{ tournament.maxTeams }} {{ tournament.isIndividual ? 'người' : 'đội' }}</span>
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
                {{ tournament.isIndividual ? 'Vận động viên đã đăng ký' : 'Câu lạc bộ đã đăng ký' }}
                <span class="team-count">{{ approvedRegistrations.length }}</span>
              </h2>

              <div v-if="approvedRegistrations.length > 0" class="teams-list">
                <div v-for="reg in approvedRegistrations" :key="reg.id" class="team-row">
                  <template v-if="tournament.isIndividual">
                    <img v-if="reg.player?.avatar_url" :src="reg.player.avatar_url" class="team-avatar-small" style="border-radius: 9999px" />
                    <div v-else class="team-avatar-small" style="border-radius: 9999px">{{ getInitials(reg.player?.full_name) }}</div>
                    <span class="team-name">{{ reg.player?.full_name }}</span>
                  </template>
                  <template v-else>
                    <img v-if="reg.club?.logo_url" :src="reg.club.logo_url" class="team-avatar-small" />
                    <div v-else class="team-avatar-small">{{ getInitials(reg.club?.name) }}</div>
                    <span class="team-name">{{ reg.club?.name }}</span>
                  </template>
                </div>
              </div>
              <div v-else class="empty-teams">
                <i class="pi pi-users"></i>
                <p>Chưa có {{ tournament.isIndividual ? 'vận động viên' : 'câu lạc bộ' }} nào đăng ký</p>
              </div>
            </div>
          </div>

          <!-- Right Column (Sidebar) -->
          <div class="right-column">
            <!-- Actions -->
            <div class="section-card" v-if="canRegister">
              <button class="action-btn primary" @click="handleRegister">
                <i class="pi pi-sign-in"></i>
                Đăng ký tham gia
              </button>
            </div>
            <div class="section-card" v-else-if="isAlreadyRegistered">
              <button class="action-btn secondary" disabled style="opacity: 0.7; cursor: default;">
                <i class="pi pi-check" style="color: #4ade80;"></i>
                Đã đăng ký (Chờ duyệt)
              </button>
            </div>

            <!-- Registration Status -->
            <div class="section-card">
              <h3 class="sidebar-title">
                <i class="pi pi-check-circle sidebar-icon green"></i>
                Trạng thái đăng ký
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">Đã đăng ký</span>
                  <span class="info-val">{{ approvedRegistrations.length }} {{ tournament.isIndividual ? 'người' : 'đội' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Còn trống</span>
                  <span class="info-val">{{ tournament.maxTeams - approvedRegistrations.length }} chỗ</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tối thiểu</span>
                  <span class="info-val">{{ tournament.minTeams }} {{ tournament.isIndividual ? 'người' : 'đội' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tối đa</span>
                  <span class="info-val">{{ tournament.maxTeams }} {{ tournament.isIndividual ? 'người' : 'đội' }}</span>
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
import { useAuthStore } from '../../stores/auth.js';
import { useTournamentStore } from '../../stores/tournament.js';
import { formatDate } from '../../utils/helpers.js';

const route = useRoute();
const authStore = useAuthStore();
const tournamentStore = useTournamentStore();

const tournament = ref(null);
const loading = ref(true);

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
  if (tournament.value?.isIndividual) {
    return tournament.value?.players?.filter(p => p.status === 'approved' || p.status === 'selected') || [];
  }
  return tournament.value?.registrations?.filter(r => r.status === 'approved') || [];
});

const isAlreadyRegistered = computed(() => {
  if (!authStore.isAuthenticated || !tournament.value) return false;
  
  if (tournament.value.isIndividual) {
    return tournament.value.players?.some(p => p.player?.id === authStore.user.id);
  }
  
  return false;
});

const canRegister = computed(() => {
  if (!tournament.value) return false;
  return authStore.isAuthenticated && 
         tournament.value.status === 'registration_open' &&
         tournament.value.registrationCount < tournament.value.maxTeams &&
         !isAlreadyRegistered.value;
});

const handleRegister = async () => {
  if (!authStore.isAuthenticated) {
    alert('Vui lòng đăng nhập để đăng ký!');
    return;
  }

  if (tournament.value.isIndividual) {
    if (confirm('Bạn có chắc chắn muốn đăng ký tham gia giải đấu này với tư cách cá nhân?')) {
      const result = await tournamentStore.registerIndividual(tournament.value.id, authStore.user.id);
      if (result.success) {
        alert('Đăng ký thành công! Vui lòng chờ ban tổ chức duyệt.');
      } else {
        alert(result.error || 'Đăng ký thất bại!');
      }
    }
  } else {
    alert('Chức năng đăng ký cho câu lạc bộ đang được phát triển.');
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
  if (id) {
    const result = await tournamentStore.fetchTournament(id);
    if (result.success) {
      tournament.value = tournamentStore.currentTournament;
    }
  }
  loading.value = false;
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
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
</style>
