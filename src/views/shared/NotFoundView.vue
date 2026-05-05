<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="text-center">
      <!-- 404 Icon -->
      <div class="relative w-48 h-48 mx-auto mb-8">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-xl animate-pulse"></div>
        <div class="relative w-full h-full glass rounded-full flex items-center justify-center">
          <span class="text-7xl font-bold gradient-text">404</span>
        </div>
      </div>

      <!-- Message -->
      <h1 class="text-3xl font-bold text-white mb-4">Trang không tìm thấy</h1>
      <p class="text-white/60 mb-8 max-w-md mx-auto">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. 
        Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <router-link to="/" class="btn-primary">
          <i class="pi pi-home mr-2"></i>
          Về trang chủ
        </router-link>
        <button @click="goBack" class="btn-secondary">
          <i class="pi pi-arrow-left mr-2"></i>
          Quay lại
        </button>
      </div>

      <!-- Decorative elements -->
      <div class="mt-12 flex justify-center gap-4">
        <div class="w-3 h-3 rounded-full bg-blue-500/50"></div>
        <div class="w-3 h-3 rounded-full bg-purple-500/50"></div>
        <div class="w-3 h-3 rounded-full bg-pink-500/50"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
