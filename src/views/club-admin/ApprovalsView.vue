<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Duyệt câu lạc bộ</h1>
      
      <div v-if="filteredClubs.length === 0" class="empty-state">
        <div class="empty-icon"><i class="pi pi-shield"></i></div>
        <h3>Không có câu lạc bộ nào chờ duyệt</h3>
      </div>
      
      <div v-else class="clubs-grid">
        <div v-for="(club, i) in filteredClubs" :key="club.id" class="club-card" :style="{ animationDelay: `${i * 0.06}s` }">
          <div class="card-glow"></div>
          <div class="club-header">
            <div class="club-logo">
              <img v-if="club.logoUrl || club.logo_url" :src="club.logoUrl || club.logo_url" :alt="club.name" />
              <span v-else class="logo-initials">{{ getInitials(club.name) }}</span>
            </div>
            <span class="status-badge sb-pending">
              Chờ duyệt
            </span>
          </div>
          <div class="club-body">
            <h3 class="club-name">{{ club.name }}</h3>
            <p class="club-desc text-center">{{ club.description || 'Chưa có mô tả' }}</p>
            <div class="club-stats justify-center mt-4">
              <div class="c-stat">
                <span class="c-stat-icon members"><i class="pi pi-users"></i></span>
                <span>{{ club.member_count || 0 }} thành viên</span>
              </div>
              <div class="c-stat">
                <span class="c-stat-icon trophies"><i class="pi pi-trophy"></i></span>
                <span>{{ club.tournament_count || 0 }} giải đấu</span>
              </div>
            </div>
          </div>
          <div class="club-footer">
            <div class="flex gap-2">
              <button 
                @click="approveClub(club.id)"
                class="btn-action flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <i class="pi pi-check"></i> Phê duyệt
              </button>
              <button 
                @click="rejectClub(club.id)"
                class="btn-action flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <i class="pi pi-times"></i> Từ chối
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { clubRepository } from '../../repositories/ClubRepository.js';

const clubs = ref([]);

const filteredClubs = computed(() => {
  return clubs.value.filter(c => c.status === 'pending');
});

const getInitials = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL';

const approveClub = async (id) => {
  await clubRepository.approve(id);
  loadClubs();
};

const rejectClub = async (id) => {
  const reason = prompt('Lý do từ chối:');
  if (reason) {
    await clubRepository.reject(id, reason);
    loadClubs();
  }
};

const loadClubs = async () => {
  const result = await clubRepository.findWithMemberCount();
  if (result.isOk()) clubs.value = result.getValue();
};

onMounted(loadClubs);
</script>

<style scoped>
/* Grid */
.clubs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }

/* Club Card */
.club-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0; animation: fadeUp 0.5s ease forwards;
  display: flex;
  flex-direction: column;
}
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.club-card:hover { transform: translateY(-8px); border-color: rgba(99,102,241,0.3); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1); }
.card-glow {
  position: absolute; inset: 0; opacity: 0; pointer-events: none;
  background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 65%);
  transition: opacity 0.3s;
}
.club-card:hover .card-glow { opacity: 1; }

/* Club Header */
.club-header {
  padding: 1.25rem 1.25rem 1rem;
  display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.club-logo {
  width: 70px; height: 70px; border-radius: 14px; overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
}
.club-logo img { width: 100%; height: 100%; object-fit: cover; }
.logo-initials { color: white; font-weight: 800; font-size: 1.5rem; }

.status-badge {
  padding: 0.4rem 0.8rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 700;
}
.sb-pending  { background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }

/* Club Body */
.club-body { padding: 1.5rem 1.25rem; flex: 1; display: flex; flex-direction: column; align-items: center; }
.club-name { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; text-align: center; }
.club-desc {
  font-size: 0.875rem; color: rgba(255,255,255,0.45); margin-bottom: 0.875rem;
  line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.club-stats { display: flex; gap: 1rem; width: 100%; }
.c-stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: rgba(255,255,255,0.6); }
.c-stat-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
}
.c-stat-icon.members { background: rgba(99,102,241,0.2); color: #a5b4fc; }
.c-stat-icon.trophies { background: rgba(245,158,11,0.2); color: #fcd34d; }

/* Club Footer */
.club-footer { padding: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); }

/* Empty */
.empty-state { text-align: center; padding: 5rem 1rem; }
.empty-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2rem; color: rgba(99,102,241,0.5); }
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
</style>
