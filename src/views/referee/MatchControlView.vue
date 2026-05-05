<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div v-if="match" class="space-y-6">
        <!-- Score Board -->
        <div class="glass rounded-2xl p-8 text-center">
          <div class="flex justify-center items-center gap-8 mb-6">
            <div class="text-center">
              <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mb-2">
                {{ getInitials(match.home_club?.name) }}
              </div>
              <p class="text-white font-medium">{{ match.home_club?.name }}</p>
            </div>
            
            <div class="text-center">
              <div class="text-6xl font-bold gradient-text">{{ match.home_score }} - {{ match.away_score }}</div>
              <p class="text-white/60 mt-2">{{ matchStatus }}</p>
            </div>
            
            <div class="text-center">
              <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mb-2">
                {{ getInitials(match.away_club?.name) }}
              </div>
              <p class="text-white font-medium">{{ match.away_club?.name }}</p>
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
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button @click="addGoal('home')" class="event-btn">
            <i class="pi pi-plus-circle text-green-400"></i>
            <span>Ghi bàn (Nhà)</span>
          </button>
          <button @click="addGoal('away')" class="event-btn">
            <i class="pi pi-plus-circle text-green-400"></i>
            <span>Ghi bàn (Khách)</span>
          </button>
          <button @click="addCard('yellow')" class="event-btn">
            <i class="pi pi-id-card text-yellow-400"></i>
            <span>Thẻ vàng</span>
          </button>
          <button @click="addCard('red')" class="event-btn">
            <i class="pi pi-id-card text-red-400"></i>
            <span>Thẻ đỏ</span>
          </button>
        </div>

        <!-- Events List -->
        <div class="glass rounded-2xl p-6">
          <h3 class="text-lg font-bold text-white mb-4">Diễn biến trận đấu</h3>
          <div class="space-y-2">
            <div v-for="event in events" :key="event.id" class="event-item">
              <span class="text-white/60 w-12">{{ event.minute }}'</span>
              <i :class="getEventIcon(event.type)"></i>
              <span class="text-white flex-1">{{ event.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { matchRepository } from '../../repositories/MatchRepository.js';
import { Match } from '../../domain/Match.js';

const route = useRoute();
const match = ref(null);
const events = ref([]);

const matchStatus = computed(() => ({
  'scheduled': 'Chờ thi đấu',
  'in_progress': 'Đang thi đấu',
  'paused': 'Tạm dừng',
  'completed': 'Đã kết thúc'
}[match.value?.status] || ''));

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
const getEventIcon = (type) => ({
  'goal': 'pi pi-circle-fill text-green-400',
  'yellow_card': 'pi pi-id-card text-yellow-400',
  'red_card': 'pi pi-id-card text-red-400'
}[type] || 'pi pi-circle');

const startMatch = async () => {
  const matchObj = new Match(match.value);
  const result = matchObj.start();
  if (result.success) {
    await matchRepository.update(matchObj);
    loadMatch();
  }
};

const pauseMatch = async () => {
  const matchObj = new Match(match.value);
  const result = matchObj.pause();
  if (result.success) await matchRepository.update(matchObj);
};

const resumeMatch = async () => {
  const matchObj = new Match(match.value);
  const result = matchObj.resume();
  if (result.success) await matchRepository.update(matchObj);
};

const endMatch = async () => {
  const matchObj = new Match(match.value);
  const result = matchObj.end();
  if (result.success) await matchRepository.update(matchObj);
};

const addGoal = async (team) => {
  // TODO: Implement goal recording
};

const addCard = async (type) => {
  // TODO: Implement card recording
};

const loadMatch = async () => {
  const result = await matchRepository.findById(route.params.id);
  if (result.isOk()) match.value = result.getValue();
};

onMounted(loadMatch);
</script>

<style scoped>
.btn-control {
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
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

.event-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}
</style>
