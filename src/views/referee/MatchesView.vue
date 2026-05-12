<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Danh sách trận đấu</h1>
      
            
      <div v-if="loading" class="text-center py-12">
        <i class="pi pi-spinner pi-spin text-4xl text-white mb-4"></i>
        <p class="text-white">Đang tải dữ liệu...</p>
      </div>
      
      <div v-else-if="matches.length === 0" class="glass rounded-2xl p-12 text-center">
        <i class="pi pi-calendar-times text-6xl text-white/30 mb-4"></i>
        <h3 class="text-xl font-semibold text-white mb-2">Chưa có trận đấu nào</h3>
        <p class="text-white/60">Bạn chưa được chỉ định trọng tài cho trận đấu nào.</p>
      </div>
      
      <div v-if="matches.length > 0" class="glass rounded-2xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="text-left p-4 text-white/80">Trận đấu</th>
              <th class="text-left p-4 text-white/80">Thời gian</th>
              <th class="text-left p-4 text-white/80">Sân</th>
              <th class="text-left p-4 text-white/80">Trạng thái</th>
              <th class="text-left p-4 text-white/80">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in matches" :key="m.id" class="border-t border-white/10">
              <td class="p-4 text-white">{{ getClubName(m.homeClubId) }} vs {{ getClubName(m.awayClubId) }}</td>
              <td class="p-4 text-white/70">{{ formatDate(m.matchDate) }} {{ m.matchTime }}</td>
              <td class="p-4 text-white/70">{{ getVenueName(m.venueId) }}</td>
              <td class="p-4">
                <span class="status-badge" :class="getStatusClass(m.status)">{{ getStatusText(m.status) }}</span>
              </td>
              <td class="p-4">
                <router-link :to="`/referee/matches/${m.id}`" class="btn-action">
                  <i class="pi pi-play"></i>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { matchRepository } from '../../repositories/MatchRepository.js';
import { supabase } from '../../config/supabase.js';

const authStore = useAuthStore();
const matches = ref([]);
const clubs = ref([]);
const venues = ref([]);
const loading = ref(true);

const getStatusClass = (s) => ({
  'scheduled': 'bg-gray-500/20 text-gray-400',
  'in_progress': 'bg-green-500/20 text-green-400',
  'completed': 'bg-blue-500/20 text-blue-400'
}[s] || 'bg-gray-500/20');

const getStatusText = (s) => ({
  'scheduled': 'Chờ thi đấu',
  'in_progress': 'Đang thi đấu',
  'completed': 'Đã kết thúc'
}[s] || s);

// Helper functions
const getClubName = (id) => {
  console.log('[getClubName] Looking for ID:', id, 'Available clubs:', clubs.value);
  const club = clubs.value.find(c => c.id === id);
  console.log('[getClubName] Found club:', club);
  return club?.name || `CLB ${id?.slice(0, 8) || 'Unknown'}`;
};

const getVenueName = (id) => {
  const venue = venues.value.find(v => v.id === id);
  return venue?.name || `Sân ${id?.slice(0, 8) || 'Unknown'}`;
};

const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-';

const getRefereeName = (id) => {
  if (id === authStore.user?.id) {
    return authStore.user?.full_name || authStore.user?.email || 'Bạn';
  }
  return 'Trọng tài khác';
};

onMounted(async () => {
  loading.value = true;
  if (authStore.user) {
    console.log('[Referee Matches] Loading matches for referee:', authStore.user.id);
    const result = await matchRepository.findByReferee(authStore.user.id);
    if (result.isOk()) {
      matches.value = result.getValue();
      console.log('[Referee Matches] Loaded:', matches.value.length, matches.value);
      
      // Load clubs and venues data
      await loadReferenceData();
    } else {
      console.error('[Referee Matches] Error:', result.getError());
    }
  }
  loading.value = false;
});

async function loadReferenceData() {
  try {
    // Load all clubs
    const { data: clubsData } = await supabase.from('clubs').select('id, name');
    clubs.value = clubsData || [];
    
    // Load all venues  
    const { data: venuesData } = await supabase.from('venues').select('id, name');
    venues.value = venuesData || [];
    
    console.log('[Referee Matches] Clubs loaded:', clubs.value.length);
    console.log('[Referee Matches] Venues loaded:', venues.value.length);
  } catch (err) {
    console.error('[Referee Matches] Error loading reference data:', err);
  }
}
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.matches-table th,
.matches-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  vertical-align: middle;
}

.matches-table th {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  white-space: nowrap;
  text-align: center;
}

.matches-table td {
  color: white;
  vertical-align: middle;
}

/* Cố định độ rộng các cột */
.matches-table th:nth-child(1),
.matches-table td:nth-child(1) {
  width: 25%; /* Trận đấu */
}

.matches-table th:nth-child(2),
.matches-table td:nth-child(2) {
  width: 20%; /* Thời gian */
}

.matches-table th:nth-child(3),
.matches-table td:nth-child(3) {
  width: 20%; /* Sân */
}

.matches-table th:nth-child(4),
.matches-table td:nth-child(4) {
  width: 15%; /* Trạng thái */
}

.matches-table th:nth-child(5),
.matches-table td:nth-child(5) {
  width: 10%; /* Thao tác */
  text-align: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-action {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}
</style>
