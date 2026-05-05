<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <i class="pi pi-spinner pi-spin text-4xl text-white/60"></i>
      </div>

      <!-- Tournament Info -->
      <div v-else-if="tournament" class="space-y-6">
        <!-- Header Card -->
        <div class="glass rounded-2xl p-8">
          <div class="flex flex-col md:flex-row gap-6">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl">
              {{ tournament.sport_category?.icon_url || '🏆' }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-3xl font-bold text-white">{{ tournament.name }}</h1>
                <span class="status-badge" :class="statusClass">{{ statusText }}</span>
              </div>
              <p class="text-white/70 mb-4">{{ tournament.sport_category?.name || 'Thể thao' }}</p>
              <div class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-2 text-white/60">
                  <i class="pi pi-calendar text-blue-400"></i>
                  <span>{{ formatDate(tournament.start_date) }} - {{ formatDate(tournament.end_date) }}</span>
                </div>
                <div class="flex items-center gap-2 text-white/60">
                  <i class="pi pi-users text-green-400"></i>
                  <span>{{ tournament.registration_count || 0 }}/{{ tournament.max_teams }} đội</span>
                </div>
                <div class="flex items-center gap-2 text-white/60">
                  <i class="pi pi-clock text-yellow-400"></i>
                  <span>Hạn đăng ký: {{ formatDate(tournament.registration_deadline) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Rules -->
            <div class="glass rounded-2xl p-6">
              <h2 class="text-xl font-bold text-white mb-4">Thể lệ giải đấu</h2>
              <p class="text-white/70 leading-relaxed">{{ tournament.rules || 'Chưa có thể lệ' }}</p>
            </div>

            <!-- Registered Teams -->
            <div class="glass rounded-2xl p-6">
              <h2 class="text-xl font-bold text-white mb-4">Câu lạc bộ đăng ký</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="reg in approvedRegistrations" :key="reg.id" class="team-item">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {{ getInitials(reg.club?.name) }}
                    </div>
                    <span class="text-white font-medium">{{ reg.club?.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Action Buttons -->
            <div class="glass rounded-2xl p-6 space-y-3">
              <button v-if="canRegister" class="btn-primary w-full">
                <i class="pi pi-sign-in mr-2"></i>
                Đăng ký tham gia
              </button>
              <button class="btn-secondary w-full">
                <i class="pi pi-share-alt mr-2"></i>
                Chia sẻ
              </button>
            </div>

            <!-- Organizer -->
            <div class="glass rounded-2xl p-6">
              <h3 class="text-lg font-bold text-white mb-3">Ban tổ chức</h3>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {{ getInitials(tournament.creator?.full_name || 'A') }}
                </div>
                <div>
                  <p class="text-white font-medium">{{ tournament.creator?.full_name || 'Admin' }}</p>
                  <p class="text-white/60 text-sm">Quản trị viên</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else class="text-center py-16">
        <i class="pi pi-exclamation-circle text-6xl text-white/20 mb-4"></i>
        <h2 class="text-2xl font-bold text-white mb-2">Không tìm thấy giải đấu</h2>
        <p class="text-white/60">Giải đấu này không tồn tại hoặc đã bị xóa</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import { useTournamentStore } from '../../stores/tournament.js';
import { formatDate } from '../../utils/helpers.js';

const route = useRoute();
const authStore = useAuthStore();
const tournamentStore = useTournamentStore();

const tournament = ref(null);
const loading = ref(true);

const statusClass = computed(() => {
  const classes = {
    'upcoming': 'status-upcoming',
    'registration_open': 'status-open',
    'registration_closed': 'status-closed',
    'ongoing': 'status-ongoing',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  };
  return classes[tournament.value?.status] || 'status-upcoming';
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
  return texts[tournament.value?.status] || 'Không xác định';
});

const approvedRegistrations = computed(() => {
  return tournament.value?.registrations?.filter(r => r.status === 'approved') || [];
});

const canRegister = computed(() => {
  return authStore.isAuthenticated && 
         tournament.value?.status === 'registration_open' &&
         tournament.value?.registration_count < tournament.value?.max_teams;
});

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    const result = await tournamentStore.fetchTournament(id);
    if (result.success) {
      tournament.value = tournamentStore.currentTournament;
    }
  }
  loading.value = false;
});
</script>

<style scoped>
.status-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-upcoming {
  background: #e5e7eb;
  color: #374151;
}

.status-open {
  background: #dcfce7;
  color: #166534;
}

.status-closed {
  background: #fef3c7;
  color: #92400e;
}

.status-ongoing {
  background: #dbeafe;
  color: #1e40af;
}

.status-completed {
  background: #f3f4f6;
  color: #6b7280;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.team-item {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
