<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Thông báo</h1>
      
      <div class="space-y-4">
        <div v-for="i in 3" :key="i" class="glass rounded-xl p-4 flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <i class="pi pi-bell text-blue-400"></i>
          </div>
          <div class="flex-1">
            <p class="text-white font-medium">Thông báo mẫu {{ i }}</p>
            <p class="text-white/60 text-sm">Nội dung thông báo...</p>
            <p class="text-white/40 text-xs mt-2">2 giờ trước</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
