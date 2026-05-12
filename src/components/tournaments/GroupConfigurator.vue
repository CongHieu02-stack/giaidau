<template>
  <div class="group-configurator">
    <div class="config-header">
      <div class="config-inputs">
        <div class="field">
          <span>Số lượng bảng đấu</span>
          <div class="flex gap-2">
            <input 
              v-model.number="numGroups" 
              type="number" 
              min="1" 
              max="8" 
              class="w-24"
            >
            <button 
              type="button" 
              class="secondary-button"
              @click="handleAutoDistribute"
            >
              <i class="pi pi-refresh mr-1"></i> Chia tự động
            </button>
          </div>
        </div>
      </div>
      <div class="config-summary">
        <span>Tổng số đội: <strong>{{ approvedTeams.length }}</strong></span>
      </div>
    </div>

    <div class="groups-grid">
      <div v-for="(group, gIdx) in localGroups" :key="gIdx" class="group-column">
        <div class="group-header">
          <input v-model="group.name" class="group-name-input" />
          <span class="team-count-badge">{{ group.teams.length }} đội</span>
        </div>
        
        <draggable 
          v-model="group.teams" 
          group="teams" 
          item-key="id"
          class="drag-area"
          @change="onDragChange"
        >
          <template #item="{ element }">
            <div class="team-card-draggable">
              <div v-if="element" class="team-info">
                <img v-if="element.logo_url" :src="element.logo_url" class="team-logo-small" />
                <span class="team-name">{{ element.name }}</span>
              </div>
              <div v-else class="team-info">
                <span class="team-name text-red-400">Đội bóng lỗi</span>
              </div>
              <i class="pi pi-bars drag-handle"></i>
            </div>
          </template>
        </draggable>

        <div v-if="group.teams.length === 0" class="empty-group-placeholder">
          Kéo đội vào đây
        </div>
      </div>
    </div>

    <div class="config-actions mt-6">
      <button 
        type="button" 
        class="primary-button w-full"
        :disabled="!isValid"
        @click="$emit('confirm', localGroups)"
      >
        <i class="pi pi-check-circle mr-2"></i>
        Xác nhận bố cục & Tạo lịch thi đấu
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import draggable from 'vuedraggable';
import { distributeTeamsIntoGroups } from '../../features/tournaments/adminTournamentManagement.js';

const props = defineProps({
  approvedTeams: {
    type: Array,
    required: true
  },
  initialGroups: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['confirm', 'change']);

const numGroups = ref(props.initialGroups.length || 1);
const localGroups = ref(props.initialGroups.length > 0 ? JSON.parse(JSON.stringify(props.initialGroups)) : [{ name: 'Bảng A', teams: [...props.approvedTeams] }]);

const isValid = computed(() => {
  const allTeamsCount = localGroups.value.reduce((acc, g) => acc + g.teams.length, 0);
  return allTeamsCount === props.approvedTeams.length && localGroups.value.every(g => g.teams.length >= 0);
});

function handleAutoDistribute() {
  if (numGroups.value < 1) numGroups.value = 1;
  localGroups.value = distributeTeamsIntoGroups(props.approvedTeams, numGroups.value);
  emit('change', localGroups.value);
}

function onDragChange() {
  emit('change', localGroups.value);
}

watch(numGroups, (newVal) => {
  if (newVal > localGroups.value.length) {
    for (let i = localGroups.value.length; i < newVal; i++) {
      localGroups.value.push({
        name: `Bảng ${String.fromCharCode(65 + i)}`,
        teams: []
      });
    }
  } else if (newVal < localGroups.value.length && newVal >= 1) {
    // Move teams from removed groups to the first group
    const removedGroups = localGroups.value.splice(newVal);
    removedGroups.forEach(g => {
      localGroups.value[0].teams.push(...g.teams);
    });
  }
  emit('change', localGroups.value);
});
</script>

<style scoped>
.group-configurator {
  background: rgba(255, 255, 255, 0.03);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.group-column {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.group-header {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-name-input {
  background: transparent;
  border: none;
  color: white;
  font-weight: 800;
  font-size: 1rem;
  padding: 4px;
  width: 60%;
}

.group-name-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
}

.team-count-badge {
  font-size: 0.75rem;
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  padding: 2px 8px;
  border-radius: 99px;
  font-weight: 700;
}

.drag-area {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
}

.team-card-draggable {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  transition: all 0.2s ease;
}

.team-card-draggable:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(96, 165, 250, 0.5);
  transform: translateX(4px);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.team-logo-small {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.team-name {
  font-weight: 700;
  font-size: 0.9rem;
}

.drag-handle {
  color: rgba(255, 255, 255, 0.2);
  font-size: 0.8rem;
}

.empty-group-placeholder {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
  font-size: 0.85rem;
  font-style: italic;
}

.primary-button {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
</style>
