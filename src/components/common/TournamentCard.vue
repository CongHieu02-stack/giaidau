<template>
  <div class="t-card" @click="navigateToDetail" :style="{ animationDelay: 'inherit' }">
    <div class="card-glow"></div>

    <!-- Header -->
    <div class="card-header" :class="headerClass">
      <div class="header-pattern"></div>
      <div class="sport-emoji">{{ sportIcon }}</div>
      <span class="status-badge" :class="statusClass">
        <i :class="statusIcon"></i>
        {{ statusText }}
      </span>
      <!-- Registration Status Badge -->
      <span v-if="myRegistration" class="status-badge reg-badge" :class="myRegistration.status">
        <i :class="myRegistration.status === 'approved' ? 'pi pi-check-circle' : (myRegistration.status === 'pending' ? 'pi pi-clock' : 'pi pi-times-circle')"></i>
        {{ myRegistration.status === 'approved' ? 'Đã tham gia' : (myRegistration.status === 'pending' ? 'Đang chờ duyệt' : 'Bị từ chối') }}
      </span>
    </div>

    <!-- Body -->
    <div class="card-body">
      <h3 class="t-name">{{ tournament.name }}</h3>

      <div class="info-list">
        <div class="info-row">
          <span class="info-icon sport"><i class="pi pi-tag"></i></span>
          <span>{{ sportName }}</span>
        </div>
        <div class="info-row">
          <span class="info-icon date"><i class="pi pi-calendar"></i></span>
          <span>{{ dateDisplay }}</span>
        </div>
        <div class="info-row">
          <span class="info-icon team"><i class="pi pi-users"></i></span>
          <span>{{ registrationDisplay }}</span>
        </div>
      </div>



      <!-- Champion -->
      <div v-if="isCompleted && tournament.champion_club" class="champion-row">
        <i class="pi pi-star-fill"></i>
        <span>Vô dịch: {{ tournament.champion_club.name }}</span>
      </div>
    </div>

    <!-- Footer CTA -->
    <div class="card-footer">
      <!-- Status Badge if registered -->
      <template v-if="myRegistration">
        <div v-if="myRegistration.status === 'pending'" class="reg-status pending" title="Đang chờ phê duyệt">
          <i class="pi pi-clock"></i> Chờ duyệt
        </div>
        <div v-else-if="myRegistration.status === 'approved'" class="reg-status approved" title="Đã tham gia giải đấu">
          <i class="pi pi-check-circle"></i> Đã tham gia
        </div>
        <div v-else class="reg-status rejected" title="Đăng ký bị từ chối">
          <i class="pi pi-times-circle"></i> Bị từ chối
        </div>
      </template>

      <!-- Join Button if can register -->
      <button v-else-if="canRegister" @click.stop="onJoinClick" class="btn-join">
        <i class="pi pi-sign-in"></i> Tham gia
      </button>

      <!-- Always show View Details -->
      <span class="btn-view">Xem chi tiết <i class="pi pi-arrow-right"></i></span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { formatDate } from '../../utils/helpers.js';
import { useAuthStore } from '../../stores/auth.js';
import { clubRepository } from '../../repositories/ClubRepository.js';

const props = defineProps({ tournament: { type: Object, required: true } });
const router = useRouter();
const authStore = useAuthStore();

const userClubs = ref([]);

const canRegister = computed(() => {
  if (myRegistration.value) return false;
  if (!authStore.isAuthenticated) return true;
  const isManager = authStore.isClubLeader || authStore.isClubDeputy || authStore.isClubAdmin || authStore.isAdmin;
  const hasManagedClub = userClubs.value && userClubs.value.length > 0;
  return (isManager || hasManagedClub) && 
         props.tournament.status === 'registration_open' &&
         (props.tournament.approvedCount || 0) < (props.tournament.maxTeams || 16);
});

const myRegistration = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user || !props.tournament.registrations) return null;
  
  // Individual tournament
  if (props.tournament.participant_type === 'individual') {
    return props.tournament.registrations.find(r => r.user_id === authStore.user.id);
  }
  
  // Team tournament
  const managedClubIds = userClubs.value.map(c => c.id);
  return props.tournament.registrations.find(r => r.club_id && managedClubIds.includes(r.club_id));
});

onMounted(async () => {
  if (authStore.isAuthenticated && authStore.user) {
    try {
      const res = await clubRepository.findManagedBy(authStore.user.id);
      if (res && res.isOk && res.isOk()) {
        userClubs.value = res.getValue();
      }
    } catch (e) {
      // ignore
    }
  }
});

const onJoinClick = (e) => {
  e.stopPropagation();
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  router.push(`/tournaments/${props.tournament.id}?register=true`);
};

const sportIcon = computed(() => ({
  'Bóng đá': '⚽', 'Bóng rổ': '🏀', 'Cầu lông': '🏸',
  'Pickleball': '🎾', 'Tennis': '🎾', 'Bóng chuyền': '🏐',
  'Bơi lội': '🏊', 'Điền kinh': '🏃'
}[props.tournament.sport_category?.name] || '🏆'));

const sportName = computed(() => props.tournament.sport_category?.name || 'Thể thao');

const headerClass = computed(() => ({
  'upcoming': 'hdr-upcoming', 'registration_open': 'hdr-open',
  'registration_closed': 'hdr-closed', 'ongoing': 'hdr-ongoing',
  'completed': 'hdr-done', 'cancelled': 'hdr-cancel'
}[props.tournament.status] || 'hdr-upcoming'));

const statusClass = computed(() => ({
  'upcoming': 'sb-upcoming', 'registration_open': 'sb-open',
  'registration_closed': 'sb-closed', 'ongoing': 'sb-ongoing',
  'completed': 'sb-done', 'cancelled': 'sb-cancel'
}[props.tournament.status] || 'sb-upcoming'));

const statusIcon = computed(() => ({
  'upcoming': 'pi pi-clock', 'registration_open': 'pi pi-user-plus',
  'registration_closed': 'pi pi-lock', 'ongoing': 'pi pi-play',
  'completed': 'pi pi-check-circle', 'cancelled': 'pi pi-times-circle'
}[props.tournament.status] || 'pi pi-clock'));

const statusText = computed(() => ({
  'upcoming': 'Sắp diễn ra', 'registration_open': 'Đang mở đăng ký',
  'registration_closed': 'Đóng đăng ký', 'ongoing': 'Đang diễn ra',
  'completed': 'Đã kết thúc', 'cancelled': 'Đã hủy'
}[props.tournament.status] || 'Không xác định'));

const dateDisplay = computed(() => {
  if (props.tournament.startDate && props.tournament.endDate)
    return `${formatDate(props.tournament.startDate)} – ${formatDate(props.tournament.endDate)}`;
  return formatDate(props.tournament.startDate) || 'Chưa xác định';
});

const registrationDisplay = computed(() => {
  const c = props.tournament.approvedCount || 0;
  const m = props.tournament.maxTeams || 0;
  return m > 0 ? `${c}/${m} đội` : `${c} đội tham gia`;
});



const isCompleted = computed(() => props.tournament.status === 'completed');
const navigateToDetail = () => router.push(`/tournaments/${props.tournament.id}`);
</script>

<style scoped>
.t-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0;
  animation: fadeUp 0.5s ease forwards;
  display: flex;
  flex-direction: column;
  height: 100%;
}

@keyframes fadeUp {
  from { opacity:0; transform:translateY(20px); }
  to   { opacity:1; transform:translateY(0); }
}

.t-card:hover {
  transform: translateY(-8px);
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 24px 60px rgba(0,0,0,0.4);
}

.card-glow {
  position: absolute; inset: 0; opacity: 0;
  background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 65%);
  transition: opacity 0.3s;
  pointer-events: none;
}
.t-card:hover .card-glow { opacity: 1; }

/* ── Header ── */
.card-header {
  height: 130px; position: relative;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}

.hdr-upcoming   { background: linear-gradient(135deg,#1e3a5f,#2563eb); }
.hdr-open       { background: linear-gradient(135deg,#14532d,#16a34a); }
.hdr-closed     { background: linear-gradient(135deg,#713f12,#d97706); }
.hdr-ongoing    { background: linear-gradient(135deg,#312e81,#6366f1); }
.hdr-done       { background: linear-gradient(135deg,#1f2937,#374151); }
.hdr-cancel     { background: linear-gradient(135deg,#7f1d1d,#ef4444); }

.header-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 20px 20px;
}

.sport-emoji { font-size: 3.5rem; z-index: 1; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4)); }

.status-badge {
  position: absolute; top: 10px; right: 10px;
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.7rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700;
  backdrop-filter: blur(10px); z-index: 2;
}

.sb-upcoming  { background:rgba(96,165,250,0.25); color:#93c5fd; border:1px solid rgba(96,165,250,0.3); }
.sb-open      { background:rgba(34,197,94,0.25);  color:#86efac; border:1px solid rgba(34,197,94,0.3); }
.sb-closed    { background:rgba(251,191,36,0.25); color:#fde68a; border:1px solid rgba(251,191,36,0.3); }
.sb-ongoing   { background:rgba(99,102,241,0.25); color:#a5b4fc; border:1px solid rgba(99,102,241,0.3); animation: pulse 2s infinite; }
.sb-done      { background:rgba(107,114,128,0.3); color:#d1d5db; border:1px solid rgba(107,114,128,0.3); }
.sb-cancel    { background:rgba(239,68,68,0.25);  color:#fca5a5; border:1px solid rgba(239,68,68,0.3); }

.reg-badge { top: 10px; left: 10px; right: auto !important; z-index: 3; }
.reg-badge.pending { background: rgba(245, 158, 11, 0.25); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.3); animation: pulse 2s infinite; }
.reg-badge.approved { background: rgba(34, 197, 94, 0.25); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
.reg-badge.rejected { background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }

/* ── Body ── */
.card-body { 
  padding: 1.125rem 1.25rem 0.75rem; 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
}

.t-name {
  font-size: 1.05rem; font-weight: 700; color: white;
  margin-bottom: 0.875rem; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  height: 2.8rem;
}

.info-list { display: flex; flex-direction: column; gap: 0.45rem; }

.info-row {
  display: flex; align-items: center; gap: 0.6rem;
  font-size: 0.82rem; color: rgba(255,255,255,0.55);
}

.info-list {
  margin-bottom: 1rem;
}

.champion-row {
  margin-top: auto;
}

.info-icon {
  width: 24px; height: 24px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; flex-shrink: 0;
}
.info-icon.sport  { background:rgba(99,102,241,0.2); color:#a5b4fc; }
.info-icon.date   { background:rgba(245,158,11,0.2); color:#fcd34d; }
.info-icon.team   { background:rgba(34,197,94,0.2);  color:#86efac; }



/* Champion */
.champion-row {
  margin-top:0.875rem; padding:0.6rem 0.75rem;
  background:linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.08));
  border:1px solid rgba(251,191,36,0.2); border-radius:0.625rem;
  display:flex; align-items:center; gap:0.5rem;
  font-size:0.8rem; font-weight:600; color:#fde68a;
}

/* Footer */
.card-footer {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; gap: 0.625rem;
}

.btn-view {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  flex: 1; padding: 0.65rem 0.5rem;
  background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
  color: #a5b4fc; font-size: 0.85rem; font-weight: 600;
  border-radius: 0.75rem; text-decoration: none; transition: all 0.25s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1;
  min-height: 40px;
}

.btn-view:hover { 
  background: rgba(99,102,241,0.25); 
  border-color: rgba(99,102,241,0.4); 
  color: #c7d2fe; 
  transform: translateY(-1px); 
}

.btn-view .pi { transition: transform 0.2s; }
.btn-view:hover .pi { transform: translateX(3px); }

.btn-join { /* uses global .btn-join from src/style.css */ }

.reg-status {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  min-height: 40px;
  white-space: nowrap;
}

.reg-status.pending {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  animation: pulse-status 2s infinite;
}

.reg-status.approved {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.reg-status.rejected {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
}

@keyframes pulse-status {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
