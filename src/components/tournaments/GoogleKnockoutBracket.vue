<template>
  <div class="bracket-container">
    <div v-if="!matches || matches.length === 0" class="empty-state">
      <i class="pi pi-calendar-times"></i>
      <p>Chưa có lịch thi đấu</p>
    </div>

    <div v-else class="single-elim-layout">
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

        <!-- FINALS COLUMN (CHUNG KẾT & TRANH HẠNG 3) -->
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
</template>

<script setup>
import { computed, h, defineComponent } from 'vue';

const emit = defineEmits(['assign-referee']);

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

        return h('div', { class: ['team-row', { winner: won }] }, [
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

      return h('div', { class: ['match-card', m.match_type + '-card'] }, [
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
          props.adminMode ? h('button', { 
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
  
  const winnerRounds = Object.keys(g).map(k => parseInt(k));
  const maxR = Math.max(...winnerRounds, 0);
  
  return Object.keys(g).sort((a,b) => a - b).map(r => {
    const ms = g[r].sort((a,b) => (a.bracket_position || 0) - (b.bracket_position || 0));
    let name = `VÒNG ${r}`;
    const mt = ms[0]?.match_type;
    const fromEnd = maxR - r + 1;
    
    if (mt === 'preliminary') name = 'VÒNG SƠ LOẠI';
    else if (fromEnd === 1) name = 'BÁN KẾT';
    else if (fromEnd === 2) name = 'TỨ KẾT';
    else if (fromEnd === 3) name = 'VÒNG 1/8';
    
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
</script>

<style>
.bracket-container { width: 100%; overflow-x: auto; padding: 20px 0; }
.empty-state { padding: 4rem; text-align: center; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1); }
.rounds-flow { display: flex; gap: 40px; padding: 0 20px; min-width: max-content; }
.round-column { display: flex; flex-direction: column; width: 280px; }
.round-col-header { 
  font-size: 0.75rem; font-weight: 800; color: #a78bfa; text-align: center; 
  padding: 10px; background: rgba(139,92,246,0.1); border-radius: 8px; margin-bottom: 24px;
  text-transform: uppercase; letter-spacing: 1px;
}
.round-col-matches { display: flex; flex-direction: column; gap: 20px; justify-content: space-around; flex: 1; }

/* Match Card */
.bracket-container .match-card {
  background: rgba(30,31,45,0.95); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 12px; transition: all 0.2s;
}
.bracket-container .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bracket-container .match-badge { font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
.bracket-container .badge-pre { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.bracket-container .badge-regular { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
.bracket-container .badge-semi { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.bracket-container .badge-final { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.bracket-container .badge-third { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.bracket-container .card-meta { font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 600; }

.bracket-container .card-teams { display: flex; flex-direction: column; gap: 4px; }
.bracket-container .team-row { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 6px; background: rgba(255,255,255,0.02); }
.bracket-container .team-row.winner { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
.bracket-container .team-logo { width: 24px !important; height: 24px !important; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
.bracket-container .team-logo img { width: 100% !important; height: 100% !important; object-fit: cover; }
.bracket-container .team-name { flex: 1; font-size: 0.8rem; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bracket-container .team-name.placeholder { color: rgba(255,255,255,0.3); font-style: italic; }

.bracket-container .team-cards { display: flex; gap: 4px; margin-right: 8px; }
.bracket-container .card-icon {
  width: 12px; height: 16px; border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: rgba(0,0,0,0.8);
}
.bracket-container .card-icon.yellow { background: #fbbf24; box-shadow: 0 0 8px rgba(251,191,36,0.4); }
.bracket-container .card-icon.red { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.4); }

.bracket-container .team-score { font-size: 0.9rem; font-weight: 800; color: white; min-width: 20px; text-align: right; }

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
