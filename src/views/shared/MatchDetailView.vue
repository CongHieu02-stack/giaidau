<template>
  <div class="match-detail-page">
    <div class="shell">
      <div v-if="loading" class="center-msg"><i class="pi pi-spinner pi-spin"></i> Đang tải thông tin trận đấu...</div>
      <template v-else-if="match">
        <!-- Header -->
        <div class="top-bar">
          <button @click="router.back()" class="btn-back"><i class="pi pi-arrow-left"></i> Quay lại</button>
          <span class="match-status-badge" :class="'s-'+match.status">{{ statusText }}</span>
          <div class="match-meta-info">
            <span v-if="match.match_date"><i class="pi pi-calendar"></i> {{ formatDate(match.match_date) }}</span>
            <span v-if="match.match_time"><i class="pi pi-clock"></i> {{ match.match_time }}</span>
            <span v-if="match.venue?.name"><i class="pi pi-map-marker"></i> {{ match.venue.name }}</span>
          </div>
        </div>

        <!-- Scoreboard -->
        <div class="scoreboard">
          <div class="sb-team">
            <div class="sb-logo">
              <img v-if="getTeamLogo('home')" :src="getTeamLogo('home')"/>
              <span v-else>{{ initials(getTeamName('home')) }}</span>
            </div>
            <div class="sb-name">{{ getTeamName('home') }}</div>
            <!-- Home Events -->
            <div class="sb-events">
              <div v-for="ev in homeSummary" :key="ev.id" class="sb-ev-item">
                <span v-if="ev.type === 'yellow_card'" class="card-icon yellow"></span>
                <span v-else-if="ev.type === 'red_card'" class="card-icon red"></span>
                <span v-else>{{ eventEmoji(ev.type) }}</span>
                {{ ev.player?.full_name }} ({{ ev.minute === 0 ? (ev.second || 0) + 's' : ev.minute + "'" }})
              </div>
            </div>
          </div>
          <div class="sb-score">
            <span class="sc-num">{{ match.home_score ?? 0 }}</span>
            <span class="sc-sep">-</span>
            <span class="sc-num">{{ match.away_score ?? 0 }}</span>
            <div class="sc-label">{{ statusText }}</div>
          </div>
          <div class="sb-team">
            <div class="sb-logo">
              <img v-if="getTeamLogo('away')" :src="getTeamLogo('away')"/>
              <span v-else>{{ initials(getTeamName('away')) }}</span>
            </div>
            <div class="sb-name">{{ getTeamName('away') }}</div>
            <!-- Away Events -->
            <div class="sb-events">
              <div v-for="ev in awaySummary" :key="ev.id" class="sb-ev-item">
                <span v-if="ev.type === 'yellow_card'" class="card-icon yellow"></span>
                <span v-else-if="ev.type === 'red_card'" class="card-icon red"></span>
                <span v-else>{{ eventEmoji(ev.type) }}</span>
                {{ ev.player?.full_name }} ({{ ev.minute === 0 ? (ev.second || 0) + 's' : ev.minute + "'" }})
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="details-grid">
          <!-- Timeline -->
          <div class="panel">
            <h3 class="panel-title"><i class="pi pi-list mr-2"></i>Diễn biến trận đấu</h3>
            <div v-if="events.length===0" class="empty-sm">Chưa có diễn biến chính thức</div>
            <div v-else class="timeline">
              <div v-for="ev in events" :key="ev.id" class="tl-item">
                <span class="tl-min">{{ ev.minute === 0 ? (ev.second || 0) + 's' : ev.minute + "'" }}</span>
                <span class="tl-icon">
                  <span v-if="ev.type === 'yellow_card'" class="card-icon yellow"></span>
                  <span v-else-if="ev.type === 'red_card'" class="card-icon red"></span>
                  <span v-else>{{ eventEmoji(ev.type) }}</span>
                </span>
                <div class="tl-body">
                  <span class="tl-player">{{ ev.player?.full_name || '' }}</span>
                  <span class="tl-desc">{{ ev.description }}</span>
                  <span class="tl-club">{{ ev.club?.name || '' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lineups / Attendance -->
          <div class="panel">
            <h3 class="panel-title"><i class="pi pi-users mr-2"></i>Đội hình thi đấu</h3>
            <div v-for="side in ['home','away']" :key="side" class="att-section">
              <h4 class="att-club">{{ getTeamName(side) }}</h4>
              <div v-if="getPresentPlayers(side).length===0" class="empty-sm">Không có dữ liệu đội hình</div>
              <div v-for="p in getPresentPlayers(side)" :key="p.player?.id" class="att-row">
                <span class="att-name">{{ p.player?.full_name }}</span>
                <i class="pi pi-check-circle text-green-400"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Referee -->
        <div class="ref-footer" v-if="match.referee">
          <i class="pi pi-user-edit"></i>
          <span>Trọng tài điều khiển: <strong>{{ match.referee.full_name }}</strong></span>
        </div>
      </template>
      <div v-else class="center-msg">Không tìm thấy trận đấu</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { matchRepository } from '../../repositories/MatchRepository.js';

const route = useRoute();
const router = useRouter();
const match = ref(null);
const events = ref([]);
const attendance = ref([]);
const loading = ref(true);

const statusText = computed(() => ({
  'scheduled':'Chờ thi đấu','in_progress':'Đang thi đấu','paused':'Tạm dừng','completed':'Đã kết thúc','cancelled':'Đã hủy'
}[match.value?.status] || ''));

const initials = (n) => n && n !== 'TBD' ? n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
const getTeamName = (side) => {
  const team = side === 'home' ? (match.value?.home_club || match.value?.home_user) : (match.value?.away_club || match.value?.away_user);
  return team?.name || team?.full_name || 'TBD';
};
const getTeamLogo = (side) => {
  const team = side === 'home' ? (match.value?.home_club || match.value?.home_user) : (match.value?.away_club || match.value?.away_user);
  return team?.logo_url || team?.avatar_url || null;
};
const eventEmoji = (t) => ({'goal':'⚽','yellow_card':'🟡','red_card':'🔴','substitution_in':'🔄','substitution_out':'↩️','start':'▶️','pause':'⏸','resume':'▶️','end':'⏹'}[t]||'📌');

const homeSummary = computed(() => {
  const homeId = match.value?.home_club_id || match.value?.home_user_id;
  const isIndividual = match.value?.tournament?.participant_type === 'individual';
  return events.value.filter(e => {
    const belongsToHome = isIndividual ? e.player_id === homeId : e.club_id === homeId;
    return belongsToHome && ['goal', 'yellow_card', 'red_card'].includes(e.type);
  });
});

const awaySummary = computed(() => {
  const awayId = match.value?.away_club_id || match.value?.away_user_id;
  const isIndividual = match.value?.tournament?.participant_type === 'individual';
  return events.value.filter(e => {
    const belongsToAway = isIndividual ? e.player_id === awayId : e.club_id === awayId;
    return belongsToAway && ['goal', 'yellow_card', 'red_card'].includes(e.type);
  });
});

function getPresentPlayers(side) {
  const clubId = side === 'home' ? match.value?.home_club_id : match.value?.away_club_id;
  const userId = side === 'home' ? match.value?.home_user_id : match.value?.away_user_id;
  const isIndividual = match.value?.tournament?.participant_type === 'individual';
  
  return attendance.value.filter(a => {
    if (isIndividual) return a.player_id === userId;
    return a.club_id === clubId && a.is_present;
  });
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}

async function loadAll() {
  loading.value = true;
  const r = await matchRepository.findByIdWithDetails(route.params.id);
  if (r.isOk()) {
    match.value = r.getValue();
    const evR = await matchRepository.getMatchEvents(match.value.id);
    if (evR.isOk()) events.value = evR.getValue();
    const attR = await matchRepository.getMatchAttendance(match.value.id);
    if (attR.isOk()) attendance.value = attR.getValue();
  }
  loading.value = false;
}

onMounted(loadAll);
</script>

<style scoped>
.match-detail-page { min-height: 100vh; padding: 6rem 1.5rem 3rem; background: #0f172a; color: white; }
.shell { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
.center-msg { text-align: center; padding: 5rem; color: rgba(255,255,255,0.4); }

.top-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.btn-back { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; color: white; cursor: pointer; transition: all 0.2s; }
.btn-back:hover { background: rgba(255,255,255,0.1); }
.match-status-badge { padding: 0.4rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
.s-scheduled { background: rgba(107,114,128,0.2); color: #d1d5db; }
.s-in_progress { background: rgba(34,197,94,0.2); color: #86efac; }
.s-completed { background: rgba(99,102,241,0.2); color: #a5b4fc; }

.match-meta-info { display: flex; gap: 1.5rem; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
.match-meta-info i { color: #60a5fa; margin-right: 0.4rem; }

.scoreboard { display: flex; align-items: center; justify-content: center; gap: 3rem; padding: 3rem; background: rgba(30,41,59,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 2rem; }
.sb-team { display: flex; flex-direction: column; align-items: center; gap: 1rem; flex: 1; }
.sb-logo { width: 80px; height: 80px; border-radius: 50%; background: #1e293b; border: 3px solid #334155; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; overflow: hidden; }
.sb-logo img { width: 100%; height: 100%; object-fit: cover; }
.sb-name { font-size: 1.1rem; font-weight: 700; text-align: center; }

.sb-score { display: flex; flex-direction: column; align-items: center; }
.sc-num { font-size: 4rem; font-weight: 900; line-height: 1; }
.sc-sep { font-size: 2.5rem; color: rgba(255,255,255,0.2); margin: 0 1rem; }
.sc-label { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 1px; }

.sb-events { display: flex; flex-direction: column; gap: 0.4rem; width: 100%; margin-top: 1rem; }
.sb-ev-item { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
.sb-team:first-child .sb-ev-item { text-align: right; }
.sb-team:last-child .sb-ev-item { text-align: left; }

.details-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
.panel { background: rgba(30,41,59,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 1.5rem; padding: 1.5rem; }
.panel-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; }

.timeline { display: flex; flex-direction: column; gap: 1rem; }
.tl-item { display: flex; gap: 1rem; align-items: flex-start; }
.tl-min { width: 40px; font-weight: 800; color: #fbbf24; font-size: 0.9rem; text-align: center; }
.tl-icon { font-size: 1.1rem; }
.tl-body { flex: 1; }
.tl-player { font-weight: 700; display: block; margin-bottom: 0.1rem; }
.tl-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
.tl-club { font-size: 0.75rem; color: rgba(96,165,250,0.6); margin-top: 0.2rem; display: block; }

.att-section { margin-bottom: 2rem; }
.att-club { font-size: 1rem; font-weight: 700; color: #a5b4fc; margin-bottom: 0.75rem; }
.att-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border-radius: 0.75rem; margin-bottom: 0.5rem; }
.att-name { font-size: 0.9rem; }

.ref-footer { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem; background: rgba(251,191,36,0.05); border: 1px solid rgba(251,191,36,0.1); border-radius: 1rem; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
.ref-footer i { color: #fbbf24; font-size: 1.1rem; }

.card-icon { display: inline-block; width: 10px; height: 14px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
.card-icon.yellow { background-color: #fbbf24; }
.card-icon.red { background-color: #ef4444; }

@media (max-width: 800px) {
  .details-grid { grid-template-columns: 1fr; }
  .scoreboard { flex-direction: column; padding: 2rem; gap: 2rem; }
}
</style>
