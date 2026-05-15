<template>
  <div class="bracket-container" ref="bracketContainerRef">
    <div v-if="!matches || matches.length === 0" class="empty-state">
      <i class="pi pi-calendar-times"></i>
      <p>Chưa có lịch thi đấu</p>
    </div>

    <div v-else class="single-elim-layout" ref="layoutRef">
      <!-- ZOOM CONTROLS -->
      <div class="bracket-controls">
        <button @click="zoomOut" class="control-btn" title="Thu nhỏ">
          <i class="pi pi-minus"></i>
        </button>
        <div class="zoom-level">
          <i class="pi pi-search-plus mr-1"></i>
          {{ Math.round(scale * 100) }}%
        </div>
        <button @click="zoomIn" class="control-btn" title="Phóng to">
          <i class="pi pi-plus"></i>
        </button>
        <button @click="resetZoom" class="control-btn" title="Đặt lại">
          <i class="pi pi-refresh"></i>
        </button>
      </div>

      <!-- SCROLLABLE AREA -->
      <div 
        class="bracket-scroll-wrapper" 
        ref="scrollWrapperRef"
        @wheel="handleWheel"
        @mousedown="startDragging"
        @mousemove="onDragging"
        @mouseup="stopDragging"
        @mouseleave="stopDragging"
      >
        <div class="zoom-content" :style="bracketStyle">
          <!-- SVG LINES OVERLAY -->
          <svg class="bracket-lines-overlay" :width="svgSize.width" :height="svgSize.height">
            <g v-for="line in bracketLines" :key="line.id">
              <path :d="line.path" :class="['bracket-line', { 'winner-line': line.isWinner }]" />
              <!-- Arrow head -->
              <polygon v-if="line.isWinner" :points="line.arrowPoints" class="bracket-arrow" />
            </g>
          </svg>
          <!-- MAIN BRACKET FLOW -->
          <div class="rounds-flow">
            <div v-for="round in allRounds" :key="'round-' + round.num" class="round-column">
              <div class="round-col-header">{{ round.name }}</div>
              <div class="round-col-matches">
                <MatchCard v-for="match in round.matches" :key="match.id"
                  :match="match" 
                  :participantType="participantType" 
                  :allMatches="matches" 
                  :adminMode="adminMode"
                  @assign-referee="(m) => $emit('assign-referee', m)"
                />
              </div>
            </div>

            <!-- FINALS COLUMN -->
            <div v-if="finalAndThirdPlace.length" class="round-column finals-column">
              <div class="round-col-header">CHUNG KẾT & TRANH HẠNG 3</div>
              <div class="round-col-matches">
                <MatchCard v-for="match in finalAndThirdPlace" :key="match.id"
                  :match="match" 
                  :participantType="participantType" 
                  :allMatches="matches" 
                  :adminMode="adminMode"
                  @assign-referee="(m) => $emit('assign-referee', m)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h, defineComponent, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['assign-referee']);
const router = useRouter();

const bracketContainerRef = ref(null);
const layoutRef = ref(null);
const bracketLines = ref([]);
const svgSize = ref({ width: 0, height: 0 });
const scale = ref(1);

const bracketStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'left top',
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
}));

const zoomIn = () => {
  if (scale.value < 2) scale.value = Math.min(2, scale.value + 0.1);
};

const zoomOut = () => {
  if (scale.value > 0.5) scale.value = Math.max(0.5, scale.value - 0.1);
};

const resetZoom = () => {
  scale.value = 1;
};

const handleWheel = (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }
};

// Panning functionality
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const scrollLeft = ref(0);
const scrollTop = ref(0);
const scrollWrapperRef = ref(null);

const startDragging = (e) => {
  if (e.target.closest('.match-card')) return; // Don't pan if clicking a card
  isDragging.value = true;
  startX.value = e.pageX - scrollWrapperRef.value.offsetLeft;
  startY.value = e.pageY - scrollWrapperRef.value.offsetTop;
  scrollLeft.value = scrollWrapperRef.value.scrollLeft;
  scrollTop.value = scrollWrapperRef.value.scrollTop;
};

const stopDragging = () => {
  isDragging.value = false;
};

const onDragging = (e) => {
  if (!isDragging.value) return;
  e.preventDefault();
  const x = e.pageX - scrollWrapperRef.value.offsetLeft;
  const y = e.pageY - scrollWrapperRef.value.offsetTop;
  const walkX = (x - startX.value);
  const walkY = (y - startY.value);
  scrollWrapperRef.value.scrollLeft = scrollLeft.value - walkX;
  scrollWrapperRef.value.scrollTop = scrollTop.value - walkY;
};

const props = defineProps({
  matches: { type: Array, default: () => [] },
  participantType: { type: String, default: 'club' },
  adminMode: { type: Boolean, default: false }
});

// ========== MATCH CARD COMPONENT ==========
const MatchCard = defineComponent({
  props: {
    match: Object,
    participantType: String,
    allMatches: Array,
    adminMode: Boolean
  },
  emits: ['assign-referee'],
  setup(props, { emit }) {
    const badgeInfo = computed(() => {
      const mt = props.match.match_type;
      const map = {
        'preliminary':  { label: 'VÒNG SƠ LOẠI',    cls: 'badge-pre' },
        'round_of_16':  { label: 'VÒNG 1/8',        cls: 'badge-regular' },
        'quarterfinal': { label: 'TỨ KẾT',          cls: 'badge-regular' },
        'semifinal':    { label: 'BÁN KẾT',          cls: 'badge-semi' },
        'final':        { label: '🏆 CHUNG KẾT',    cls: 'badge-final' },
        'third_place':  { label: '🥉 TRANH HẠNG 3', cls: 'badge-third' },
      };
      return map[mt] || { label: 'VÒNG ĐẤU', cls: 'badge-regular' };
    });

    const getTeamName = (side) => {
      const m = props.match;
      const team = side === 'home' ? (m.home_club || m.home_user) : (m.away_club || m.away_user);
      return team?.name || team?.full_name || '';
    };

    const getTeamLogo = (side) => {
      const m = props.match;
      const team = side === 'home' ? (m.home_club || m.home_user) : (m.away_club || m.away_user);
      return team?.logo_url || team?.avatar_url || null;
    };

    const getSourceLabel = (side) => {
      const m = props.match;
      const parents = (props.allMatches || []).filter(pm => pm.next_match_id === m.id);
      if (parents.length > 0) {
        const sorted = [...parents].sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0));
        const p = side === 'home' ? sorted[0] : sorted[1];
        if (p) return `Thắng trận ${p.displayIdx || '?'}`;
      }
      
      const loserParents = (props.allMatches || []).filter(pm => pm.loser_next_match_id === m.id);
      if (loserParents.length > 0) {
        const sorted = [...loserParents].sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0));
        const p = side === 'home' ? sorted[0] : sorted[1];
        if (p) return `Thua trận ${p.displayIdx || '?'}`;
      }

      return 'Chờ xác định';
    };

    const isWinner = (side) => {
      const m = props.match;
      if (m.status !== 'completed') return false;
      return side === 'home' ? m.home_score > m.away_score : m.away_score > m.home_score;
    };

    const handleCardClick = () => {
      router.push(`/matches/${props.match.id}`);
    };

    return () => {
      const m = props.match;
      const bi = badgeInfo.value;
      const iconCls = props.participantType === 'individual' ? 'pi pi-user' : 'pi pi-shield';

      const teamRow = (side) => {
        const name = getTeamName(side) || getSourceLabel(side);
        const logo = getTeamLogo(side);
        const won = isWinner(side);
        const score = m[side + '_score'];

        // Card counts
        const events = m.events || [];
        const sideId = side === 'home' 
          ? (m.home_club_id || m.home_user_id) 
          : (m.away_club_id || m.away_user_id);
          
        const yellowCount = events.filter(e => 
          (e.club_id === sideId || e.player_id === sideId) && e.type === 'yellow_card'
        ).length;
        
        const redCount = events.filter(e => 
          (e.club_id === sideId || e.player_id === sideId) && e.type === 'red_card'
        ).length;

        const rowId = `team-${m.id}-${side}`;
        return h('div', { id: rowId, class: ['team-row', { winner: won }] }, [
          h('div', { class: 'team-logo' }, [
            logo ? h('img', { src: logo }) : h('i', { class: iconCls })
          ]),
          h('span', { class: ['team-name', { placeholder: !getTeamName(side) }] }, name),
          
          // Cards container
          h('div', { class: 'team-cards' }, [
            yellowCount > 0 ? h('span', { class: 'card-icon yellow', title: 'Thẻ vàng' }, yellowCount) : null,
            redCount > 0 ? h('span', { class: 'card-icon red', title: 'Thẻ đỏ' }, redCount) : null
          ]),

          h('span', { class: 'team-score' }, score ?? '-')
        ]);
      };

      const hasWinner = isWinner('home') || isWinner('away');
      const winnerSide = isWinner('home') ? 'home' : (isWinner('away') ? 'away' : null);
      
      const bracketPos = props.match.bracket_position ?? 0;
      const posClass = bracketPos % 2 === 0 ? 'pos-top' : 'pos-bottom';

        const canSetReferee = (match) => {
          if (!match) return false;
          if (match.status === 'completed' || match.status === 'finished') return false;
          return true;
        };

        return h('div', { 
          id: `match-${m.id}`,
          class: ['match-card', m.match_type + '-card', posClass, { 'is-clickable': true, 'has-winner': hasWinner }],
          'data-winner': winnerSide,
          onClick: handleCardClick 
        }, [
          h('div', { class: 'card-top' }, [
            h('span', { class: ['match-badge', bi.cls] }, bi.label),
            h('span', { class: 'card-meta' }, `${m.match_time || ''}`)
          ]),
          h('div', { class: 'card-teams' }, [teamRow('home'), teamRow('away')]),

          // Referee Info & Actions
          h('div', { class: 'card-footer' }, [
            h('div', { class: 'referee-info' }, [
              h('i', { class: 'pi pi-user-edit' }),
              h('span', { class: 'ref-name' }, m.referee?.full_name || m.referee_name || 'Chưa có trọng tài')
            ]),
            props.adminMode && canSetReferee(m) ? h('button', { 
              class: 'ref-assign-btn',
              title: 'Phân công trọng tài',
              onClick: (e) => {
                e.stopPropagation();
                emit('assign-referee', m);
              }
            }, [
              h('i', { class: 'pi pi-cog' })
            ]) : null
          ])
        ]);
    };
  }
});

// ========== COMPUTED DATA ==========
const allRounds = computed(() => {
  const winnerMatches = (props.matches || []).filter(m => m.bracket_type === 'winner' && m.match_type !== 'final' && m.match_type !== 'third_place');
  const g = {};
  winnerMatches.forEach(m => { const r = m.round || 1; (g[r] = g[r] || []).push(m); });
  
  return Object.keys(g).sort((a,b) => a - b).map(r => {
    const ms = g[r].sort((a,b) => (a.bracket_position || 0) - (b.bracket_position || 0));
    let name = `VÒNG ${r}`;
    const mt = ms[0]?.match_type;
    if (mt === 'preliminary') name = 'VÒNG SƠ LOẠI';
    else if (mt === 'round_of_16') name = 'VÒNG 1/8';
    else if (mt === 'quarterfinal') name = 'TỨ KẾT';
    else if (mt === 'semifinal') name = 'BÁN KẾT';
    
    return { num: r, name, matches: ms };
  });
});

const finalAndThirdPlace = computed(() => {
  return (props.matches || [])
    .filter(m => m.match_type === 'final' || m.match_type === 'third_place')
    .sort((a, b) => {
      if (a.match_type === 'third_place') return -1;
      return 1;
    });
});

// ========== SVG LINE DRAWING LOGIC ==========
function getRelativePos(el, parent) {
  let x = 0;
  let y = 0;
  let current = el;
  while (current && current !== parent && current !== document.body) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent;
  }
  return { x, y };
}

const updateLines = () => {
  if (!bracketContainerRef.value || !layoutRef.value) return;
  
  // Size SVG to cover the entire layout
  svgSize.value = { 
    width: layoutRef.value.offsetWidth, 
    height: layoutRef.value.offsetHeight 
  };

  const lines = [];

  props.matches.forEach(m => {
    if (m.next_match_id) {
      const nextM = props.matches.find(nm => nm.id === m.next_match_id);
      if (!nextM) return;

      let winnerSide = null;
      if (m.status === 'completed') {
        if (m.home_score > m.away_score) winnerSide = 'home';
        else if (m.away_score > m.home_score) winnerSide = 'away';
      }
      
      const parents = props.matches.filter(pm => pm.next_match_id === nextM.id).sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0));
      const isHomeInNext = parents.length > 0 && parents[0].id === m.id;
      const targetSide = isHomeInNext ? 'home' : 'away';

      let startEl = document.getElementById(`team-${m.id}-${winnerSide || 'home'}`);
      if (!winnerSide) {
        // If no winner yet, draw from the right center of the match card
        startEl = document.getElementById(`match-${m.id}`);
      }
      
      const endEl = document.getElementById(`team-${nextM.id}-${targetSide}`);

      if (startEl && endEl) {
        const layoutEl = layoutRef.value;
        const startPos = getRelativePos(startEl, layoutEl);
        const endPos = getRelativePos(endEl, layoutEl);

        let startX, startY;
        if (winnerSide) {
          startX = startPos.x + startEl.offsetWidth + 10;
          startY = startPos.y + startEl.offsetHeight / 2;
        } else {
          startX = startPos.x + startEl.offsetWidth;
          startY = startPos.y + startEl.offsetHeight / 2;
        }
        
        const endX = endPos.x - 10;
        const endY = endPos.y + endEl.offsetHeight / 2;

        const midX = startX + (endX - startX) / 2;
        
        // Smooth bezier curve connecting exact rows
        const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

        const arrowSize = 6;
        const arrowPoints = `${endX},${endY} ${endX - arrowSize},${endY - arrowSize} ${endX - arrowSize},${endY + arrowSize}`;

        lines.push({
          id: `${m.id}-${nextM.id}`,
          path,
          arrowPoints,
          isWinner: !!winnerSide
        });
      }
    }
  });
  bracketLines.value = lines;
};

onMounted(() => {
  window.addEventListener('resize', updateLines);
  setTimeout(() => {
    updateLines();
    setTimeout(updateLines, 1000); // Re-calculate after fonts/images load
  }, 200);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateLines);
});

watch(() => props.matches, () => {
  nextTick(() => setTimeout(updateLines, 200));
}, { deep: true });

</script>

<style>
.bracket-container { width: 100%; overflow: auto; padding: 20px 0; position: relative; min-height: 500px; }
.empty-state { padding: 4rem; text-align: center; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1); }

/* Zoom Controls */
.bracket-controls {
  position: sticky;
  left: 20px;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 16, 26, 0.8);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.control-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.control-btn:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.5);
  color: #a78bfa;
}
.zoom-level {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  min-width: 50px;
  text-align: center;
}

.bracket-scroll-wrapper {
  width: 100%;
  overflow: auto;
  padding-bottom: 40px;
  cursor: grab;
}
.bracket-scroll-wrapper:active { cursor: grabbing; }

.zoom-content {
  transform-origin: 0 0;
  width: max-content;
  position: relative;
}

.rounds-flow { display: flex; gap: 60px; padding: 0 40px; min-width: max-content; }
.round-column { display: flex; flex-direction: column; width: 280px; position: relative; }
.round-col-header { 
  font-size: 0.75rem; font-weight: 800; color: #a78bfa; text-align: center; 
  padding: 10px; background: rgba(139,92,246,0.1); border-radius: 8px; margin-bottom: 24px;
  text-transform: uppercase; letter-spacing: 1px;
  border: 1px solid rgba(139,92,246,0.2);
}
.round-col-matches { display: flex; flex-direction: column; gap: 30px; justify-content: space-around; flex: 1; }

/* Match Card */
.bracket-container .match-card {
  background: rgba(30,31,45,0.95); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 12px; transition: all 0.2s;
  position: relative;
  z-index: 2;
}
.bracket-container .match-card.is-clickable { cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.bracket-container .match-card.is-clickable:hover { 
  border-color: rgba(139, 92, 246, 0.4); 
  transform: translateY(-4px) scale(1.02); 
  box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 15px rgba(139, 92, 246, 0.2);
  background: rgba(255,255,255,0.08);
}

.bracket-container .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bracket-container .match-badge { font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
.bracket-container .badge-pre { background: rgba(245,158,11,0.2); color: #fbbf24; }
.bracket-container .badge-regular { background: rgba(139,92,246,0.2); color: #a78bfa; }
.bracket-container .badge-semi { background: rgba(16,185,129,0.2); color: #34d399; }
.bracket-container .badge-final { background: rgba(239,68,68,0.2); color: #f87171; }
.bracket-container .badge-third { background: rgba(59,130,246,0.2); color: #60a5fa; }
.bracket-container .card-meta { font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 600; }

.bracket-container .card-teams { display: flex; flex-direction: column; gap: 6px; }
.bracket-container .team-row { 
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; 
  border-radius: 8px; background: rgba(255,255,255,0.03); 
  position: relative;
  border: 1px solid transparent;
  transition: all 0.3s;
}
.bracket-container .team-row.winner { 
  background: rgba(16,185,129,0.15); 
  border-color: rgba(16,185,129,0.3);
  box-shadow: inset 0 0 10px rgba(16,185,129,0.05);
}
.bracket-container .team-row.winner .team-name { color: #34d399; }
.bracket-container .team-row.winner .team-score { color: #34d399; }

.bracket-container .team-logo { 
  width: 28px !important; height: 28px !important; border-radius: 50%; 
  overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.05); 
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,0.1);
}
.bracket-container .team-logo img { width: 100% !important; height: 100% !important; object-fit: cover; }
.bracket-container .team-name { flex: 1; font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bracket-container .team-name.placeholder { color: rgba(255,255,255,0.25); font-style: italic; font-size: 0.75rem; }

.bracket-container .team-cards { display: flex; gap: 4px; margin-right: 8px; }
.bracket-container .card-icon {
  width: 12px; height: 16px; border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: rgba(0,0,0,0.8);
}
.bracket-container .card-icon.yellow { background: #fbbf24; }
.bracket-container .card-icon.red { background: #ef4444; }

.bracket-container .team-score { font-size: 1rem; font-weight: 800; color: white; min-width: 24px; text-align: right; }

/* Winner Arrow */
.winner-flow-arrow {
  position: absolute;
  right: -25px;
  top: 50%;
  transform: translateY(-50%);
  color: #8b5cf6;
  font-size: 1.2rem;
  animation: arrow-bounce 1s infinite;
  z-index: 5;
}

@keyframes arrow-bounce {
  0%, 100% { transform: translate(0, -50%); opacity: 0.5; }
  50% { transform: translate(5px, -50%); opacity: 1; }
}

/* SVG Lines Overlay */
.bracket-container { position: relative; width: 100%; overflow-x: auto; padding: 20px 0; }
.single-elim-layout { position: relative; min-width: max-content; }

.bracket-lines-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.bracket-line {
  fill: none;
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 2px;
  transition: all 0.3s;
}

.winner-line {
  stroke: #8b5cf6;
  stroke-width: 3px;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
}

.bracket-arrow {
  fill: #8b5cf6;
  transition: all 0.3s;
}

.bracket-line.winner-line {
  stroke: #8b5cf6;
  stroke-width: 3px;
  filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.5));
}

.bracket-arrow {
  fill: #8b5cf6;
  filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.5));
}

/* Card Footer & Referee */
.bracket-container .card-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bracket-container .referee-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}
.bracket-container .referee-info i {
  color: #fbbf24;
  font-size: 0.75rem;
}
.bracket-container .ref-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}
.bracket-container .ref-assign-btn {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.bracket-container .ref-assign-btn:hover {
  background: #8b5cf6;
  color: white;
  transform: scale(1.1);
}
</style>

