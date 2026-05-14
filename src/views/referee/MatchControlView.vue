<template>
<div class="ref-page">
  <div class="shell">
  <div v-if="loading" class="center-msg"><i class="pi pi-spinner pi-spin"></i> Đang tải...</div>
  <template v-else-if="match">
    <!-- Header -->
    <div class="top-bar">
      <router-link to="/referee/matches" class="btn-back"><i class="pi pi-arrow-left"></i> Quay lại</router-link>
      <span class="match-status-badge" :class="'s-'+match.status">{{ statusText }}</span>
      <span class="timer" v-if="match.status==='in_progress'">⏱ {{ timerDisplay }}</span>
    </div>

    <!-- Scoreboard (Standard) -->
    <div v-if="!isSingleHeat" class="scoreboard">
      <div class="sb-team">
        <div class="sb-logo">
          <img v-if="match.home_club?.logo_url || match.home_user?.avatar_url" :src="match.home_club?.logo_url || match.home_user?.avatar_url"/>
          <span v-else>{{ initials(match.home_club?.name || match.home_user?.full_name) }}</span>
        </div>
        <div class="sb-name">{{ match.home_club?.name || match.home_user?.full_name || 'TBD' }}</div>
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
          <img v-if="match.away_club?.logo_url || match.away_user?.avatar_url" :src="match.away_club?.logo_url || match.away_user?.avatar_url"/>
          <span v-else>{{ initials(match.away_club?.name || match.away_user?.full_name) }}</span>
        </div>
        <div class="sb-name">{{ match.away_club?.name || match.away_user?.full_name || 'TBD' }}</div>
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

    <!-- Scoreboard (Single Heat Mode) -->
    <div v-else class="scoreboard heat">
       <div class="heat-header">
         <div class="heat-icon">🏁</div>
         <div class="heat-info">
           <h2>{{ match.tournament?.name }}</h2>
           <p>{{ match.match_type === 'final' ? 'Chung kết' : 'Vòng đấu Heat' }} • {{ match.tournament?.sportCategory?.name }}</p>
         </div>
       </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button v-if="match.status==='scheduled'" @click="doStart" class="ctrl-btn green"><i class="pi pi-play"></i> Bắt đầu lượt</button>
      <button v-if="match.status==='in_progress'" @click="doPause" class="ctrl-btn yellow"><i class="pi pi-pause"></i> Tạm dừng</button>
      <button v-if="match.status==='paused'" @click="doResume" class="ctrl-btn blue"><i class="pi pi-play"></i> Tiếp tục</button>
      <button v-if="match.status==='in_progress'||match.status==='paused'" @click="doEnd" class="ctrl-btn red"><i class="pi pi-stop"></i> Kết thúc & Chốt kết quả</button>
    </div>

    <!-- Tabs -->
    <div class="tab-bar" v-if="match.status!=='scheduled'">
      <button v-for="t in tabs" :key="t.id" class="tab-btn" :class="{active:activeTab===t.id}" @click="activeTab=t.id">
        <i :class="t.icon"></i> {{ t.label }}
      </button>
    </div>

    <!-- Tab: Events -->
    <div v-if="activeTab==='events' && match.status!=='scheduled'" class="panel">
      <h3 class="panel-title">Ghi nhận sự kiện</h3>
      <div class="event-actions">
        <button @click="openEventModal('goal','home')" class="ev-btn"><span class="ev-icon goal">⚽</span>Ghi bàn ({{ match.home_club?.name || match.home_user?.full_name }})</button>
        <button @click="openEventModal('goal','away')" class="ev-btn"><span class="ev-icon goal">⚽</span>Ghi bàn ({{ match.away_club?.name || match.away_user?.full_name }})</button>
        <button @click="openEventModal('yellow_card',null)" class="ev-btn"><span class="card-icon yellow large"></span>Thẻ vàng</button>
        <button @click="openEventModal('red_card',null)" class="ev-btn"><span class="card-icon red large"></span>Thẻ đỏ</button>
        <button @click="openEventModal('substitution_in',null)" class="ev-btn"><span class="ev-icon sub">🔄</span>Thay người</button>
      </div>

      <h3 class="panel-title" style="margin-top:1.5rem">Diễn biến trận đấu</h3>
      <div v-if="events.length===0" class="empty-sm">Chưa có sự kiện</div>
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
          <button v-if="match.status!=='completed'" @click="removeEvent(ev.id)" class="tl-del" title="Xóa"><i class="pi pi-times"></i></button>
        </div>
      </div>
    </div>

    <!-- Tab: Attendance -->
    <div v-if="activeTab==='attendance' || (isSingleHeat && activeTab==='results')" class="panel">
      <h3 class="panel-title">{{ isSingleHeat ? 'Danh sách vận động viên & Kết quả' : 'Kiểm diện' }}</h3>
      
      <!-- Standard Mode -->
      <template v-if="!isSingleHeat">
        <div v-for="side in ['home','away']" :key="side" class="att-section">
          <h4 class="att-club">{{ side==='home' ? (match.home_club?.name || match.home_user?.full_name) : (match.away_club?.name || match.away_user?.full_name) }}</h4>
          <div v-if="getPlayers(side).length===0" class="empty-sm">Chưa có thành viên</div>
          <div v-for="p in getPlayers(side)" :key="p.user?.id" class="att-row">
            <span class="att-name">{{ p.user?.full_name }}</span>
            <label class="att-check">
              <input type="checkbox" :checked="isPresent(p.user?.id)" @change="toggleAttendance(p.user?.id, side==='home'?match.home_club_id:match.away_club_id, $event)"/>
              <span class="checkmark"></span>
            </label>
          </div>
        </div>
      </template>

      <!-- Single Heat Mode -->
      <template v-else>
        <div class="heat-table-wrapper">
          <table class="heat-table">
            <thead>
              <tr>
                <th>VĐV / Đội</th>
                <th style="width: 120px;">Kiểm diện</th>
                <th style="width: 180px;">Kết quả ({{ match.tournament?.unit }})</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="att in attendance" :key="att.player_id">
                <td>
                  <div class="p-info">
                    <img v-if="att.player?.avatar_url" :src="att.player?.avatar_url" class="p-av"/>
                    <span class="p-name">{{ att.player?.full_name || att.club?.name }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <label class="att-check">
                    <input type="checkbox" :checked="att.is_present" @change="toggleAttendance(att.player_id, att.club_id, $event)"/>
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td>
                  <div class="result-input-group">
                    <input 
                      type="text" 
                      :value="localResults[att.id]" 
                      @input="(e) => localResults[att.id] = e.target.value"
                      @change="(e) => updateHeatResult(att, e.target.value)"
                      class="res-input"
                      placeholder="Nhập..."
                      :disabled="!att.is_present"
                      inputmode="decimal"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Event Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal-box">
        <h3>{{ modalTitle }}</h3>
        <div class="modal-form">
          <label v-if="modalType!=='goal'">
            <span>Đội</span>
            <select v-model="modalClubId">
              <option :value="match.home_club_id || match.home_user_id">{{ match.home_club?.name || match.home_user?.full_name }}</option>
              <option :value="match.away_club_id || match.away_user_id">{{ match.away_club?.name || match.away_user?.full_name }}</option>
            </select>
          </label>
          <label>
            <span>Phút <span class="text-red-500">*</span></span>
            <input type="number" v-model.number="modalMinute" min="0"/>
          </label>
          <label>
            <span>Cầu thủ <span class="text-red-500">*</span></span>
            <select v-model="modalPlayerId">
              <option value="">-- Chọn --</option>
              <option v-for="p in modalPlayers" :key="p.user?.id" :value="p.user?.id">{{ p.user?.full_name }}</option>
            </select>
          </label>
          <label>
            <span>Ghi chú</span>
            <input type="text" v-model="modalDesc" placeholder="VD: Sút xa, phạm lỗi..."/>
          </label>
        </div>
        <div class="modal-actions">
          <button @click="showModal=false" class="btn-cancel">Hủy</button>
          <button @click="submitEvent" class="btn-submit" :disabled="saving || !modalPlayerId || modalMinute === null || modalMinute === undefined || modalMinute < 0">
            <i :class="saving?'pi pi-spinner pi-spin':'pi pi-check'"></i> Lưu
          </button>
        </div>
      </div>
    </div>
  </template>
  <div v-else class="center-msg">Không tìm thấy trận đấu</div>
</div>
</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import { matchRepository } from '../../repositories/MatchRepository.js';
import { supabase } from '../../config/supabase.js';
import { advanceKnockoutWinner, checkAndFinalizeTournament } from '../../features/tournaments/adminTournamentManagement.js';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();
const match = ref(null);
const events = ref([]);
const attendance = ref([]);
const homePlayers = ref([]);
const awayPlayers = ref([]);
const loading = ref(true);
const saving = ref(false);
const activeTab = ref('events');
const timerSeconds = ref(0);
let timerInterval = null;

// Modal
const showModal = ref(false);
const modalType = ref('goal');
const modalSide = ref(null);
const modalClubId = ref('');
const modalPlayerId = ref('');
const modalMinute = ref(0);
const modalDesc = ref('');
const localResults = reactive({});

const isSingleHeat = computed(() => match.value?.tournament?.tournament_mode === 'single_heat');

watch(match, (newVal) => {
  if (newVal?.tournament?.tournament_mode === 'single_heat') {
    activeTab.value = 'results';
  }
}, { immediate: true });

const tabs = computed(() => {
  if (isSingleHeat.value) {
    return [
      { id: 'results', label: 'Nhập kết quả', icon: 'pi pi-check-square' }
    ];
  }
  return [
    { id: 'events', label: 'Diễn biến', icon: 'pi pi-list' },
    { id: 'attendance', label: 'Kiểm diện', icon: 'pi pi-users' }
  ];
});
const statusText = computed(() => ({
  'scheduled':'Chờ thi đấu','in_progress':'Đang thi đấu','paused':'Tạm dừng','completed':'Đã kết thúc','cancelled':'Đã hủy'
}[match.value?.status] || ''));

const timerDisplay = computed(() => {
  const m = Math.floor(timerSeconds.value / 60);
  const s = timerSeconds.value % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
});

const modalTitle = computed(() => ({
  'goal':'Ghi bàn','yellow_card':'Thẻ vàng','red_card':'Thẻ đỏ','substitution_in':'Thay người'
}[modalType.value] || 'Sự kiện'));

const modalPlayers = computed(() => {
  const cid = modalClubId.value;
  if (cid === match.value?.home_club_id || cid === match.value?.home_user_id) return homePlayers.value;
  if (cid === match.value?.away_club_id || cid === match.value?.away_user_id) return awayPlayers.value;
  return [];
});

const initials = (n) => n ? n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
const eventEmoji = (t) => ({'goal':'⚽','yellow_card':'🟡','red_card':'🔴','substitution_in':'🔄','substitution_out':'↩️','start':'▶️','pause':'⏸','resume':'▶️','end':'⏹'}[t]||'📌');
const getPlayers = (side) => side==='home' ? homePlayers.value : awayPlayers.value;
const isPresent = (pid) => attendance.value.some(a => a.player_id === pid && a.is_present);

const homeSummary = computed(() => {
  return events.value.filter(e => 
    e.club_id === match.value?.home_club_id && 
    ['goal', 'yellow_card', 'red_card'].includes(e.type)
  );
});

const awaySummary = computed(() => {
  return events.value.filter(e => 
    e.club_id === match.value?.away_club_id && 
    ['goal', 'yellow_card', 'red_card'].includes(e.type)
  );
});

function startTimer() {
  stopTimer();
  if (match.value?.start_time) {
    // Đảm bảo thời gian từ DB được hiểu đúng là chuẩn UTC (tránh lệch 7 tiếng khi refresh)
    let startTimeStr = match.value.start_time;
    if (!startTimeStr.includes('Z') && !startTimeStr.includes('+')) {
      startTimeStr = startTimeStr.replace(' ', 'T') + 'Z';
    }
    const startMs = new Date(startTimeStr).getTime();
    const nowMs = Date.now();
    timerSeconds.value = Math.floor((nowMs - startMs) / 1000);
  }
  timerInterval = setInterval(() => { timerSeconds.value++; }, 1000);
}
function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

async function loadAll() {
  loading.value = true;
  const r = await matchRepository.findByIdWithDetails(route.params.id);
  if (r.isOk()) {
    match.value = r.getValue();
    if (match.value.status === 'in_progress') startTimer();
    // Load events
    const evR = await matchRepository.getMatchEvents(match.value.id);
    if (evR.isOk()) events.value = evR.getValue();
    // Load attendance
    const attR = await matchRepository.getMatchAttendance(match.value.id);
    if (attR.isOk()) {
      const attData = attR.getValue();
      attendance.value = attData;
      // Initialize local results
      attData.forEach(a => {
        localResults[a.id] = a.result_value;
      });
    }
    // Load players
    if (match.value.home_club_id) {
      const hp = await matchRepository.getClubMembers(match.value.home_club_id);
      if (hp.isOk()) homePlayers.value = hp.getValue();
    } else if (match.value.home_user) {
      homePlayers.value = [{ user: match.value.home_user }];
    }
    
    if (match.value.away_club_id) {
      const ap = await matchRepository.getClubMembers(match.value.away_club_id);
      if (ap.isOk()) awayPlayers.value = ap.getValue();
    } else if (match.value.away_user) {
      awayPlayers.value = [{ user: match.value.away_user }];
    }
  }
  loading.value = false;
}

async function updateMatchStatus(status, extra = {}) {
  saving.value = true;
  const r = await matchRepository.updateStatus(match.value.id, status, extra);
  if (r.isOk()) {
    match.value = { ...match.value, status, ...extra };
    // Add system event
    await matchRepository.addMatchEvent({
      match_id: match.value.id,
      type: status === 'in_progress' && !extra.start_time ? 'resume' : status === 'in_progress' ? 'start' : status === 'paused' ? 'pause' : 'end',
      minute: Math.floor(timerSeconds.value / 60),
      description: statusText.value
    });
    const evR = await matchRepository.getMatchEvents(match.value.id);
    if (evR.isOk()) events.value = evR.getValue();
  }
  saving.value = false;
}

async function doStart() { 
  if (!match.value.referee_id) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Trận đấu này chưa được phân công trọng tài.', life: 3000 });
    return;
  }
  startTimer(); 
  await updateMatchStatus('in_progress', { start_time: new Date().toISOString() }); 
}
async function doPause() { stopTimer(); await updateMatchStatus('paused'); }
async function doResume() { startTimer(); await updateMatchStatus('in_progress'); }

async function doEnd() {
  confirm.require({
    message: 'Bạn có chắc muốn kết thúc lượt thi đấu và chốt kết quả?',
    header: 'Xác nhận',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      // Knockout format check: must have a winner (skip for single heat)
      if (match.value.tournament?.format === 'knockout' && !isSingleHeat.value) {
        if (match.value.home_score === match.value.away_score) {
          toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Trận đấu loại trực tiếp không được phép hòa.', life: 3000 });
          return;
        }
      }

      stopTimer();
      await updateMatchStatus('completed', { end_time: new Date().toISOString(), duration_seconds: timerSeconds.value });

      // Post-match tournament logic
      if (isSingleHeat.value) {
        // For single heat, we just finalize the tournament standings
        const fin = await checkAndFinalizeTournament(match.value.tournament_id || match.value.tournament?.id);
        if (fin.success) {
          toast.add({ severity: 'success', summary: 'Hoàn tất', detail: 'Giải đấu đã kết thúc và chốt kết quả chung cuộc', life: 5000 });
        } else {
          toast.add({ severity: 'error', summary: 'Lỗi chốt giải', detail: fin.error || 'Không thể cập nhật trạng thái giải đấu', life: 5000 });
        }
      } else if (match.value.tournament?.format === 'knockout') {
        await advanceKnockoutWinner(match.value.id);
      } else if (match.value.tournament?.format === 'round_robin' || match.value.tournament?.format === 'group_stage') {
        const fin = await checkAndFinalizeTournament(match.value.tournament_id || match.value.tournament?.id);
        if (fin.success) {
          toast.add({ severity: 'success', summary: 'Hoàn tất', detail: 'Vòng đấu đã được cập nhật', life: 3000 });
        } else {
          toast.add({ severity: 'error', summary: 'Lỗi cập nhật', detail: fin.error || 'Không thể cập nhật trạng thái vòng đấu', life: 5000 });
        }
      }
    }
  });
}

function openEventModal(type, side) {
  modalType.value = type;
  modalSide.value = side;
  const homeId = match.value.home_club_id || match.value.home_user_id;
  const awayId = match.value.away_club_id || match.value.away_user_id;
  modalClubId.value = side === 'home' ? homeId : side === 'away' ? awayId : homeId;
  modalPlayerId.value = '';
  modalMinute.value = Math.floor(timerSeconds.value / 60);
  modalDesc.value = '';
  showModal.value = true;
}

async function submitEvent() {
  if (!modalPlayerId.value) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng chọn cầu thủ thực hiện.', life: 3000 });
    return;
  }
  if (modalMinute.value === null || modalMinute.value === undefined || modalMinute.value < 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập phút xảy ra sự kiện.', life: 3000 });
    return;
  }

  const currentMinute = Math.floor(timerSeconds.value / 60);
  if (modalMinute.value > currentMinute) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: `Không thể ghi nhận sự kiện ở phút ${modalMinute.value}.`, life: 3000 });
    return;
  }
  
  saving.value = true;
  const isIndividual = match.value.tournament?.participant_type === 'individual';
  
  const evData = {
    match_id: match.value.id,
    type: modalType.value,
    club_id: isIndividual ? null : (modalClubId.value || null),
    player_id: modalPlayerId.value || null,
    minute: modalMinute.value,
    second: modalMinute.value === 0 ? (timerSeconds.value % 60) : 0,
    description: modalDesc.value || modalTitle.value
  };
  
  const r = await matchRepository.addMatchEvent(evData);
  if (r.isOk()) {
    events.value.push(r.getValue());
    events.value.sort((a,b) => a.minute - b.minute);
    
    if (modalType.value === 'goal') {
      const homeId = match.value.home_club_id || match.value.home_user_id;
      const isHome = modalClubId.value === homeId;
      const newHome = (match.value.home_score ?? 0) + (isHome ? 1 : 0);
      const newAway = (match.value.away_score ?? 0) + (isHome ? 0 : 1);
      const scoreR = await matchRepository.updateScore(match.value.id, newHome, newAway);
      if (scoreR.isOk()) {
        match.value = { ...match.value, home_score: newHome, away_score: newAway };
      } else {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi cập nhật tỉ số', life: 3000 });
      }
    }
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã ghi nhận sự kiện', life: 2000 });
  } else {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: r.getError(), life: 5000 });
  }
  showModal.value = false;
  saving.value = false;
}

async function removeEvent(evId) {
  confirm.require({
    message: 'Bạn có chắc chắn muốn xóa sự kiện này?',
    header: 'Xác nhận xóa',
    icon: 'pi pi-trash',
    accept: async () => {
      const ev = events.value.find(e => e.id === evId);
      await matchRepository.deleteMatchEvent(evId);
      events.value = events.value.filter(e => e.id !== evId);
      if (ev?.type === 'goal') {
        const homeId = match.value.home_club_id || match.value.home_user_id;
        const isHome = ev.club_id === homeId;
        const newHome = Math.max(0, (match.value.home_score ?? 0) - (isHome ? 1 : 0));
        const newAway = Math.max(0, (match.value.away_score ?? 0) - (isHome ? 0 : 1));
        await matchRepository.updateScore(match.value.id, newHome, newAway);
        match.value = { ...match.value, home_score: newHome, away_score: newAway };
      }
      toast.add({ severity: 'info', summary: 'Thông báo', detail: 'Đã xóa sự kiện', life: 2000 });
    }
  });
}

async function toggleAttendance(playerId, clubId, e) {
  const present = e.target.checked;
  const r = await matchRepository.upsertAttendance(match.value.id, playerId, clubId, present);
  if (r.isOk()) {
    const idx = attendance.value.findIndex(a => a.player_id === playerId);
    if (idx >= 0) {
      attendance.value[idx].is_present = present;
    } else {
      // Re-fetch to get complete object
      const attR = await matchRepository.getMatchAttendance(match.value.id);
      if (attR.isOk()) attendance.value = attR.getValue();
    }
  }
}

async function updateHeatResult(att, value) {
  if (!att?.id) return;
  
  // Update local state immediately for responsiveness
  localResults[att.id] = value;
  
  if (value === null || value === undefined || value === '') {
    await matchRepository.updateResultValueById(att.id, null);
    return;
  }

  const numVal = parseFloat(value.toString().replace(',', '.'));
  if (isNaN(numVal)) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập số hợp lệ', life: 2000 });
    return;
  }
  
  try {
    const r = await matchRepository.updateResultValueById(att.id, numVal);
    if (r.isOk()) {
      // Sync back to master list if needed, but localResults remains the source for the input
      att.result_value = numVal;
      localResults[att.id] = numVal;
      toast.add({ severity: 'success', summary: 'Đã lưu', detail: `Kết quả: ${numVal}`, life: 1000 });
    } else {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: r.getError(), life: 3000 });
    }
  } catch (err) {
    console.error('Update error:', err);
  }
}

onMounted(loadAll);
onUnmounted(stopTimer);
</script>

<style scoped>
.ref-page { min-height:100vh; padding:1.5rem 1rem 3rem; }
.shell { max-width:900px; margin:0 auto; display:flex; flex-direction:column; gap:1.25rem; }
.center-msg { text-align:center; padding:4rem; color:rgba(255,255,255,0.4); }

/* Top Bar */
.top-bar { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
.btn-back { display:flex; align-items:center; gap:0.3rem; padding:0.4rem 0.8rem; border-radius:0.5rem; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.7); font-size:0.8rem; text-decoration:none; }
.match-status-badge { padding:0.3rem 0.8rem; border-radius:999px; font-size:0.75rem; font-weight:700; }
.s-scheduled { background:rgba(107,114,128,0.2); color:#d1d5db; }
.s-in_progress { background:rgba(34,197,94,0.2); color:#86efac; }
.s-paused { background:rgba(251,191,36,0.2); color:#fde68a; }
.s-completed { background:rgba(99,102,241,0.2); color:#a5b4fc; }
.timer { margin-left:auto; font-size:1.25rem; font-weight:800; color:#4ade80; font-variant-numeric:tabular-nums; }

/* Scoreboard */
.scoreboard { display:flex; align-items:center; justify-content:center; gap:2rem; padding:2rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:1.5rem; }
.sb-team { display:flex; flex-direction:column; align-items:center; gap:0.5rem; flex:1; }
.sb-logo { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2)); border:2px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-weight:700; color:white; overflow:hidden; font-size:1rem; }
.sb-logo img { width:100%; height:100%; object-fit:cover; }
.sb-name { font-size:0.9rem; font-weight:600; color:white; text-align:center; }
.sb-score { display:flex; flex-direction:column; align-items:center; gap:0.25rem; }
.sc-num { font-size:3rem; font-weight:900; color:white; line-height:1; }
.sc-sep { font-size:2rem; color:rgba(255,255,255,0.3); }
.sc-label { font-size:0.7rem; color:rgba(255,255,255,0.4); margin-top:0.25rem; }

.sb-events {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.75rem;
  width: 100%;
}
.sb-ev-item {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sb-team:first-child .sb-ev-item { text-align: right; }
.sb-team:last-child .sb-ev-item { text-align: left; }

/* Controls */
.controls { display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap; }
.ctrl-btn { display:flex; align-items:center; gap:0.4rem; padding:0.7rem 1.5rem; border-radius:0.75rem; font-weight:700; font-size:0.9rem; color:white; border:none; cursor:pointer; transition:all 0.2s; }
.ctrl-btn:hover { transform:translateY(-2px); }
.ctrl-btn.green { background:linear-gradient(135deg,#16a34a,#22c55e); box-shadow:0 4px 16px rgba(34,197,94,0.3); }
.ctrl-btn.yellow { background:linear-gradient(135deg,#d97706,#f59e0b); box-shadow:0 4px 16px rgba(245,158,11,0.3); }
.ctrl-btn.blue { background:linear-gradient(135deg,#2563eb,#3b82f6); box-shadow:0 4px 16px rgba(59,130,246,0.3); }
.ctrl-btn.red { background:linear-gradient(135deg,#dc2626,#ef4444); box-shadow:0 4px 16px rgba(239,68,68,0.3); }

/* Tabs */
.tab-bar { display:flex; gap:0.5rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.5rem; }
.tab-btn { display:flex; align-items:center; gap:0.35rem; padding:0.5rem 1rem; border-radius:0.5rem 0.5rem 0 0; background:transparent; border:none; color:rgba(255,255,255,0.4); font-size:0.85rem; font-weight:600; cursor:pointer; }
.tab-btn.active { color:#60a5fa; border-bottom:2px solid #60a5fa; }

/* Panel */
.panel { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:1rem; padding:1.25rem; }
.panel-title { font-size:1rem; font-weight:700; color:white; margin:0 0 1rem; }

/* Event Actions */
.event-actions { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:0.5rem; }
.ev-btn { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 0.75rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:0.625rem; color:white; font-size:0.8rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.ev-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.15); }
.ev-icon { font-size:1.1rem; }

/* Timeline */
.timeline { display:flex; flex-direction:column; gap:0.4rem; }
.tl-item { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0.75rem; background:rgba(255,255,255,0.03); border-radius:0.5rem; }
.tl-min { width:32px; text-align:center; font-size:0.8rem; font-weight:700; color:#fbbf24; flex-shrink:0; }
.tl-icon { font-size:1rem; flex-shrink:0; }
.tl-body { flex:1; display:flex; flex-direction:column; min-width:0; }
.tl-player { font-size:0.8rem; font-weight:600; color:white; }
.tl-desc { font-size:0.72rem; color:rgba(255,255,255,0.45); }
.tl-club { font-size:0.68rem; color:rgba(255,255,255,0.3); }
.tl-del { width:24px; height:24px; border-radius:4px; background:rgba(239,68,68,0.15); border:none; color:#fca5a5; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.65rem; flex-shrink:0; }

/* Attendance */
.att-section { margin-bottom:1.25rem; }
.att-club { font-size:0.9rem; font-weight:700; color:#a5b4fc; margin:0 0 0.5rem; }
.att-row { display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.02); border-radius:0.4rem; margin-bottom:0.25rem; }
.att-name { font-size:0.8rem; color:white; }
.att-check { position:relative; cursor:pointer; }
.att-check input { width:18px; height:18px; accent-color:#4ade80; cursor:pointer; }

.empty-sm { text-align:center; padding:1.5rem; color:rgba(255,255,255,0.3); font-size:0.85rem; }

/* Modal */
.modal-overlay { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); padding:1rem; }
.modal-box { width:min(440px,100%); background:rgba(15,12,45,0.95); border:1px solid rgba(255,255,255,0.12); border-radius:1.25rem; padding:1.5rem; }
.modal-box h3 { font-size:1.1rem; font-weight:700; color:white; margin:0 0 1rem; }
.modal-form { display:flex; flex-direction:column; gap:0.75rem; }
.modal-form label { display:flex; flex-direction:column; gap:0.3rem; color:rgba(255,255,255,0.7); font-size:0.8rem; font-weight:600; }
.modal-form input, .modal-form select { padding:0.6rem 0.8rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:0.5rem; color:white; font:inherit; }
.modal-form select option { background:#1e1b4b; color:white; }
.modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; }
.btn-cancel { padding:0.5rem 1rem; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); border-radius:0.5rem; color:rgba(255,255,255,0.7); cursor:pointer; font-weight:600; font-size:0.85rem; }
.btn-submit { display:flex; align-items:center; gap:0.4rem; padding:0.5rem 1.25rem; background:linear-gradient(135deg,#2563eb,#7c3aed); border:none; border-radius:0.5rem; color:white; font-weight:600; cursor:pointer; font-size:0.85rem; }

.sb-score { display:flex; align-items:center; gap:0.5rem; flex-direction:row; flex-wrap:wrap; justify-content:center; }
.sc-label { width:100%; }

@media(max-width:600px) {
  .scoreboard { flex-direction:column; gap:1rem; }
  .sb-score { flex-direction:row; }
  .event-actions { grid-template-columns:1fr; }
}
.text-red-500 { color: #ef4444; }

.card-icon {
  display: inline-block;
  width: 10px;
  height: 14px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}
.card-icon.yellow { background-color: #fbbf24; box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
.card-icon.red { background-color: #ef4444; box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
.card-icon.large {
  width: 14px;
  height: 20px;
  margin-right: 8px;
}

/* Heat Table Styles */
.heat-table-wrapper { overflow-x: auto; margin-top: 1rem; border-radius: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); }
.heat-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.heat-table th { text-align: left; padding: 1rem; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px; }
.heat-table td { padding: 0.75rem 1rem; border-top: 1px solid rgba(255,255,255,0.05); color: white; vertical-align: middle; }
.p-info { display: flex; align-items: center; gap: 0.75rem; }
.p-av { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.1); }
.p-name { font-weight: 600; }
.res-input { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; font-weight: 700; text-align: right; }
.res-input:focus { outline: none; border-color: #60a5fa; background: rgba(255,255,255,0.08); }

/* Hide number input spinners */
.res-input::-webkit-outer-spin-button,
.res-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.res-input[type=number] {
  -moz-appearance: textfield;
}

.text-center { text-align: center; }
</style>
