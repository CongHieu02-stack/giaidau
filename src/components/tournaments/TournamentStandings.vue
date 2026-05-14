<template>
  <div class="standings-root">
    <div v-if="loading" class="flex justify-center p-8">
      <i class="pi pi-spinner pi-spin text-2xl"></i>
    </div>

    <div v-else-if="groups && groups.length > 0" class="groups-standings">
      <div v-for="group in groups" :key="group.id" class="group-standings-card">
        <h3 class="group-name">{{ group.name }}</h3>
        <div class="table-container glass">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="rank">#</th>
                <th class="team">{{ tournament.participantType === 'individual' ? 'Vận động viên' : 'Đội bóng' }}</th>
                <th class="stat">Trận</th>
                <th class="stat">T</th>
                <th class="stat">H</th>
                <th class="stat">B</th>
                <th class="stat hide-mobile">BT</th>
                <th class="stat hide-mobile">BB</th>
                <th class="stat">HS</th>
                <th class="stat points">Điểm</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in getGroupStandings(group.id)" :key="team.clubId" class="team-row">
                <td class="rank">{{ team.rank }}</td>
                <td class="team">
                  <div class="team-info">
                    <img v-if="team.logoUrl" :src="team.logoUrl" class="team-logo" />
                    <div v-else class="team-logo-placeholder">{{ team.name[0] }}</div>
                    <span class="team-name">{{ team.name }}</span>
                  </div>
                </td>
                <td class="stat">{{ team.played }}</td>
                <td class="stat">{{ team.won }}</td>
                <td class="stat">{{ team.drawn }}</td>
                <td class="stat">{{ team.lost }}</td>
                <td class="stat hide-mobile">{{ team.gf }}</td>
                <td class="stat hide-mobile">{{ team.ga }}</td>
                <td class="stat" :class="{'positive': team.gd > 0, 'negative': team.gd < 0}">{{ team.gd > 0 ? '+' + team.gd : team.gd }}</td>
                <td class="stat points">{{ team.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="table-container glass">
      <table class="standings-table">
        <thead>
          <tr>
            <th class="rank">#</th>
            <th class="team">{{ tournament.participantType === 'individual' ? 'Vận động viên' : 'Đội bóng' }}</th>
            <th class="stat">Trận</th>
            <th class="stat">T</th>
            <th class="stat">H</th>
            <th class="stat">B</th>
            <th class="stat">HS</th>
            <th class="stat points">Điểm</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="team in standings" :key="team.clubId" class="team-row">
            <td class="rank">{{ team.rank }}</td>
            <td class="team">
              <div class="team-info">
                <img v-if="team.logoUrl" :src="team.logoUrl" class="team-logo" />
                <div v-else class="team-logo-placeholder">{{ team.name ? team.name[0] : '?' }}</div>
                <span class="team-name">{{ team.name }}</span>
              </div>
            </td>
            <td class="stat">{{ team.played }}</td>
            <td class="stat">{{ team.won }}</td>
            <td class="stat">{{ team.drawn }}</td>
            <td class="stat">{{ team.lost }}</td>
            <td class="stat">{{ team.gd }}</td>
            <td class="stat points">{{ team.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="rules-note mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
      <p class="text-xs text-white/60">
        <i class="pi pi-info-circle mr-1"></i>
        Quy tắc tính điểm: Thắng +2, Hòa +1, Thua -1. Xếp hạng đồng hạng liên tục (Dense Ranking).
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tournament: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const groups = computed(() => props.tournament.groups || []);

const standings = computed(() => {
  if (!props.tournament || !props.tournament.calculateStandings) return [];
  return props.tournament.calculateStandings();
});

function getGroupStandings(groupId) {
  if (!props.tournament || !props.tournament.calculateStandings) return [];
  return props.tournament.calculateStandings(groupId);
}
</script>

<style scoped>
.standings-root {
  width: 100%;
}

.group-standings-card {
  margin-bottom: 32px;
}

.group-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #a5b4fc;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #6366f1;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.4);
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px 16px;
  text-align: left;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

td {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.team-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.rank {
  width: 50px;
  text-align: center;
  font-weight: 800;
  color: #6366f1;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.team-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.team-logo-placeholder {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.4);
}

.team-name {
  font-weight: 700;
  color: white;
}

.stat {
  width: 60px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.points {
  width: 70px;
  font-weight: 800;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.05);
}

.positive { color: #4ade80; }
.negative { color: #f87171; }

@media (max-width: 768px) {
  .hide-mobile {
    display: none;
  }
  th, td {
    padding: 10px 8px;
  }
  .stat {
    width: 40px;
  }
}
</style>
