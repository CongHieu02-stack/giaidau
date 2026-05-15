<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">
      
      <!-- Hero Header -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-shield"></i></div>
          <div>
            <h1 class="hero-title">Quản lý Trọng tài</h1>
            <p class="hero-subtitle">Danh sách đội ngũ trọng tài và hiệu suất điều hành trận đấu</p>
          </div>
        </div>
        
        <div class="controls-row">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input v-model="searchQuery" type="text" placeholder="Tìm kiếm trọng tài..." />
          </div>
          
          <div class="stats-group">
            <div class="stat-pill">
              <i class="pi pi-users"></i>
              <span>{{ filteredReferees.length }} trọng tài</span>
            </div>
            <div class="stat-pill active">
              <i class="pi pi-check-circle"></i>
              <span>{{ activeRefereesCount }} đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Đang tải danh sách trọng tài...</span>
      </div>

      <!-- Content Grid -->
      <div v-else-if="filteredReferees.length > 0" class="referee-grid">
        <div 
          v-for="(ref, i) in filteredReferees" 
          :key="ref.id" 
          class="referee-card"
          :style="{ animationDelay: `${i * 0.05}s` }"
        >
          <div class="card-glow"></div>
          
          <div class="card-header">
            <div class="avatar-wrap">
              <img v-if="ref.avatarUrl" :src="ref.avatarUrl" class="ref-avatar" />
              <div v-else class="avatar-placeholder">{{ getInitials(ref.fullName) }}</div>
              <span :class="['status-dot', ref.status]"></span>
            </div>
            <div class="ref-info">
              <h3 class="ref-name">{{ ref.fullName }}</h3>
              <p class="ref-email">{{ ref.email }}</p>
            </div>
          </div>

          <div class="card-body">
            <div class="stat-row">
              <div class="mini-stat">
                <span class="label">Trận điều hành</span>
                <span class="val">{{ refMatchCounts[ref.id] || 0 }}</span>
              </div>
              <div class="mini-stat">
                <span class="label">Đánh giá</span>
                <span class="val">4.8 <i class="pi pi-star-fill text-yellow-500"></i></span>
              </div>
            </div>
            
            <div class="ref-tags">
              <span class="tag">FIFA Certified</span>
              <span class="tag">Chuyên nghiệp</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-secondary" @click="viewRefereeMatches(ref)">
              <i class="pi pi-list"></i> Xem trận đấu
            </button>
            <button class="btn-icon">
              <i class="pi pi-envelope"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="pi pi-users"></i></div>
        <h3>Không tìm thấy trọng tài</h3>
        <p>Vui lòng kiểm tra lại từ khóa tìm kiếm</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { userRepository } from '../../repositories/UserRepository.js';
import { supabase } from '../../config/supabase.js';

const referees = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const refMatchCounts = ref({});

const loadData = async () => {
  loading.value = true;
  try {
    const result = await userRepository.findByRole('referee');
    if (result.isOk()) {
      referees.value = result.getValue();
      
      // Fetch match counts for each referee
      const { data: matchCounts } = await supabase
        .from('matches')
        .select('referee_id')
        .not('referee_id', 'is', null);
      
      const counts = {};
      matchCounts?.forEach(m => {
        counts[m.referee_id] = (counts[m.referee_id] || 0) + 1;
      });
      refMatchCounts.value = counts;
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    loading.value = false;
  }
};

const filteredReferees = computed(() => {
  if (!searchQuery.value) return referees.value;
  const q = searchQuery.value.toLowerCase();
  return referees.value.filter(r => 
    r.fullName.toLowerCase().includes(q) || 
    r.email?.toLowerCase().includes(q)
  );
});

const activeRefereesCount = computed(() => {
  return referees.value.filter(r => r.status === 'active').length;
});

const getInitials = (name) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
};

const viewRefereeMatches = (referee) => {
  // Logic to filter matches by this referee in the MatchesView
  // For now, we can just log or alert
  alert(`Xem lịch sử điều hành của trọng tài ${referee.fullName}`);
};

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
  background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 1.5rem; position: relative; z-index: 1; }
.hero-icon {
  width: 64px; height: 64px; border-radius: 1.25rem; flex-shrink: 0;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; color: white;
  box-shadow: 0 12px 30px rgba(139,92,246,0.4);
}
.hero-title { font-size: 2.5rem; font-weight: 800; color: white; line-height: 1.1; margin: 0; }
.hero-subtitle { font-size: 1rem; color: rgba(255,255,255,0.5); margin-top: 0.5rem; }

.controls-row { 
  display: flex; flex-wrap: wrap; gap: 1.5rem; 
  align-items: center; justify-content: space-between;
  position: relative; z-index: 1;
}

.search-box {
  position: relative; flex: 1; max-width: 400px;
}
.search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); }
.search-box input {
  width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1rem; color: white; font-size: 0.9rem;
}

.stats-group { display: flex; gap: 0.75rem; }
.stat-pill {
  display: inline-flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 1.25rem; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07); border-radius: 999px;
  color: rgba(255,255,255,0.5); font-size: 0.875rem; font-weight: 700;
}
.stat-pill.active { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.2); color: #4ade80; }

/* ── Grid ── */
.referee-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;
}

.referee-card {
  position: relative; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07); border-radius: 1.5rem;
  padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; opacity: 0; animation: fadeUp 0.5s ease forwards;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.referee-card:hover {
  transform: translateY(-8px); border-color: rgba(139,92,246,0.3);
  background: rgba(255,255,255,0.05);
}

.card-header { display: flex; align-items: center; gap: 1.25rem; }
.avatar-wrap { position: relative; }
.ref-avatar { width: 64px; height: 64px; border-radius: 1.25rem; object-fit: cover; border: 2px solid rgba(255,255,255,0.1); }
.avatar-placeholder {
  width: 64px; height: 64px; border-radius: 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 800; color: white;
}
.status-dot {
  position: absolute; bottom: -2px; right: -2px;
  width: 16px; height: 16px; border-radius: 50%;
  border: 3px solid #020617;
}
.status-dot.active { background: #22c55e; }
.status-dot.suspended { background: #ef4444; }

.ref-name { font-size: 1.15rem; font-weight: 700; color: white; margin: 0; }
.ref-email { font-size: 0.85rem; color: rgba(255,255,255,0.4); margin: 0.1rem 0 0; }

.card-body { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.25rem; }
.stat-row { display: flex; gap: 1.5rem; margin-bottom: 1.25rem; }
.mini-stat { display: flex; flex-direction: column; gap: 0.2rem; }
.mini-stat .label { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; }
.mini-stat .val { font-size: 1rem; font-weight: 700; color: white; }

.ref-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.tag {
  padding: 0.25rem 0.6rem; border-radius: 0.5rem;
  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6);
  font-size: 0.75rem; font-weight: 600;
}

.card-footer { display: flex; gap: 0.75rem; margin-top: auto; }
.btn-secondary {
  flex: 1; padding: 0.75rem; border-radius: 0.875rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: white; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  transition: all 0.2s;
}
.btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }

.btn-icon {
  width: 44px; height: 44px; border-radius: 0.875rem;
  display: flex; align-items: center; justify-content: center;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
  color: #c4b5fd; cursor: pointer; transition: all 0.2s;
}
.btn-icon:hover { background: rgba(139,92,246,0.2); color: white; }

/* ── States ── */
.loading-state, .empty-state {
  padding: 6rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center;
}
.loading-state .pi-spinner { font-size: 3rem; color: #8b5cf6; margin-bottom: 1.5rem; }
.empty-icon {
  width: 90px; height: 90px; border-radius: 2rem;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.5rem; font-size: 2.5rem; color: rgba(255,255,255,0.1);
}
.empty-state h3 { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 0.75rem; }
.empty-state p { color: rgba(255,255,255,0.4); }
</style>
