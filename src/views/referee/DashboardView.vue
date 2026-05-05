<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Trọng tài Dashboard</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="glass rounded-xl p-6 text-center">
          <i class="pi pi-calendar text-4xl text-blue-400 mb-3"></i>
          <p class="text-3xl font-bold text-white">0</p>
          <p class="text-white/60">Trận sắp tới</p>
        </div>
        <div class="glass rounded-xl p-6 text-center">
          <i class="pi pi-check-circle text-4xl text-green-400 mb-3"></i>
          <p class="text-3xl font-bold text-white">0</p>
          <p class="text-white/60">Trận đã bắt</p>
        </div>
      </div>

      <div class="glass rounded-2xl p-6">
        <h2 class="text-xl font-bold text-white mb-4">Lịch thi đấu</h2>
        <router-link to="/referee/matches" class="btn-primary inline-flex">
          <i class="pi pi-list mr-2"></i>
          Xem danh sách trận đấu
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
}
</style>
