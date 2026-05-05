<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="glass rounded-2xl p-8 mb-6">
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
            {{ authStore.userInitials }}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">{{ authStore.userDisplayName }}</h1>
            <p class="text-white/60">{{ authStore.profile?.displayRole }}</p>
            <p class="text-white/40 text-sm mt-1">{{ authStore.profile?.email }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="glass rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-4">Thông tin cá nhân</h2>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-white/60">Họ tên</span>
              <span class="text-white">{{ authStore.profile?.fullName || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/60">Giới tính</span>
              <span class="text-white">{{ authStore.profile?.gender || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/60">Ngày sinh</span>
              <span class="text-white">{{ authStore.profile?.birthDate || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/60">Số điện thoại</span>
              <span class="text-white">{{ authStore.profile?.phone || '-' }}</span>
            </div>
          </div>
          <button class="btn-edit mt-6 w-full">
            <i class="pi pi-pencil mr-2"></i>
            Chỉnh sửa thông tin
          </button>
        </div>

        <div class="glass rounded-2xl p-6">
          <h2 class="text-xl font-bold text-white mb-4">Thống kê</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="stat-box">
              <i class="pi pi-trophy text-2xl text-yellow-400 mb-2"></i>
              <p class="text-2xl font-bold text-white">0</p>
              <p class="text-white/60 text-sm">Giải đấu</p>
            </div>
            <div class="stat-box">
              <i class="pi pi-users text-2xl text-blue-400 mb-2"></i>
              <p class="text-2xl font-bold text-white">0</p>
              <p class="text-white/60 text-sm">Câu lạc bộ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js';
const authStore = useAuthStore();
</script>

<style scoped>
.btn-edit {
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.stat-box {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  text-align: center;
}
</style>
