<template>
  <div class="page-wrapper">
    <div class="max-w-7xl mx-auto">

      <!-- Hero -->
      <div class="page-hero">
        <div class="hero-glow"></div>
        <div class="hero-content">
          <div class="hero-icon"><i class="pi pi-shield"></i></div>
          <div>
            <h1 class="hero-title">Câu lạc bộ</h1>
            <p class="hero-subtitle">Danh sách các câu lạc bộ đã đăng ký</p>
          </div>
        </div>
        <div class="controls-row">
          <div class="search-wrap">
            <i class="pi pi-search search-ico"></i>
            <input v-model="searchQuery" type="text" placeholder="Tìm kiếm câu lạc bộ..." class="search-field" />
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-ico"><i class="pi pi-times"></i></button>
          </div>
          <button v-if="authStore.isAuthenticated" @click="showCreateModal = true" class="btn-create">
            <i class="pi pi-plus"></i> Tạo CLB
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-pill" v-for="s in statsPills" :key="s.label">
          <span class="pill-val">{{ s.val }}</span>
          <span class="pill-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="skeletons">
        <div v-for="n in 6" :key="n" class="skeleton-card">
          <div class="sk-header"></div>
          <div class="sk-body">
            <div class="sk-line w60"></div>
            <div class="sk-line w80"></div>
            <div class="sk-line w40"></div>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div v-else-if="filteredClubs.length > 0" class="clubs-grid">
        <div v-for="(club, i) in filteredClubs" :key="club.id" class="club-card" :style="{ animationDelay: `${i * 0.06}s` }">
          <div class="card-glow"></div>
          <div class="club-header">
            <div class="club-logo">
              <img v-if="club.logoUrl || club.logo_url" :src="club.logoUrl || club.logo_url" :alt="club.name" />
              <span v-else class="logo-initials">{{ getInitials(club.name) }}</span>
            </div>
            <span class="status-badge" :class="getStatusClass(club.status)">
              {{ getStatusText(club.status) }}
            </span>
          </div>
          <div class="club-body">
            <h3 class="club-name">{{ club.name }}</h3>
            <p class="club-desc">{{ club.description || 'Chưa có mô tả' }}</p>
            <div class="club-stats">
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
            <template v-if="authStore.isAuthenticated">
              <div v-if="club.leaderId === authStore.user?.id" class="btn-leader">
                <i class="pi pi-star-fill"></i> Trưởng CLB
              </div>
              <template v-else>
                <div v-if="userMemberships[club.id] === 'pending'" class="btn-pending">
                  <i class="pi pi-clock"></i> Chờ duyệt
                </div>
                <div v-else-if="userMemberships[club.id] === 'member' || userMemberships[club.id] === 'approved'" class="btn-joined">
                  <i class="pi pi-check-circle"></i> Đã tham gia
                </div>
                <button v-else @click="handleJoin(club)" :disabled="joiningClubId === club.id" class="btn-join">
                  <i v-if="joiningClubId === club.id" class="pi pi-spinner pi-spin"></i>
                  <i v-else class="pi pi-user-plus"></i> Tham gia
                </button>
              </template>
            </template>
            <router-link :to="`/clubs/${club.id}`" class="btn-view">
              Chi tiết <i class="pi pi-arrow-right"></i>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <div class="empty-icon"><i class="pi pi-shield"></i></div>
        <h3>Không tìm thấy câu lạc bộ nào</h3>
        <p>Thử tìm kiếm với từ khóa khác</p>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon"><i class="pi pi-plus"></i></div>
            <h2 class="modal-title">Tạo câu lạc bộ mới</h2>
          </div>
          <button @click="showCreateModal = false" class="modal-close"><i class="pi pi-times"></i></button>
        </div>
        <form @submit.prevent="handleCreate" class="modal-body">
          <div class="form-grid">
            <label class="field field-wide">
              <span>Tên CLB <span class="req">*</span></span>
              <input v-model.trim="createForm.name" type="text" placeholder="Nhập tên câu lạc bộ" required />
            </label>
            <label class="field">
              <span>Tên viết tắt</span>
              <input v-model.trim="createForm.short_name" type="text" placeholder="VD: MU, RM" />
            </label>
            <label class="field">
              <span>Logo URL</span>
              <input v-model.trim="createForm.logo_url" type="url" placeholder="https://..." />
            </label>
            <label class="field field-wide">
              <span>Mô tả</span>
              <textarea v-model.trim="createForm.description" rows="3" placeholder="Giới thiệu về câu lạc bộ..."></textarea>
            </label>
          </div>
          <div v-if="createError" class="form-error"><i class="pi pi-exclamation-circle"></i> {{ createError }}</div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn-cancel" :disabled="creating">Hủy</button>
            <button type="submit" class="btn-submit" :disabled="creating">
              <i :class="creating ? 'pi pi-spinner pi-spin' : 'pi pi-check'"></i>
              {{ creating ? 'Đang tạo...' : 'Tạo CLB' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { clubRepository } from '../../repositories/ClubRepository.js';
import { supabase } from '../../config/supabase.js';

const authStore = useAuthStore();
const clubs = ref([]);
const searchQuery = ref('');
const loading = ref(false);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref('');
const createForm = ref({ name: '', short_name: '', description: '', logo_url: '' });

const userMemberships = ref({});
const joiningClubId = ref(null);

const filteredClubs = computed(() => {
  if (!searchQuery.value) return clubs.value;
  const q = searchQuery.value.toLowerCase();
  return clubs.value.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
});

const statsPills = computed(() => [
  { val: clubs.value.length, label: 'Tổng CLB' },
  { val: clubs.value.filter(c => c.status === 'approved').length, label: 'Đã duyệt' },
  { val: clubs.value.filter(c => c.status === 'pending').length, label: 'Chờ duyệt' },
  { val: clubs.value.reduce((s, c) => s + (c.member_count || 0), 0), label: 'Thành viên' },
]);

const getInitials = n => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const getStatusClass = s => ({ pending: 'sb-pending', approved: 'sb-approved', rejected: 'sb-rejected', suspended: 'sb-suspended', dissolved: 'sb-dissolved' }[s] || 'sb-pending');
const getStatusText  = s => ({ pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', suspended: 'Tạm khóa', dissolved: 'Giải thể' }[s] || 'Không xác định');

const resetForm = () => { createForm.value = { name:'', short_name:'', description:'', logo_url:'' }; createError.value = ''; };

const handleCreate = async () => {
  if (!createForm.value.name.trim()) { createError.value = 'Vui lòng nhập tên câu lạc bộ'; return; }
  creating.value = true; createError.value = '';
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('clubs').insert({
      name: createForm.value.name.trim(),
      short_name: createForm.value.short_name.trim() || null,
      description: createForm.value.description.trim() || null,
      logo_url: createForm.value.logo_url.trim() || null,
      leader_id: authStore.user?.id || null,
      status: 'pending', member_count: 0, tournament_count: 0,
      created_at: now, updated_at: now
    }).select().single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Không nhận được dữ liệu. Có thể do RLS policy.');
    clubs.value.unshift(data);
    showCreateModal.value = false;
    resetForm();
  } catch (err) {
    createError.value = err.message || 'Tạo câu lạc bộ thất bại';
  } finally {
    creating.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    // Parallelize club fetching and membership status check to reduce total loading time
    const promises = [clubRepository.findWithMemberCount({ filters: { status: 'approved' } })];
    
    if (authStore.isAuthenticated && authStore.user) {
      promises.push(supabase
        .from('club_members')
        .select('club_id, status')
        .eq('user_id', authStore.user.id)
      );
    }
    
    const [clubsResult, membershipResult] = await Promise.all(promises);
    
    if (clubsResult.isOk()) {
      clubs.value = clubsResult.getValue();
    }
    
    if (membershipResult && !membershipResult.error) {
      const memberships = {};
      membershipResult.data.forEach(m => memberships[m.club_id] = m.status);
      userMemberships.value = memberships;
    }
  } catch (e) { 
    console.error('Error loading clubs:', e); 
  } finally { 
    loading.value = false; 
  }
});

const handleJoin = async (club) => {
  if (!authStore.isAuthenticated) return;
  joiningClubId.value = club.id;
  try {
    const { error } = await supabase.from('club_members').insert({
      club_id: club.id,
      user_id: authStore.user.id,
      role: 'member',
      status: 'pending',
      joined_at: new Date().toISOString()
    });
    if (error) throw error;
    userMemberships.value[club.id] = 'pending';
  } catch (err) {
    console.error(err);
    alert('Lỗi khi tham gia câu lạc bộ: ' + err.message);
  } finally {
    joiningClubId.value = null;
  }
};
</script>

<style scoped>
.page-wrapper { min-height: 100vh; padding: 6rem 1.5rem 3rem; }

/* Hero */
.page-hero {
  position: relative; margin-bottom: 1.5rem;
  padding: 2rem 2rem 1.5rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.5rem; overflow: hidden;
}
.hero-glow {
  position: absolute; top: -60px; left: -60px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
  pointer-events: none;
}
.hero-content { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.hero-icon {
  width: 56px; height: 56px; border-radius: 1rem; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; color: white;
  box-shadow: 0 8px 24px rgba(99,102,241,0.4);
}
.hero-title { font-size: 2rem; font-weight: 800; color: white; line-height: 1.1; }
.hero-subtitle { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-top: 0.25rem; }

.controls-row { display: flex; flex-wrap: wrap; gap: 0.875rem; align-items: center; }

/* Search */
.search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 380px; }
.search-ico { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.35); font-size: 0.9rem; }
.search-field {
  width: 100%; padding: 0.7rem 2.5rem 0.7rem 2.5rem;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.875rem; color: white; font-size: 0.875rem; transition: all 0.2s;
}
.search-field:focus { outline: none; border-color: rgba(99,102,241,0.5); background: rgba(255,255,255,0.09); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.search-field::placeholder { color: rgba(255,255,255,0.3); }
.clear-ico {
  position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
  width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; cursor: pointer; transition: all 0.2s;
}
.clear-ico:hover { background: rgba(239,68,68,0.3); color: #fca5a5; }

.btn-create {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white; font-size: 0.875rem; font-weight: 600;
  border-radius: 0.875rem; transition: all 0.25s;
  box-shadow: 0 4px 16px rgba(99,102,241,0.3);
}
.btn-create:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }

/* Stats */
.stats-bar { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
.stat-pill {
  flex: 1; min-width: 130px; display: flex; flex-direction: column; align-items: center;
  padding: 0.875rem 1rem; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 1rem; transition: all 0.2s;
}
.stat-pill:hover { background: rgba(255,255,255,0.06); }
.pill-val { font-size: 1.75rem; font-weight: 800; color: white; line-height: 1; }
.pill-label { font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-top: 0.25rem; }

/* Grid */
.clubs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }

/* Club Card */
.club-card {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1.25rem; overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  opacity: 0; animation: fadeUp 0.5s ease forwards;
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
  width: 60px; height: 60px; border-radius: 14px; overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(99,102,241,0.3);
}
.club-logo img { width: 100%; height: 100%; object-fit: cover; }
.logo-initials { color: white; font-weight: 800; font-size: 1.375rem; }

.status-badge {
  padding: 0.3rem 0.7rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700;
}
.sb-pending  { background: rgba(251,191,36,0.15); color: #fde68a; border: 1px solid rgba(251,191,36,0.25); }
.sb-approved { background: rgba(34,197,94,0.15);  color: #86efac; border: 1px solid rgba(34,197,94,0.25); }
.sb-rejected { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.sb-suspended{ background: rgba(107,114,128,0.2); color: #d1d5db; border: 1px solid rgba(107,114,128,0.3); }
.sb-dissolved{ background: rgba(107,114,128,0.15);color: #9ca3af; border: 1px solid rgba(107,114,128,0.2); }

/* Club Body */
.club-body { padding: 1rem 1.25rem; }
.club-name { font-size: 1.1rem; font-weight: 700; color: white; margin-bottom: 0.4rem; }
.club-desc {
  font-size: 0.82rem; color: rgba(255,255,255,0.45); margin-bottom: 0.875rem;
  line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.club-stats { display: flex; gap: 1rem; }
.c-stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.5); }
.c-stat-icon {
  width: 24px; height: 24px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; font-size: 0.7rem;
}
.c-stat-icon.members { background: rgba(99,102,241,0.2); color: #a5b4fc; }
.c-stat-icon.trophies { background: rgba(245,158,11,0.2); color: #fcd34d; }

/* Club Footer */
.club-footer { padding: 0.875rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 0.5rem; }
.btn-view {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  flex: 1; padding: 0.65rem 0.5rem;
  background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
  color: #a5b4fc; font-size: 0.85rem; font-weight: 600;
  border-radius: 0.75rem; text-decoration: none; transition: all 0.25s;
}
.btn-view:hover { background: rgba(99,102,241,0.25); border-color: rgba(99,102,241,0.4); color: #c7d2fe; transform: translateY(-1px); }
.btn-view .pi { transition: transform 0.2s; }
.btn-view:hover .pi { transform: translateX(3px); }

.btn-join {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  flex: 1; padding: 0.65rem 0.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); border: 1px solid transparent;
  color: white; font-size: 0.85rem; font-weight: 600;
  border-radius: 0.75rem; text-decoration: none; transition: all 0.25s; cursor: pointer;
}
.btn-join:hover { box-shadow: 0 4px 12px rgba(99,102,241,0.4); transform: translateY(-1px); }
.btn-join:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn-joined {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  flex: 1; padding: 0.65rem 0.5rem;
  background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.2);
  color: #86efac; font-size: 0.85rem; font-weight: 600;
  border-radius: 0.75rem; text-decoration: none;
}
.btn-pending {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  flex: 1; padding: 0.65rem 0.5rem;
  background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.2);
  color: #fde68a; font-size: 0.85rem; font-weight: 600;
  border-radius: 0.75rem; text-decoration: none;
}
.btn-leader {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  flex: 1; padding: 0.65rem 0.5rem;
  background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.2);
  color: #c084fc; font-size: 0.85rem; font-weight: 600;
  border-radius: 0.75rem; text-decoration: none;
}

/* Skeleton */
.skeletons { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
.skeleton-card { border-radius: 1.25rem; overflow: hidden; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); animation: shimmer 1.8s infinite; }
.sk-header { height: 100px; background: rgba(255,255,255,0.06); }
.sk-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
.sk-line { height: 12px; border-radius: 6px; background: rgba(255,255,255,0.07); }
.w60 { width: 60%; } .w80 { width: 80%; } .w40 { width: 40%; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }

/* Empty */
.empty-state { text-align: center; padding: 5rem 1rem; }
.empty-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2rem; color: rgba(99,102,241,0.5); }
.empty-state h3 { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
.empty-state p { color: rgba(255,255,255,0.4); font-size: 0.875rem; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(2,6,23,0.8); backdrop-filter: blur(8px); padding: 1rem; }
.modal-panel { width: min(560px, 100%); background: rgba(13,11,40,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.25rem; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1); animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1); }
@keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(-12px)} to{opacity:1;transform:scale(1) translateY(0)} }

.modal-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06)); }
.modal-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
.modal-icon { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: white; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: white; }
.modal-close { width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.modal-close:hover { background: rgba(255,255,255,0.14); color: white; }

.modal-body { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.4rem; color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; }
.field-wide { grid-column: 1 / -1; }
.field input, .field textarea { padding: 0.65rem 0.875rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.625rem; color: white; font: inherit; transition: all 0.2s; resize: vertical; }
.field input:focus, .field textarea:focus { outline: none; border-color: rgba(99,102,241,0.5); background: rgba(255,255,255,0.08); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.field input::placeholder, .field textarea::placeholder { color: rgba(255,255,255,0.25); }
.req { color: #f87171; }
.form-error { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 0.875rem; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); border-radius: 0.625rem; color: #fca5a5; font-size: 0.85rem; margin-bottom: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-cancel { padding: 0.65rem 1.25rem; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); border-radius: 0.625rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.875rem; }
.btn-cancel:hover { background: rgba(255,255,255,0.12); }
.btn-submit { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.5rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; border-radius: 0.625rem; font-weight: 600; cursor: pointer; transition: all 0.25s; font-size: 0.875rem; box-shadow: 0 4px 16px rgba(99,102,241,0.3); }
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }
.btn-cancel:disabled, .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

@media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }
</style>
