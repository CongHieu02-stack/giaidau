<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Quản lý thành viên</h1>
      
      <div class="flex gap-4 mb-6">
        <button @click="activeTab = 'approved'" :class="['tab-btn', activeTab === 'approved' ? 'active' : '']">
          Thành viên
        </button>
        <button @click="activeTab = 'pending'" :class="['tab-btn', activeTab === 'pending' ? 'active' : '']">
          Chờ duyệt
        </button>
      </div>

      <div class="glass rounded-2xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="text-left p-4 text-white/80">Họ tên</th>
              <th class="text-left p-4 text-white/80">Giới tính</th>
              <th class="text-left p-4 text-white/80">Vai trò</th>
              <th class="text-left p-4 text-white/80">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in filteredMembers" :key="m.id" class="border-t border-white/10">
              <td class="p-4 text-white">{{ m.user?.full_name }}</td>
              <td class="p-4 text-white/70">{{ m.user?.gender || '-' }}</td>
              <td class="p-4 text-white/70">{{ m.role }}</td>
              <td class="p-4">
                <div class="flex gap-2">
                  <button v-if="m.status === 'pending'" @click="approveMember(m.id)" class="btn-action bg-green-500/20 text-green-400">
                    <i class="pi pi-check"></i>
                  </button>
                  <button v-if="m.status === 'pending'" @click="rejectMember(m.id)" class="btn-action bg-red-500/20 text-red-400">
                    <i class="pi pi-times"></i>
                  </button>
                  <button v-if="m.status === 'approved'" @click="removeMember(m.id)" class="btn-action bg-red-500/20 text-red-400">
                    <i class="pi pi-trash"></i>
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
import { ref, computed } from 'vue';

const activeTab = ref('approved');
const members = ref([]);

const filteredMembers = computed(() => members.value.filter(m => m.status === activeTab.value));

const approveMember = async (id) => { /* TODO */ };
const rejectMember = async (id) => { /* TODO */ };
const removeMember = async (id) => { /* TODO */ };
</script>

<style scoped>
.tab-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 0.75rem;
  font-weight: 600;
}

.tab-btn.active {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.btn-action {
  padding: 0.5rem;
  border-radius: 0.5rem;
}
</style>
