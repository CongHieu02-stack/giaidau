<template>
  <div class="tournament-card group" @click="navigateToDetail">
    <!-- Image Header -->
    <div class="card-header">
      <div class="sport-icon">{{ sportIcon }}</div>
      <div class="status-badge" :class="statusClass">
        {{ statusText }}
      </div>
      <div class="overlay"></div>
    </div>

    <!-- Content -->
    <div class="card-content">
      <h3 class="tournament-name">{{ tournament.name }}</h3>
      
      <div class="tournament-info">
        <div class="info-item">
          <i class="pi pi-tag"></i>
          <span>{{ sportName }}</span>
        </div>
        <div class="info-item">
          <i class="pi pi-calendar"></i>
          <span>{{ dateDisplay }}</span>
        </div>
        <div class="info-item">
          <i class="pi pi-users"></i>
          <span>{{ registrationDisplay }}</span>
        </div>
      </div>

      <!-- Progress bar for registration -->
      <div v-if="showProgress" class="registration-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <span class="progress-text">{{ progressPercentage }}% đã đăng ký</span>
      </div>

      <!-- Champion display for completed tournaments -->
      <div v-if="isCompleted && tournament.champion_club" class="champion-section">
        <i class="pi pi-star-fill text-yellow-400"></i>
        <span>Vô địch: {{ tournament.champion_club.name }}</span>
      </div>
    </div>

    <!-- Hover Action -->
    <div class="card-action">
      <button class="action-btn">
        <span>Xem chi tiết</span>
        <i class="pi pi-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatDate } from '../../utils/helpers.js';

const props = defineProps({
  tournament: {
    type: Object,
    required: true
  }
});

const router = useRouter();

const sportIcon = computed(() => {
  const icons = {
    'Bóng đá': '⚽',
    'Bóng rổ': '🏀',
    'Cầu lông': '🏸',
    'Pickleball': '🎾',
    'Tennis': '🎾',
    'Bóng chuyền': '🏐',
    'Bơi lội': '🏊',
    'Điền kinh': '🏃'
  };
  return icons[props.tournament.sport_category?.name] || '🏆';
});

const sportName = computed(() => {
  return props.tournament.sport_category?.name || 'Thể thao';
});

const statusClass = computed(() => {
  const classes = {
    'upcoming': 'status-upcoming',
    'registration_open': 'status-open',
    'registration_closed': 'status-closed',
    'ongoing': 'status-ongoing',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  };
  return classes[props.tournament.status] || 'status-upcoming';
});

const statusText = computed(() => {
  const texts = {
    'upcoming': 'Sắp diễn ra',
    'registration_open': 'Đang mở đăng ký',
    'registration_closed': 'Đóng đăng ký',
    'ongoing': 'Đang diễn ra',
    'completed': 'Đã kết thúc',
    'cancelled': 'Đã hủy'
  };
  return texts[props.tournament.status] || 'Không xác định';
});

const dateDisplay = computed(() => {
  if (props.tournament.start_date && props.tournament.end_date) {
    return `${formatDate(props.tournament.start_date)} - ${formatDate(props.tournament.end_date)}`;
  }
  return formatDate(props.tournament.start_date) || 'Chưa xác định';
});

const registrationDisplay = computed(() => {
  const count = props.tournament.registration_count || 0;
  const max = props.tournament.max_teams || 0;
  if (max > 0) {
    return `${count}/${max} đội`;
  }
  return `${count} đội đăng ký`;
});

const showProgress = computed(() => {
  return ['upcoming', 'registration_open'].includes(props.tournament.status) &&
         props.tournament.max_teams > 0;
});

const progressPercentage = computed(() => {
  const count = props.tournament.registration_count || 0;
  const max = props.tournament.max_teams || 1;
  return Math.min(Math.round((count / max) * 100), 100);
});

const isCompleted = computed(() => {
  return props.tournament.status === 'completed';
});

const navigateToDetail = () => {
  router.push(`/tournaments/${props.tournament.id}`);
};
</script>

<style scoped>
.tournament-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.tournament-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  height: 120px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sport-icon {
  font-size: 4rem;
  z-index: 1;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 2;
}

.status-upcoming {
  background: rgba(156, 163, 175, 0.9);
  color: white;
}

.status-open {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.status-closed {
  background: rgba(251, 191, 36, 0.9);
  color: #92400e;
}

.status-ongoing {
  background: rgba(59, 130, 246, 0.9);
  color: white;
  animation: pulse 2s infinite;
}

.status-completed {
  background: rgba(107, 114, 128, 0.9);
  color: white;
}

.status-cancelled {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));
}

.card-content {
  padding: 1.25rem;
}

.tournament-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.tournament-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.info-item i {
  color: #3b82f6;
  font-size: 0.875rem;
}

.registration-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.champion-section {
  margin-top: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
}

.card-action {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.95), transparent);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.tournament-card:hover .card-action {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
