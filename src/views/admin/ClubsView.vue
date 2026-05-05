<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Quản lý câu lạc bộ</h1>
      
      <!-- Tabs -->
      <div class="flex gap-4 mb-6">
        <button 
          @click="activeTab = 'pending'" 
          :class="['tab-btn', activeTab === 'pending' ? 'active' : '']"
        >
          Chờ duyệt
        </button>
        <button 
          @click="activeTab = 'approved'" 
          :class="['tab-btn', activeTab === 'approved' ? 'active' : '']"
        >
          Đã duyệt
        </button>
      </div>
      
      <div class="glass rounded-2xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="text-left p-4 text-white/80">Tên CLB</th>
              <th class="text-left p-4 text-white/80">Trưởng CLB</th>
              <th class="text-left p-4 text-white/80">Trạng thái</th>
              <th class="text-left p-4 text-white/80">Thành viên</th>
              <th class="text-left p-4 text-white/80">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="club in filteredClubs" :key="club.id" class="border-t border-white/10">
              <td class="p-4 text-white font-medium">{{ club.name }}</td>
              <td class="p-4 text-white/70">{{ club.leader?.full_name || '-' }}</td>
              <td class="p-4">
                <span class="status-badge" :class="getStatusClass(club.status)">
                  {{ getStatusText(club.status) }}
                </span>
              </td>
              <td class="p-4 text-white/70">{{ club.member_count || 0 }}</td>
              <td class="p-4">
                <div class="flex gap-2">
                  <button 
                    v-if="club.status === 'pending'"
                    @click="approveClub(club.id)"
                    class="btn-action bg-green-500/20 text-green-400"
                  >
                    <i class="pi pi-check"></i>
                  </button>
                  <button 
                    v-if="club.status === 'pending'"
                    @click="rejectClub(club.id)"
                    class="btn-action bg-red-500/20 text-red-400"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                  <button 
                    v-if="club.status === 'approved'"
                    @click="suspendClub(club.id)"
                    class="btn-action bg-yellow-500/20 text-yellow-400"
                  >
                    <i class="pi pi-ban"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { clubRepository } from '../../repositories/ClubRepository.js';

const clubs = ref([]);
const activeTab = ref('pending');

const filteredClubs = computed(() => {
  return clubs.value.filter(c => c.status === activeTab.value);
});

const getStatusClass = (s) => ({
  'pending': 'bg-yellow-500/20 text-yellow-400',
  'approved': 'bg-green-500/20 text-green-400',
  'rejected': 'bg-red-500/20 text-red-400',
  'suspended': 'bg-gray-500/20 text-gray-400'
}[s] || 'bg-gray-500/20');

const getStatusText = (s) => ({
  'pending': 'Chờ duyệt',
  'approved': 'Đã duyệt',
  'rejected': 'Từ chối',
  'suspended': 'Tạm khóa'
}[s] || s);

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

const suspendClub = async (id) => {
  const reason = prompt('Lý do tạm khóa:');
  if (reason) {
    await clubRepository.suspend(id, reason);
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
.tab-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.3s;
}

.tab-btn.active {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-action {
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}
</style>
