<template>
  <div class="bracket-container" @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag" ref="container">
    <div class="bracket-viewport" :style="{ transform: `translate(${scrollX}px, ${scrollY}px) scale(${zoom})` }">
      <div class="rounds-container">
        <div v-for="(round, rIdx) in bracketRounds" :key="rIdx" class="round-column">
          <div class="round-header">
            <span class="round-number">Vòng {{ rIdx + 1 }}</span>
            <span class="round-name">{{ getRoundName(rIdx, bracketRounds.length) }}</span>
          </div>
          <div class="matches-container">
            <div v-for="(match, mIdx) in round" :key="match.id" class="match-wrapper" :style="getMatchStyle(rIdx, mIdx)">
              <!-- Connector Lines -->
              <div v-if="rIdx > 0" class="line-in"></div>
              <div v-if="rIdx < bracketRounds.length - 1" class="line-out" :class="{ 'up': mIdx % 2 === 0, 'down': mIdx % 2 !== 0 }"></div>
              
              <div class="match-node" :class="{ 'is-completed': match.status === 'completed' }">
                <div class="team-row home" :class="{ 'winner': isWinner(match, 'home'), 'bye': !match.home_club_id && !match.home_user_id }">
                  <div class="team-meta">
                    <img v-if="getTeamLogo(match, 'home')" :src="getTeamLogo(match, 'home')" class="mini-logo" />
                    <div v-else class="placeholder-logo"><i class="pi pi-shield"></i></div>
                    <span class="name-text">{{ getTeamName(match, 'home') }}</span>
                  </div>
                  <span class="score-text">{{ match.home_score ?? '-' }}</span>
                </div>
                
                <div class="match-divider"></div>
                
                <div class="team-row away" :class="{ 'winner': isWinner(match, 'away'), 'bye': !match.away_club_id && !match.away_user_id }">
                  <div class="team-meta">
                    <img v-if="getTeamLogo(match, 'away')" :src="getTeamLogo(match, 'away')" class="mini-logo" />
                    <div v-else class="placeholder-logo"><i class="pi pi-shield"></i></div>
                    <span class="name-text">{{ getTeamName(match, 'away') }}</span>
                  </div>
                  <span class="score-text">{{ match.away_score ?? '-' }}</span>
                </div>

                <div class="match-footer">
                  <span>{{ match.match_time }} | {{ formatDate(match.match_date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Controls -->
    <div class="bracket-controls">
      <button class="ctrl-btn" @click="adjustZoom(0.1)"><i class="pi pi-plus"></i></button>
      <button class="ctrl-btn" @click="adjustZoom(-0.1)"><i class="pi pi-minus"></i></button>
      <button class="ctrl-btn" @click="resetView"><i class="pi pi-refresh"></i></button>
      <div class="drag-hint"><i class="pi pi-arrows-alt"></i> Kéo để di chuyển</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  matches: { type: Array, default: () => [] },
  participantType: { type: String, default: 'club' }
});

const container = ref(null);
const scrollX = ref(40);
const scrollY = ref(40);
const zoom = ref(0.85);
const isDragging = ref(false);
const startPos = ref({ x: 0, y: 0 });

const startDrag = (e) => {
  isDragging.value = true;
  startPos.value = { x: e.clientX - scrollX.value, y: e.clientY - scrollY.value };
};
const onDrag = (e) => {
  if (!isDragging.value) return;
  scrollX.value = e.clientX - startPos.value.x;
  scrollY.value = e.clientY - startPos.value.y;
};
const stopDrag = () => { isDragging.value = false; };
const adjustZoom = (d) => { zoom.value = Math.max(0.4, Math.min(1.5, zoom.value + d)); };
const resetView = () => { scrollX.value = 40; scrollY.value = 40; zoom.value = 0.85; };

const bracketRounds = computed(() => {
  if (!props.matches || props.matches.length === 0) return [];
  
  const main = props.matches.filter(m => {
    const type = m.matchType || m.match_type;
    return type !== 'third_place';
  });

  const rounds = [];
  main.forEach(m => {
    const r = (m.round || m.Round || 1) - 1;
    if (!rounds[r]) rounds[r] = [];
    rounds[r].push(m);
  });
  
  const result = [];
  rounds.forEach(r => {
    if (r && r.length > 0) {
      r.sort((a, b) => {
        const posA = a.bracketPosition ?? a.bracket_position ?? 0;
        const posB = b.bracketPosition ?? b.bracket_position ?? 0;
        return posA - posB;
      });
      result.push(r);
    }
  });
  return result;
});

const getRoundLabel = (rIdx) => {
  const total = bracketRounds.value.length;
  const currentFromEnd = total - rIdx;
  
  if (currentFromEnd === 1) return 'Chung kết';
  if (currentFromEnd === 2) return 'Bán kết';
  if (currentFromEnd === 3) return 'Tứ kết';
  return 'Vòng loại';
};

const getMatchLabel = (match) => {
  const type = match.match_type || match.matchType;
  if (type === 'final') return 'Chung kết';
  if (type === 'semifinal') return 'Bán kết';
  if (type === 'quarterfinal') return 'Tứ kết';
  if (type === 'third_place') return 'Tranh hạng 3';
  return 'Vòng loại';
};

const getTeamName = (m, side) => {
  const t = side === 'home' ? m.home_club || m.home_user : m.away_club || m.away_user;
  return t?.name || t?.full_name || 'TBD';
};

const getTeamLogo = (m, side) => {
  const t = side === 'home' ? m.home_club || m.home_user : m.away_club || m.away_user;
  return t?.logo_url || t?.avatar_url;
};

const isWinner = (m, side) => {
  if (m.status !== 'completed' || !m.winner_id) return false;
  const id = side === 'home' ? (m.home_club_id || m.home_user_id) : (m.away_club_id || m.away_user_id);
  return m.winner_id === id;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';

const getMatchStyle = (rIdx, mIdx) => {
  // Vertical spacing increases with each round to center between parents
  const baseGap = 40;
  const matchHeight = 110;
  const factor = Math.pow(2, rIdx);
  const marginTop = (rIdx === 0) ? baseGap : (matchHeight * (factor - 1)) / 2 + (baseGap * factor) / 2;
  const marginBottom = (rIdx === 0) ? baseGap : marginTop;
  
  return {
    marginTop: `${marginTop}px`,
    marginBottom: `${marginBottom}px`
  };
};
</script>

<style scoped>
.bracket-container {
  width: 100%;
  height: 650px;
  background: #0f172a;
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
  cursor: grab;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.bracket-container:active { cursor: grabbing; }

.bracket-viewport {
  transform-origin: 0 0;
  transition: transform 0.05s linear;
  padding: 100px;
}

.rounds-container {
  display: flex;
  gap: 120px;
  align-items: flex-start;
}

.round-column {
  display: flex;
  flex-direction: column;
  min-width: 260px;
}

.round-header {
  margin-bottom: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.round-number {
  font-size: 0.75rem;
  color: #6366f1;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.round-name {
  font-size: 1.1rem;
  color: white;
  font-weight: 900;
}

.match-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.match-node {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 260px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.match-node:hover {
  border-color: rgba(99, 102, 241, 0.5);
  transform: scale(1.02);
  background: rgba(30, 41, 59, 0.9);
}

.team-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  transition: all 0.2s;
}

.team-row.winner {
  background: rgba(34, 197, 94, 0.15);
}

.team-row.winner .name-text {
  color: #4ade80;
  font-weight: 800;
}

.team-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.mini-logo, .placeholder-logo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.placeholder-logo i { color: rgba(255, 255, 255, 0.2); font-size: 0.9rem; }

.name-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

.score-text {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 900;
  color: white;
  margin-left: 12px;
  font-size: 1.1rem;
}

.match-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.match-footer {
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.2);
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Vertical Connector Lines */
.line-in {
  position: absolute;
  left: -120px;
  width: 120px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.line-out {
  position: absolute;
  right: -120px;
  width: 120px;
  background: transparent;
}

.line-out::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 60px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.line-out::after {
  content: '';
  position: absolute;
  left: 60px;
  width: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.line-out.up::after {
  top: 50%;
  height: calc(100% + 120px); /* Adjust based on gap */
}

.line-out.down::after {
  bottom: 50%;
  height: calc(100% + 120px);
}

.bracket-controls {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  background: #6366f1;
  transform: translateY(-2px);
}

.drag-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
