<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Quản lý câu lạc bộ</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="glass rounded-xl p-6 text-center">
          <i class="pi pi-users text-4xl text-blue-400 mb-3"></i>
          <p class="text-3xl font-bold text-white">0</p>
          <p class="text-white/60">Thành viên</p>
        </div>
        <div class="glass rounded-xl p-6 text-center">
          <i class="pi pi-trophy text-4xl text-green-400 mb-3"></i>
          <p class="text-3xl font-bold text-white">0</p>
          <p class="text-white/60">Giải đấu</p>
        </div>
        <div class="glass rounded-xl p-6 text-center">
          <i class="pi pi-clock text-4xl text-yellow-400 mb-3"></i>
          <p class="text-3xl font-bold text-white">0</p>
          <p class="text-white/60">Chờ duyệt</p>
        </div>
      </div>

      <div class="glass rounded-2xl p-6">
        <h2 class="text-xl font-bold text-white mb-4">Chức năng</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <router-link to="/club/members" class="feature-btn">
            <i class="pi pi-users text-2xl text-blue-400"></i>
            <span class="text-white font-medium">Thành viên</span>
          </router-link>
          <router-link to="/club/tournaments" class="feature-btn">
            <i class="pi pi-trophy text-2xl text-green-400"></i>
            <span class="text-white font-medium">Giải đấu</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.feature-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  transition: all 0.3s;
}

.feature-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
</style>
