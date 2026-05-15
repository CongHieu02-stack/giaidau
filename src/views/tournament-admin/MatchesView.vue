<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">
      
      <!-- Hero Header -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-calendar"></i></div>
          <div>
            <h1 class="hero-title">Quản lý Trận đấu</h1>
            <p class="hero-subtitle">Lên lịch thi đấu và phân công trọng tài cho các giải đấu</p>
          </div>
        </div>
        
        <div class="controls-row">
          <div class="filter-group">
            <div class="search-box">
              <i class="pi pi-search"></i>
              <input v-model="searchQuery" type="text" placeholder="Tìm tên đội..." />
            </div>
            
            <select v-model="filterTournament" class="filter-select">
              <option value="">Tất cả giải đấu</option>
              <option v-for="t in tournaments" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>

            <select v-model="filterStatus" class="filter-select">
              <option value="">Tất cả trạng thái</option>
              <option value="scheduled">Sắp diễn ra</option>
              <option value="in_progress">Đang diễn ra</option>
              <option value="completed">Đã kết thúc</option>
            </select>
          </div>
          
          <div class="stats-pill">
            <i class="pi pi-list"></i>
            <span>{{ filteredMatches.length }} trận đấu</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Đang tải danh sách trận đấu...</span>
      </div>

      <!-- Content Table -->
      <div v-else-if="filteredMatches.length > 0" class="table-panel">
        <div class="table-responsive">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Thông tin trận</th>
                <th>Đối đầu</th>
                <th>Thời gian & Địa điểm</th>
                <th>Trạng thái</th>
                <th>Trọng tài</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="match in filteredMatches" :key="match.id">
                <td>
                  <div class="match-meta">
                    <span class="tournament-tag">{{ match.tournament?.name }}</span>
                    <span class="round-text">Vòng {{ match.round }}</span>
                  </div>
                </td>
                <td>
                  <div class="vs-cell">
                    <div class="team-mini">
                      <img v-if="getTeamLogo(match, 'home')" :src="getTeamLogo(match, 'home')" class="team-icon" />
                      <span class="team-name">{{ getTeamName(match, 'home') }}</span>
                    </div>
                    <span class="vs-divider">VS</span>
                    <div class="team-mini">
                      <img v-if="getTeamLogo(match, 'away')" :src="getTeamLogo(match, 'away')" class="team-icon" />
                      <span class="team-name">{{ getTeamName(match, 'away') }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="loc-cell">
                    <div class="date-time">
                      <i class="pi pi-calendar"></i> {{ formatDate(match.match_date) }}
                      <i class="pi pi-clock ml-2"></i> {{ match.match_time }}
                    </div>
                    <div class="venue-name">
                      <i class="pi pi-map-marker"></i> {{ match.venue?.name || 'Chưa xác định' }}
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="['status-badge', `status-${match.status}`]">
                    {{ getStatusLabel(match.status) }}
                  </span>
                </td>
                <td>
                  <div class="ref-select-wrap">
                    <select 
                      v-model="match.referee_id" 
                      @change="assignReferee(match)"
                      :disabled="updatingId === match.id || match.status === 'completed'"
                      class="ref-select"
                    >
                      <option :value="null">Chưa phân công</option>
                      <option v-for="ref in referees" :key="ref.id" :value="ref.id">
                        {{ ref.fullName }}
                      </option>
                    </select>
                    <i v-if="updatingId === match.id" class="pi pi-spin pi-spinner ref-loader"></i>
                  </div>
                </td>
                <td>
                  <router-link :to="`/matches/${match.id}`" class="action-btn" title="Xem chi tiết">
                    <i class="pi pi-external-link"></i>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="pi pi-calendar-times"></i></div>
        <h3>Không tìm thấy trận đấu nào</h3>
        <p>Thử thay đổi bộ lọc để tìm kiếm các trận đấu khác</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { matchRepository } from '../../repositories/MatchRepository.js';
import { userRepository } from '../../repositories/UserRepository.js';
import { tournamentRepository } from '../../repositories/TournamentRepository.js';
import { supabase } from '../../config/supabase.js';

const matches = ref([]);
const referees = ref([]);
const tournaments = ref([]);
const loading = ref(true);
const updatingId = ref(null);

// Filters
const searchQuery = ref('');
const filterTournament = ref('');
const filterStatus = ref('');

const loadData = async () => {
  loading.value = true;
  try {
    // Load all matches with details
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_club:clubs!home_club_id(id, name, logo_url),
        away_club:clubs!away_club_id(id, name, logo_url),
        home_user:profiles!matches_home_user_id_fkey(id, full_name, avatar_url),
        away_user:profiles!matches_away_user_id_fkey(id, full_name, avatar_url),
        venue:venues(id, name),
        tournament:tournaments(id, name, participant_type)
      `)
      .order('match_date', { ascending: false })
      .order('match_time', { ascending: false });

    if (error) throw error;
    matches.value = data || [];

    // Load referees
    const refResult = await userRepository.findByRole('referee');
    if (refResult.isOk()) {
      referees.value = refResult.getValue();
    }

    // Load tournaments for filter
    const tResult = await tournamentRepository.findAll();
    if (tResult.isOk()) {
      tournaments.value = tResult.getValue();
    }
  } catch (err) {
    console.error('Error loading data:', err);
  } finally {
    loading.value = false;
  }
};

const filteredMatches = computed(() => {
  return matches.value.filter(m => {
    const matchSearch = (getTeamName(m, 'home') + getTeamName(m, 'away')).toLowerCase();
    const matchesSearch = matchSearch.includes(searchQuery.value.toLowerCase());
    const matchesTournament = !filterTournament.value || m.tournament_id === filterTournament.value;
    const matchesStatus = !filterStatus.value || m.status === filterStatus.value;
    return matchesSearch && matchesTournament && matchesStatus;
  });
});

const getTeamName = (match, side) => {
  if (match.tournament?.participant_type === 'individual') {
    return match[`${side}_user`]?.full_name || 'Đang cập nhật';
  }
  return match[`${side}_club`]?.name || 'Đang cập nhật';
};

const getTeamLogo = (match, side) => {
  if (match.tournament?.participant_type === 'individual') {
    return match[`${side}_user`]?.avatar_url;
  }
  return match[`${side}_club`]?.logo_url;
};

const assignReferee = async (match) => {
  updatingId.value = match.id;
  try {
    const { error } = await supabase
      .from('matches')
      .update({ referee_id: match.referee_id })
      .eq('id', match.id);
    
    if (error) throw error;
    // Success - keep local state updated
  } catch (err) {
    alert('Lỗi khi phân công trọng tài: ' + err.message);
    loadData(); // Revert on error
  } finally {
    updatingId.value = null;
  }
};

const getStatusLabel = (s) => {
  const map = { scheduled: 'Sắp diễn ra', in_progress: 'Đang thi đấu', completed: 'Đã xong', cancelled: 'Hủy' };
  return map[s] || s;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

onMounted(loadData);
</script>

<style scoped>
.page-wrapper { min-height: 100vh; padding: 1.5rem 1.5rem 4rem; }
.max-w-7xl { max-width: 85rem; margin: 0 auto; }

/* ── Hero ── */
.page-hero {
  position: relative; margin-bottom: 2.5rem;
  padding: 2.5rem; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 2rem; overflow: hidden;
  display: flex; flex-direction: column; gap: 2rem;
}
.hero-glow {
  position: absolute; top: -60px; left: -60px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 1.5rem; position: relative; z-index: 1; }
.hero-icon {
  width: 64px; height: 64px; border-radius: 1.25rem; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; color: white;
  box-shadow: 0 12px 30px rgba(99,102,241,0.4);
}
.hero-title { font-size: 2.5rem; font-weight: 800; color: white; line-height: 1.1; margin: 0; }
.hero-subtitle { font-size: 1rem; color: rgba(255,255,255,0.5); margin-top: 0.5rem; }

.controls-row { 
  display: flex; flex-wrap: wrap; gap: 1.5rem; 
  align-items: center; justify-content: space-between;
  position: relative; z-index: 1;
}

.filter-group { display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1; }
.search-box {
  position: relative; flex: 1; min-width: 200px;
}
.search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); }
.search-box input {
  width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.875rem; color: white; font-size: 0.9rem;
}
.search-box input:focus { outline: none; border-color: rgba(99,102,241,0.5); background: rgba(255,255,255,0.08); }

.filter-select {
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.875rem; color: white; font-size: 0.9rem; cursor: pointer;
  appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem;
}

.stats-pill {
  display: inline-flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 1.25rem; background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2); border-radius: 999px;
  color: #a5b4fc; font-size: 0.875rem; font-weight: 700;
}

/* ── Table ── */
.table-panel {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem; overflow: hidden;
}
.table-responsive { overflow-x: auto; }
.premium-table { width: 100%; border-collapse: collapse; }
.premium-table th {
  background: rgba(255,255,255,0.02); padding: 1.25rem 1.5rem;
  text-align: left; font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.premium-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); color: white; }
.premium-table tr:hover td { background: rgba(255,255,255,0.01); }

.match-meta { display: flex; flex-direction: column; gap: 0.25rem; }
.tournament-tag { font-size: 0.85rem; font-weight: 700; color: white; }
.round-text { font-size: 0.7rem; color: #a855f7; font-weight: 800; text-transform: uppercase; }

.vs-cell { display: flex; align-items: center; gap: 1rem; }
.team-mini { display: flex; align-items: center; gap: 0.6rem; min-width: 120px; }
.team-icon { width: 28px; height: 28px; border-radius: 6px; }
.team-name { font-size: 0.9rem; font-weight: 600; color: white; }
.vs-divider { font-size: 0.7rem; font-weight: 900; color: rgba(255,255,255,0.2); }

.loc-cell { display: flex; flex-direction: column; gap: 0.4rem; }
.date-time { font-size: 0.85rem; font-weight: 600; color: white; display: flex; align-items: center; gap: 0.4rem; }
.venue-name { font-size: 0.8rem; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 0.4rem; }

.status-badge {
  display: inline-flex; padding: 0.4rem 0.8rem; border-radius: 0.6rem;
  font-size: 0.75rem; font-weight: 800; letter-spacing: 0.02em;
}
.status-scheduled { background: rgba(99,102,241,0.15); color: #a5b4fc; }
.status-in_progress { background: rgba(34,197,94,0.15); color: #4ade80; }
.status-completed { background: rgba(168,85,247,0.15); color: #c084fc; }

.ref-select-wrap { position: relative; }
.ref-select {
  width: 100%; padding: 0.5rem 2rem 0.5rem 0.75rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.6rem; color: white; font-size: 0.85rem; cursor: pointer;
  appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.6rem center; background-size: 0.8rem;
}
.ref-select:disabled { opacity: 0.5; cursor: not-allowed; }
.ref-loader { position: absolute; right: -1.5rem; top: 0.6rem; font-size: 0.8rem; color: #6366f1; }

.action-btn {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); transition: all 0.2s;
}
.action-btn:hover { background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.3); }

/* ── States ── */
.loading-state, .empty-state {
  padding: 6rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center;
}
.loading-state .pi-spinner { font-size: 3rem; color: #6366f1; margin-bottom: 1.5rem; }
.empty-icon {
  width: 90px; height: 90px; border-radius: 2rem;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.5rem; font-size: 2.5rem; color: rgba(255,255,255,0.1);
}
.empty-state h3 { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 0.75rem; }
.empty-state p { color: rgba(255,255,255,0.4); }

@media (max-width: 1024px) {
  .vs-cell { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
  .vs-divider { display: none; }
}
</style>
