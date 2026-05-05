<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Lịch thi đấu</h1>
      
      <div class="glass rounded-2xl p-8">
        <p class="text-white/60 mb-4">Tạo lịch thi đấu tự động</p>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-white/80">Chọn sân thi đấu</label>
            <div class="flex flex-wrap gap-3">
              <label v-for="v in venues" :key="v.id" class="venue-checkbox">
                <input v-model="selectedVenues" type="checkbox" :value="v.id">
                <span>{{ v.name }}</span>
              </label>
            </div>
          </div>
          
          <button @click="generateSchedule" :disabled="generating || selectedVenues.length === 0" class="btn-primary">
            <i v-if="generating" class="pi pi-spinner pi-spin mr-2"></i>
            {{ generating ? 'Đang tạo...' : 'Tạo lịch thi đấu' }}
          </button>
        </div>
        
        <!-- Matches List -->
        <div v-if="matches.length > 0" class="mt-8">
          <h3 class="text-xl font-bold text-white mb-4">Danh sách trận đấu</h3>
          <div class="space-y-3">
            <div v-for="(m, idx) in matches" :key="idx" class="match-item">
              <span class="text-white/60 w-12">#{{ idx + 1 }}</span>
              <span class="text-white font-medium flex-1">{{ m.homeClub?.name }} vs {{ m.awayClub?.name }}</span>
              <span class="text-white/60">{{ m.matchDate }} {{ m.matchTime }}</span>
              <span class="text-white/60">{{ m.venue?.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../../config/supabase.js';
import { tournamentService } from '../../services/TournamentService.js';

const route = useRoute();
const venues = ref([]);
const selectedVenues = ref([]);
const generating = ref(false);
const matches = ref([]);

const generateSchedule = async () => {
  generating.value = true;
  const result = await tournamentService.generateSchedule(route.params.id, selectedVenues.value);
  if (result.isOk()) {
    matches.value = result.getValue();
  }
  generating.value = false;
};

onMounted(async () => {
  const { data } = await supabase.from('venues').select('*');
  venues.value = data || [];
});
</script>

<style scoped>
.venue-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
}

.venue-checkbox input:checked + span {
  color: #3b82f6;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
}
</style>
