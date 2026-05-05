<template>
  <footer class="glass-dark border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-1">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
              <i class="pi pi-trophy text-white text-xl"></i>
            </div>
            <span class="text-xl font-bold gradient-text">MyLeague</span>
          </div>
          <p class="text-white/60 text-sm leading-relaxed">
            Nền tảng quản lý giải đấu thể thao chuyên nghiệp. Kết nối câu lạc bộ, tổ chức giải đấu, theo dõi kết quả.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-white font-semibold mb-4">Liên kết nhanh</h4>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.path">
              <router-link :to="link.path" class="footer-link">
                {{ link.label }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Sports -->
        <div>
          <h4 class="text-white font-semibold mb-4">Bộ môn</h4>
          <ul class="space-y-2">
            <li v-for="sport in sports" :key="sport">
              <span class="footer-link">{{ sport }}</span>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-white font-semibold mb-4">Liên hệ</h4>
          <ul class="space-y-3">
            <li class="flex items-center text-white/60 text-sm">
              <i class="pi pi-envelope mr-3 text-blue-400"></i>
              support@myleague.vn
            </li>
            <li class="flex items-center text-white/60 text-sm">
              <i class="pi pi-phone mr-3 text-green-400"></i>
              1900 1234 56
            </li>
            <li class="flex items-center text-white/60 text-sm">
              <i class="pi pi-map-marker mr-3 text-red-400"></i>
              TP. Hồ Chí Minh, Việt Nam
            </li>
          </ul>
          
          <!-- Social Links -->
          <div class="flex space-x-3 mt-4">
            <a v-for="social in socialLinks" 
               :key="social.name"
               :href="social.url"
               target="_blank"
               rel="noopener noreferrer"
               class="social-link"
               :style="{ '--hover-color': social.color }"
            >
              <i :class="social.icon"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
        <p class="text-white/40 text-sm">
          © {{ currentYear }} MyLeague. All rights reserved.
        </p>
        <div class="flex space-x-6 mt-4 md:mt-0">
          <router-link to="/privacy" class="text-white/40 text-sm hover:text-white/60 transition-colors">
            Chính sách bảo mật
          </router-link>
          <router-link to="/terms" class="text-white/40 text-sm hover:text-white/60 transition-colors">
            Điều khoản sử dụng
          </router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';

const currentYear = computed(() => new Date().getFullYear());

const quickLinks = [
  { path: '/tournaments', label: 'Giải đấu' },
  { path: '/clubs', label: 'Câu lạc bộ' },
  { path: '/about', label: 'Về chúng tôi' },
  { path: '/help', label: 'Trợ giúp' }
];

const sports = [
  'Bóng đá',
  'Bóng rổ',
  'Cầu lông',
  'Pickleball',
  'Tennis',
  'Bóng chuyền'
];

const socialLinks = [
  { name: 'Facebook', icon: 'pi pi-facebook', url: '#', color: '#1877f2' },
  { name: 'YouTube', icon: 'pi pi-youtube', url: '#', color: '#ff0000' },
  { name: 'Instagram', icon: 'pi pi-instagram', url: '#', color: '#e4405f' },
  { name: 'Twitter', icon: 'pi pi-twitter', url: '#', color: '#1da1f2' }
];
</script>

<style scoped>
.footer-link {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.footer-link:hover {
  color: white;
  transform: translateX(4px);
}

.social-link {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: var(--hover-color);
  color: white;
  transform: translateY(-3px);
}
</style>
