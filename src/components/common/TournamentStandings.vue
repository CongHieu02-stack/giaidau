<script setup>
import { computed } from 'vue';

const props = defineProps({
  tournament: {
    type: Object,
    required: true
  }
});

const standings = computed(() => {
  if (!props.tournament || !props.tournament.calculateStandings) return [];
  return props.tournament.calculateStandings();
});

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};
</script>

<template>
  <div class="standings-container">
    <div class="table-wrapper">
      <table class="standings-table">
        <thead>
          <tr>
            <th class="rank-col">#</th>
            <th class="team-col">Đội bóng</th>
            <th class="stat-col">Trận</th>
            <th class="stat-col">T</th>
            <th class="stat-col">H</th>
            <th class="stat-col">B</th>
            <th class="stat-col">HS</th>
            <th class="pts-col">Điểm</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(team, index) in standings" :key="team.clubId" :class="{'top-team': team.rank <= 4}">
            <td class="rank-col">{{ team.rank }}</td>
            <td class="team-col">
              <div class="team-info">
                <div class="team-logo">
                  <img v-if="team.logoUrl" :src="team.logoUrl" :alt="team.clubName" />
                  <span v-else>{{ getInitials(team.clubName) }}</span>
                </div>
                <span class="team-name">{{ team.clubName }}</span>
              </div>
            </td>
            <td class="stat-col">{{ team.played }}</td>
            <td class="stat-col text-green-400">{{ team.won }}</td>
            <td class="stat-col text-white/50">{{ team.drawn }}</td>
            <td class="stat-col text-red-400">{{ team.lost }}</td>
            <td class="stat-col" :class="team.goalDifference > 0 ? 'text-blue-400' : (team.goalDifference < 0 ? 'text-red-400' : 'text-white/50')">
              {{ team.goalDifference > 0 ? '+' : '' }}{{ team.goalDifference }}
            </td>
            <td class="pts-col" :class="team.points > 0 ? 'text-green-400' : (team.points < 0 ? 'text-red-400' : 'text-white/50')">
              {{ team.points }}
            </td>
          </tr>
          <tr v-if="standings.length === 0">
            <td colspan="8" class="empty-msg">Chưa có dữ liệu bảng xếp hạng</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="scoring-rules-note">
      <p><i class="pi pi-info-circle"></i> Quy tắc tính điểm: Thắng +2, Hòa +1, Thua -1. Thứ tự ưu tiên: Điểm > Hiệu số > Số trận thắng.</p>
    </div>
  </div>
</template>

<style scoped>
.standings-container {
  width: 100%;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.standings-table th {
  padding: 1rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.standings-table td {
  padding: 0.875rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: white;
}

.standings-table tr:last-child td {
  border-bottom: none;
}

.standings-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.rank-col {
  width: 3rem;
  text-align: center;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

.top-team .rank-col {
  color: #6366f1;
}

.team-col {
  min-width: 150px;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.team-logo {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 0.625rem;
  font-weight: 700;
  flex-shrink: 0;
}

.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.team-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-col {
  width: 3.5rem;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
}

.pts-col {
  width: 4.5rem;
  text-align: center;
  font-weight: 800;
  font-size: 1rem;
}

.empty-msg {
  padding: 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.scoring-rules-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.scoring-rules-note p {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scoring-rules-note i {
  color: #6366f1;
}

@media (max-width: 640px) {
  .team-name {
    max-width: 100px;
  }
  .stat-col:nth-child(n+4):nth-child(-n+6) {
    display: none;
  }
}
</style>
