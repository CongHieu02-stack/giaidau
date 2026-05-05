<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Quản lý người dùng</h1>
      
      <div class="glass rounded-2xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="text-left p-4 text-white/80">Họ tên</th>
              <th class="text-left p-4 text-white/80">Email</th>
              <th class="text-left p-4 text-white/80">Vai trò</th>
              <th class="text-left p-4 text-white/80">Trạng thái</th>
              <th class="text-left p-4 text-white/80">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-t border-white/10">
              <td class="p-4 text-white font-medium">{{ user.fullName }}</td>
              <td class="p-4 text-white/70">{{ user.email }}</td>
              <td class="p-4">
                <select 
                  v-model="user.role" 
                  @change="updateRole(user.id, user.role)"
                  class="role-select"
                >
                  <option value="user">Thành viên</option>
                  <option value="club_leader">Trưởng CLB</option>
                  <option value="club_deputy">Phó CLB</option>
                  <option value="referee">Trọng tài</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </td>
              <td class="p-4">
                <span class="status-badge" :class="getStatusClass(user.status)">
                  {{ getStatusText(user.status) }}
                </span>
              </td>
              <td class="p-4">
                <button 
                  v-if="user.status === 'active'"
                  @click="suspendUser(user.id)"
                  class="btn-action bg-red-500/20 text-red-400"
                >
                  <i class="pi pi-ban"></i>
                </button>
                <button 
                  v-else
                  @click="unlockUser(user.id)"
                  class="btn-action bg-green-500/20 text-green-400"
                >
                  <i class="pi pi-check"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userRepository } from '../../repositories/UserRepository.js';

const users = ref([]);

const getStatusClass = (s) => ({
  'active': 'bg-green-500/20 text-green-400',
  'suspended': 'bg-yellow-500/20 text-yellow-400',
  'banned': 'bg-red-500/20 text-red-400'
}[s] || 'bg-gray-500/20');

const getStatusText = (s) => ({
  'active': 'Hoạt động',
  'suspended': 'Tạm khóa',
  'banned': 'Cấm'
}[s] || s);

const updateRole = async (id, role) => {
  await userRepository.updateRole(id, role);
};

const suspendUser = async (id) => {
  const reason = prompt('Lý do khóa:');
  if (reason) {
    await userRepository.updateStatus(id, 'suspended', reason);
    loadUsers();
  }
};

const unlockUser = async (id) => {
  await userRepository.updateStatus(id, 'active');
  loadUsers();
};

const loadUsers = async () => {
  const result = await userRepository.findAll();
  if (result.isOk()) users.value = result.getValue();
};

onMounted(loadUsers);
</script>

<style scoped>
.role-select {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
}

.role-select option {
  background: #1e1b4b;
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
