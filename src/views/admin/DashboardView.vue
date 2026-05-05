<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Dashboard Admin</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="glass rounded-xl p-6">
          <i class="pi pi-users text-3xl text-blue-400 mb-3"></i>
          <p class="text-white/60 text-sm">Tổng người dùng</p>
          <p class="text-2xl font-bold text-white">-</p>
        </div>
        <div class="glass rounded-xl p-6">
          <i class="pi pi-trophy text-3xl text-green-400 mb-3"></i>
          <p class="text-white/60 text-sm">Giải đấu</p>
          <p class="text-2xl font-bold text-white">-</p>
        </div>
        <div class="glass rounded-xl p-6">
          <i class="pi pi-building text-3xl text-purple-400 mb-3"></i>
          <p class="text-white/60 text-sm">Câu lạc bộ</p>
          <p class="text-2xl font-bold text-white">-</p>
        </div>
        <div class="glass rounded-xl p-6">
          <i class="pi pi-flag text-3xl text-yellow-400 mb-3"></i>
          <p class="text-white/60 text-sm">Trọng tài</p>
          <p class="text-2xl font-bold text-white">-</p>
        </div>
      </div>

      <div class="glass rounded-2xl p-6">
        <h2 class="text-xl font-bold text-white mb-4">Quản lý nhanh</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <router-link to="/admin/tournaments/create" class="quick-action">
            <i class="pi pi-plus-circle text-2xl text-blue-400"></i>
            <span class="text-white font-medium">Tạo giải đấu</span>
          </router-link>
          <router-link to="/admin/clubs" class="quick-action">
            <i class="pi pi-check-circle text-2xl text-green-400"></i>
            <span class="text-white font-medium">Duyệt CLB</span>
          </router-link>
          <router-link to="/admin/users" class="quick-action">
            <i class="pi pi-user-edit text-2xl text-purple-400"></i>
            <span class="text-white font-medium">Quản lý users</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.quick-action {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  transition: all 0.3s ease;
}
.quick-action:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
</style>
