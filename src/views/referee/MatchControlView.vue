<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Debug: Show match data -->
      <div v-if="!match" class="text-white text-center py-8">
        <h2>Đang tải dữ liệu trận đấu...</h2>
        <p>Route ID: {{ route.params.id }}</p>
      </div>
      
      <div v-if="match" class="space-y-6">
        <!-- Match Info -->
        <div class="glass rounded-2xl p-6 mb-4">
          <h3 class="text-xl font-bold text-white mb-4">Thông tin trận đấu</h3>
          <div class="grid grid-cols-2 gap-4 text-white">
            <p><strong>Giải đấu:</strong> {{ getTournamentName(match.tournamentId) }}</p>
            <p><strong>Trạng thái:</strong> <span :class="['status-badge', getStatusClass(match.status)]">{{ getStatusText(match.status) }}</span></p>
            <p><strong>Ngày:</strong> {{ formatDate(match.matchDate) }}</p>
            <p><strong>Giờ:</strong> {{ match.matchTime }}</p>
            <p><strong>Sân:</strong> {{ getVenueName(match.venueId) }}</p>
          </div>
        </div>
        
        <!-- Score Board -->
        <div class="glass rounded-2xl p-6 text-center">
          <!-- Timer & Status -->
          <div class="mb-4">
            <span class="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-2" :class="getStatusClass(match.status)">
              {{ matchStatus }}
            </span>
            <div class="text-4xl font-mono font-bold text-white tracking-wider">{{ elapsedTime }}</div>
          </div>
          
          <!-- Teams & Score -->
          <div class="flex justify-center items-center gap-4 md:gap-8 mb-6">
            <!-- Home Team -->
            <div class="flex-1 text-center">
              <div class="w-16 h-16 md:w-24 md:h-24 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl md:text-3xl font-bold text-white mb-3 shadow-lg shadow-blue-500/30">
                {{ getInitials(getClubName(match.homeClubId)) }}
              </div>
              <p class="text-white font-semibold text-sm md:text-lg leading-tight">{{ getClubName(match.homeClubId) }}</p>
              <p class="text-blue-400 text-xs mt-1">Đội nhà</p>
            </div>
            
            <!-- Score -->
            <div class="px-6 py-4 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20">
              <div class="text-5xl md:text-7xl font-black text-white leading-none tracking-tight">
                <span class="text-blue-400">{{ match.homeScore ?? 0 }}</span>
                <span class="text-white/40 mx-2">:</span>
                <span class="text-orange-400">{{ match.awayScore ?? 0 }}</span>
              </div>
            </div>
            
            <!-- Away Team -->
            <div class="flex-1 text-center">
              <div class="w-16 h-16 md:w-24 md:h-24 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl md:text-3xl font-bold text-white mb-3 shadow-lg shadow-orange-500/30">
                {{ getInitials(getClubName(match.awayClubId)) }}
              </div>
              <p class="text-white font-semibold text-sm md:text-lg leading-tight">{{ getClubName(match.awayClubId) }}</p>
              <p class="text-orange-400 text-xs mt-1">Đội khách</p>
            </div>
          </div>
          
          <!-- Controls -->
          <div class="flex justify-center gap-4">
            <button v-if="match.status === 'scheduled'" @click="startMatch" class="btn-control bg-green-500">
              <i class="pi pi-play mr-2"></i>Bắt đầu
            </button>
            <button v-if="match.status === 'in_progress'" @click="pauseMatch" class="btn-control bg-yellow-500">
              <i class="pi pi-pause mr-2"></i>Tạm dừng
            </button>
            <button v-if="match.status === 'paused'" @click="resumeMatch" class="btn-control bg-blue-500">
              <i class="pi pi-play mr-2"></i>Tiếp tục
            </button>
            <button v-if="match.status === 'in_progress' || match.status === 'paused'" @click="endMatch" class="btn-control bg-red-500">
              <i class="pi pi-stop mr-2"></i>Kết thúc
            </button>
          </div>
        </div>

        <!-- Event Buttons -->
        <div class="glass rounded-2xl p-6">
          <h3 class="text-lg font-bold text-white mb-6">Điều khiển trận đấu</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Đội nhà -->
            <div class="team-section">
              <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white mr-2">
                  {{ getInitials(getClubName(match.homeClubId)) }}
                </div>
                {{ getClubName(match.homeClubId) }}
              </h4>
              <button @click="addGoal('home')" class="goal-btn home-goal">
                <i class="pi pi-plus-circle text-2xl"></i>
                <span>Ghi bàn</span>
              </button>
            </div>
            
            <!-- Đội khách -->
            <div class="team-section">
              <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-bold text-white mr-2">
                  {{ getInitials(getClubName(match.awayClubId)) }}
                </div>
                {{ getClubName(match.awayClubId) }}
              </h4>
              <button @click="addGoal('away')" class="goal-btn away-goal">
                <i class="pi pi-plus-circle text-2xl"></i>
                <span>Ghi bàn</span>
              </button>
            </div>
          </div>
          
          <!-- Thẻ phạt đội nhà -->
          <div class="mt-6 pt-6 border-t border-white/10">
            <h4 class="text-lg font-semibold text-white mb-4">Thẻ phạt - {{ getClubName(match.homeClubId) }}</h4>
            <div class="grid grid-cols-2 gap-4">
              <button @click="addCard('yellow', 'home')" class="card-btn yellow-card">
                <i class="pi pi-id-card text-2xl"></i>
                <span>Thẻ vàng</span>
              </button>
              <button @click="addCard('red', 'home')" class="card-btn red-card">
                <i class="pi pi-id-card text-2xl"></i>
                <span>Thẻ đỏ</span>
              </button>
            </div>
          </div>
          
          <!-- Thẻ phạt đội khách -->
          <div class="mt-6 pt-6 border-t border-white/10">
            <h4 class="text-lg font-semibold text-white mb-4">Thẻ phạt - {{ getClubName(match.awayClubId) }}</h4>
            <div class="grid grid-cols-2 gap-4">
              <button @click="addCard('yellow', 'away')" class="card-btn yellow-card">
                <i class="pi pi-id-card text-2xl"></i>
                <span>Thẻ vàng</span>
              </button>
              <button @click="addCard('red', 'away')" class="card-btn red-card">
                <i class="pi pi-id-card text-2xl"></i>
                <span>Thẻ đỏ</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Events List -->
        <div class="glass rounded-2xl p-6">
          <h3 class="text-lg font-bold text-white mb-6">Diễn biến trận đấu</h3>
          
          <div v-if="events.length === 0" class="text-center py-8 text-white/60">
            <i class="pi pi-calendar-times text-4xl mb-3"></i>
            <p>Chưa có diễn biến nào</p>
          </div>
          
          <div v-else class="space-y-3">
            <div v-for="event in events" :key="event.id" class="event-item">
              <div class="event-time">
                <span class="minute">{{ event.minute }}'</span>
              </div>
              <div class="event-content">
                <i :class="getEventIcon(event.description)"></i>
                <span class="description">{{ event.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { matchRepository } from '../../repositories/MatchRepository.js';
import { Match } from '../../domain/Match.js';
import { supabase } from '../../config/supabase.js';
import { generateUUID } from '../../utils/helpers.js';

const route = useRoute();
const match = ref(null);
const events = ref([]);
const clubs = ref([]);
const venues = ref([]);
const tournaments = ref([]);
const matchStartTime = ref(null);
const elapsedTime = ref('00:00');

const matchStatus = computed(() => ({
  'scheduled': 'Chờ thi đấu',
  'in_progress': 'Đang thi đấu',
  'paused': 'Tạm dừng',
  'completed': 'Đã kết thúc'
}[match.value?.status] || ''));

const getStatusText = (s) => ({
  'scheduled': 'Chờ thi đấu',
  'in_progress': 'Đang thi đấu',
  'paused': 'Tạm dừng',
  'completed': 'Đã kết thúc'
}[match.value?.status] || '');

const getStatusClass = (s) => ({
  'scheduled': 'bg-gray-500/20 text-gray-400',
  'in_progress': 'bg-green-500/20 text-green-400',
  'paused': 'bg-yellow-500/20 text-yellow-400',
  'completed': 'bg-blue-500/20 text-blue-400'
}[s] || 'bg-gray-500/20');

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const getClubName = (id) => {
  const club = clubs.value.find(c => c.id === id);
  return club?.name || `CLB ${id?.slice(0, 8) || 'Unknown'}`;
};

const getVenueName = (id) => {
  const venue = venues.value.find(v => v.id === id);
  return venue?.name || `Sân ${id?.slice(0, 8) || 'Unknown'}`;
};

const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-';

const getTournamentName = (id) => {
  const tournament = tournaments.value.find(t => t.id === id);
  return tournament?.name || `Giải ${id?.slice(0, 8) || 'Unknown'}`;
};

const getEventIcon = (description) => {
  const desc = description?.toLowerCase() || '';
  if (desc.includes('bàn thắng') || desc.includes('goal')) {
    return 'pi pi-circle-fill text-green-400';
  } else if (desc.includes('thẻ vàng') || desc.includes('yellow')) {
    return 'pi pi-id-card text-yellow-400';
  } else if (desc.includes('thẻ đỏ') || desc.includes('red')) {
    return 'pi pi-id-card text-red-400';
  }
  return 'pi pi-circle text-white/60';
};

const startMatch = async () => {
  console.log('[MatchControl] Start match clicked. Current status:', match.value?.status);
  
  if (!match.value) {
    console.error('[MatchControl] No match data');
    return;
  }
  
  const matchObj = new Match(match.value);
  const result = matchObj.start();
  console.log('[MatchControl] Start result:', result);
  
  if (result.success) {
    // Set start time and start timer
    const now = new Date();
    matchStartTime.value = now;
    
    // Update both status and start_time in database
    const { error } = await supabase
      .from('matches')
      .update({ 
        status: 'in_progress',
        start_time: now.toISOString()
      })
      .eq('id', match.value.id);
    
    if (error) {
      console.error('[MatchControl] Error saving start time:', error);
    } else {
      console.log('[MatchControl] Start time saved:', now.toISOString());
    }
    
    // Reload match data
    await loadMatch();
  } else {
    console.error('[MatchControl] Start failed:', result.getError());
  }
};

const pauseMatch = async () => {
  console.log('[MatchControl] Pause match clicked');
  const matchObj = new Match(match.value);
  const result = matchObj.pause();
  console.log('[MatchControl] Pause result:', result);
  
  if (result.success) {
    const updateResult = await matchRepository.updateStatus(match.value.id, 'paused');
    if (updateResult.isOk()) {
      await loadMatch();
    }
  }
};

const resumeMatch = async () => {
  console.log('[MatchControl] Resume match clicked');
  const matchObj = new Match(match.value);
  const result = matchObj.resume();
  console.log('[MatchControl] Resume result:', result);
  
  if (result.success) {
    const updateResult = await matchRepository.updateStatus(match.value.id, 'in_progress');
    if (updateResult.isOk()) {
      await loadMatch();
    }
  }
};

const endMatch = async () => {
  console.log('[MatchControl] End match clicked');
  const matchObj = new Match(match.value);
  const result = matchObj.end();
  console.log('[MatchControl] End result:', result);
  
  if (result.success) {
    // Update status and end_time in database
    const now = new Date();
    const { error } = await supabase
      .from('matches')
      .update({ 
        status: 'completed',
        end_time: now.toISOString()
      })
      .eq('id', match.value.id);
    
    if (error) {
      console.error('[MatchControl] Error saving end time:', error);
    }
    
    await loadMatch();
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
};

const addGoal = async (team) => {
  console.log('[MatchControl] Add goal for team:', team);
  
  if (!match.value) {
    alert('Chưa có dữ liệu trận đấu!');
    return;
  }
  
  // Ensure clubs are loaded
  if (clubs.value.length === 0) {
    await loadClubs();
  }
  
  try {
    // Update score based on team
    const updateData = {};
    let teamName = '';
    
    if (team === 'home') {
      updateData.home_score = (match.value.homeScore || 0) + 1;
      teamName = getClubName(match.value.homeClubId);
    } else if (team === 'away') {
      updateData.away_score = (match.value.awayScore || 0) + 1;
      teamName = getClubName(match.value.awayClubId);
    }
    
    console.log('[MatchControl] Updating score:', updateData, 'Team:', teamName);
    
    // Update match in database
    const { error: scoreError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', match.value.id);
    
    if (scoreError) {
      console.error('[MatchControl] Error updating score:', scoreError);
      alert('Lỗi khi ghi bàn: ' + scoreError.message);
      return;
    }
    
    // Create goal event with team name
    const eventData = {
      id: generateUUID(),
      match_id: match.value.id,
      minute: getMatchMinute(),
      description: `Bàn thắng ${teamName}`,
      created_at: new Date().toISOString()
    };
    
    console.log('[MatchControl] Adding goal event:', eventData);
    
    const { error: eventError } = await supabase
      .from('match_events')
      .insert([eventData]);
    
    if (eventError) {
      console.error('[MatchControl] Error adding goal event:', eventError);
    } else {
      console.log('[MatchControl] Goal event added successfully');
    }
    
    console.log('[MatchControl] Score updated successfully');
    alert('Đã ghi bàn thành công!');
    // Reload match data and events
    await loadMatch();
  } catch (err) {
    console.error('[MatchControl] Exception in addGoal:', err);
    alert('Lỗi hệ thống khi ghi bàn!');
  }
};

const addCard = async (type, team) => {
  console.log('[MatchControl] Add card:', type, 'team:', team);
  
  if (!match.value) {
    alert('Chưa có dữ liệu trận đấu!');
    return;
  }
  
  // Ensure clubs are loaded
  if (clubs.value.length === 0) {
    await loadClubs();
  }
  
  try {
    const teamName = team === 'home' ? getClubName(match.value.homeClubId) : getClubName(match.value.awayClubId);
    const cardText = type === 'yellow' ? 'Thẻ vàng' : 'Thẻ đỏ';
    
    // Create event object for card
    const eventData = {
      id: generateUUID(),
      match_id: match.value.id,
      minute: getMatchMinute(),
      description: `${cardText} - ${teamName}`,
      created_at: new Date().toISOString()
    };
    
    console.log('[MatchControl] Adding card event:', eventData);
    
    // Add event to database
    const { error } = await supabase
      .from('match_events')
      .insert([eventData]);
    
    if (error) {
      console.error('[MatchControl] Error adding card:', error);
      alert('Lỗi khi ghi thẻ: ' + error.message);
    } else {
      console.log('[MatchControl] Card added successfully');
      alert('Đã ghi thẻ thành công!');
      // Reload match data
      await loadEvents();
    }
  } catch (err) {
    console.error('[MatchControl] Exception in addCard:', err);
    alert('Lỗi hệ thống khi ghi thẻ!');
  }
};

// Helper function to get current match minute
const getMatchMinute = () => {
  // If matchStartTime is set (either from start button or loaded from DB)
  if (matchStartTime.value) {
    const elapsed = Math.floor((new Date() - matchStartTime.value) / 1000);
    const minute = Math.floor(elapsed / 60) + 1;
    console.log('[MatchControl] Match minute:', minute, 'Start time:', matchStartTime.value);
    return minute;
  }
  // Fallback: if match is in progress but no start time, return 1
  if (match.value?.status === 'in_progress' || match.value?.status === 'paused') {
    console.log('[MatchControl] No start time, defaulting to minute 1');
    return 1;
  }
  return 0;
};

const loadMatch = async () => {
  const result = await matchRepository.findById(route.params.id);
  if (result.isOk()) {
    match.value = result.getValue();
    console.log('[MatchControl] Match loaded:', match.value?.status, 'startTime:', match.value?.startTime);
    
    // Reset timer if match is scheduled
    if (match.value.status === 'scheduled') {
      matchStartTime.value = null;
      elapsedTime.value = '00:00';
      console.log('[MatchControl] Match not started, timer reset to 00:00');
    }
    // Set matchStartTime if match has started (in_progress, paused)
    else if (match.value.startTime && match.value.status !== 'completed') {
      matchStartTime.value = new Date(match.value.startTime);
      console.log('[MatchControl] Set start time from database:', matchStartTime.value);
      
      // Recalculate elapsed time immediately
      const now = new Date();
      const elapsed = Math.floor((now - matchStartTime.value) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      elapsedTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    // For completed matches, show total time
    else if (match.value.status === 'completed' && match.value.startTime) {
      matchStartTime.value = new Date(match.value.startTime);
      const start = matchStartTime.value;
      const end = match.value.endTime ? new Date(match.value.endTime) : new Date();
      const elapsed = Math.floor((end - start) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      elapsedTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    await loadClubs();
    await loadEvents();
  }
};

const loadEvents = async () => {
  try {
    const { data: eventsData } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', route.params.id)
      .order('created_at', { ascending: true });
    
    events.value = eventsData || [];
    console.log('[MatchControl] Events loaded:', events.value.length, events.value);
  } catch (err) {
    console.error('[MatchControl] Error loading events:', err);
    events.value = [];
  }
};

const loadClubs = async () => {
  try {
    const [clubsData, venuesData, tournamentsData] = await Promise.all([
      supabase.from('clubs').select('id, name'),
      supabase.from('venues').select('id, name'),
      supabase.from('tournaments').select('id, name')
    ]);
    
    clubs.value = clubsData.data || [];
    venues.value = venuesData.data || [];
    tournaments.value = tournamentsData.data || [];
    
    console.log('[MatchControl] Clubs loaded:', clubs.value.length);
    console.log('[MatchControl] Venues loaded:', venues.value.length);
    console.log('[MatchControl] Tournaments loaded:', tournaments.value.length);
  } catch (err) {
    console.error('[MatchControl] Error loading reference data:', err);
  }
};

let timerInterval = null;

onMounted(async () => {
  await loadMatch();
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    // Count time whenever matchStartTime is set and match is not completed
    if (matchStartTime.value && match.value?.status !== 'completed' && match.value?.status !== 'scheduled') {
      const now = new Date();
      const elapsed = Math.floor((now - matchStartTime.value) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      elapsedTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
};
</script>

<style scoped>
.btn-control {
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  border: none;
  pointer-events: auto;
  z-index: 10;
  position: relative;
}

.event-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  color: white;
}

.team-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.goal-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.home-goal {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.home-goal:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.away-goal {
  background: linear-gradient(135deg, #f97316, #ef4444);
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}

.away-goal:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
}

.card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.yellow-card {
  background: linear-gradient(135deg, #eab308, #ca8a04);
  box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);
}

.yellow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(234, 179, 8, 0.4);
}

.red-card {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.red-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.event-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.event-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

.event-time {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 0.5rem;
  font-weight: 700;
  color: white;
  font-size: 0.9rem;
}

.event-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.event-content i {
  font-size: 1.5rem;
}

.event-content .description {
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
}

/* Animation cho người chạy */
@keyframes running {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(5px); }
}

.running-player {
  animation: running 2s ease-in-out infinite;
}
</style>
