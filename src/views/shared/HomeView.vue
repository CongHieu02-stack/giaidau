<template>
  <div class="home-container">
    <!-- Hero Section - Simple and clean -->
    <section class="hero-section">
      <div class="container">
        <div class="badge">
          <span class="pulse-dot"></span>
          <span>Nền tảng quản lý giải đấu hàng đầu</span>
        </div>

        <h1 class="hero-title">
          <span class="text-white">Quản lý giải đấu</span>
          <span class="gradient-text">đẳng cấp chuyên nghiệp</span>
        </h1>

        <p class="hero-desc">
          Tạo và quản lý giải đấu, kết nối câu lạc bộ, theo dõi lịch thi đấu và kết quả trực tuyến.
        </p>

        <div class="hero-buttons">
          <router-link to="/tournaments" class="btn-primary">
            <i class="pi pi-trophy"></i>
            Khám phá giải đấu
          </router-link>
          <router-link v-if="!authStore.isAuthenticated" to="/register" class="btn-secondary">
            <i class="pi pi-user-plus"></i>
            Đăng ký ngay
          </router-link>
        </div>

        <!-- Stats in a simple row -->
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-value">500+</div>
            <div class="stat-label">Giải đấu</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">1000+</div>
            <div class="stat-label">CLB</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">50K+</div>
            <div class="stat-label">Thành viên</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">10K+</div>
            <div class="stat-label">Trận đấu</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Tournaments -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Giải đấu nổi bật</h2>
            <p class="section-subtitle">Các giải đấu đang và sắp diễn ra</p>
          </div>
          <router-link to="/tournaments" class="link-text">
            Xem tất cả <i class="pi pi-arrow-right"></i>
          </router-link>
        </div>

        <div class="tournament-grid">
          <TournamentCard 
            v-for="tournament in featuredTournaments" 
            :key="tournament.id"
            :tournament="tournament"
          />
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="section">
      <div class="container">
        <div class="section-header center">
          <h2 class="section-title">Tính năng nổi bật</h2>
          <p class="section-subtitle">Mọi thứ bạn cần để tổ chức và quản lý giải đấu</p>
        </div>

        <div class="feature-grid">
          <FeatureCard 
            v-for="feature in features" 
            :key="feature.title"
            v-bind="feature"
          />
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="container">
        <div class="cta-box">
          <h2 class="cta-title">Sẵn sàng tổ chức giải đấu?</h2>
          <p class="cta-desc">Đăng ký miễn phí và bắt đầu tạo giải đấu ngay hôm nay.</p>
          <router-link :to="authStore.isAuthenticated ? '/admin/tournaments/create' : '/register'" class="btn-primary">
            <i class="pi pi-play"></i>
            {{ authStore.isAuthenticated ? 'Tạo giải đấu' : 'Bắt đầu ngay' }}
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import TournamentCard from '../../components/common/TournamentCard.vue';
import FeatureCard from '../../components/common/FeatureCard.vue';

const authStore = useAuthStore();

const featuredTournaments = ref([
  {
    id: 1,
    name: 'GDU Tennis Open 2026',
    sport_category: { name: 'Tennis', icon_url: '🎾' },
    status: 'registration_open',
    registration_deadline: '2026-05-01',
    start_date: '2026-05-15',
    max_teams: 32,
    registration_count: 24
  },
  {
    id: 2,
    name: 'Cúp Bóng Đá IT Dragons',
    sport_category: { name: 'Bóng đá', icon_url: '⚽' },
    status: 'ongoing',
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    champion_club: null
  },
  {
    id: 3,
    name: 'Giải Cầu Lông Công Ty',
    sport_category: { name: 'Cầu lông', icon_url: '🏸' },
    status: 'upcoming',
    registration_deadline: '2026-06-01',
    start_date: '2026-06-15',
    max_teams: 16,
    registration_count: 8
  },
  {
    id: 4,
    name: 'Pickleball Championship',
    sport_category: { name: 'Pickleball', icon_url: '🎾' },
    status: 'registration_open',
    registration_deadline: '2026-07-01',
    start_date: '2026-07-15',
    max_teams: 24,
    registration_count: 12
  }
]);

const features = ref([
  {
    icon: 'pi pi-calendar-plus',
    title: 'Tạo giải đấu dễ dàng',
    description: 'Thiết lập giải đấu chỉ trong vài phút với form trực quan.'
  },
  {
    icon: 'pi pi-users',
    title: 'Quản lý câu lạc bộ',
    description: 'Quản lý thành viên, đăng ký tham gia giải đấu.'
  },
  {
    icon: 'pi pi-clock',
    title: 'Lịch thi đấu tự động',
    description: 'Hệ thống tự động tạo lịch thi đấu vòng tròn hoặc loại.'
  },
  {
    icon: 'pi pi-mobile',
    title: 'Cập nhật trực tiếp',
    description: 'Trọng tài cập nhật kết quả, người xem theo dõi realtime.'
  },
  {
    icon: 'pi pi-chart-bar',
    title: 'Thống kê chi tiết',
    description: 'Bảng xếp hạng, thống kê cầu thủ đầy đủ.'
  },
  {
    icon: 'pi pi-bell',
    title: 'Thông báo thông minh',
    description: 'Nhận thông báo về lịch thi đấu, kết quả.'
  }
]);
</script>

<style scoped>
/* Container */
.home-container {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}

/* Hero Section */
.hero-section {
  padding-top: 6rem;
  padding-bottom: 3rem;
  text-align: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .hero-title {
    font-size: 2.5rem;
  }
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: 3.5rem;
  }
}

.hero-title span {
  display: block;
}

.hero-title span:first-child {
  margin-bottom: 0.25rem;
}

.gradient-text {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 600px;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

@media (min-width: 640px) {
  .hero-desc {
    font-size: 1.125rem;
  }
}

/* Buttons */
.hero-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  .hero-buttons {
    flex-direction: row;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Stats */
.stats-row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  max-width: 700px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .stats-row {
    gap: 1rem;
  }
}

.stat-box {
  flex: 1;
  min-width: 0;
  max-width: 150px;
  padding: 1rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
}

@media (min-width: 640px) {
  .stat-value {
    font-size: 1.5rem;
  }
}

@media (min-width: 768px) {
  .stat-value {
    font-size: 2rem;
  }
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 640px) {
  .stat-label {
    font-size: 0.875rem;
  }
}

/* Sections */
.section {
  padding: 2rem 0;
}

@media (min-width: 768px) {
  .section {
    padding: 3rem 0;
  }
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .section-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.section-header.center {
  text-align: center;
  align-items: center;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

@media (min-width: 640px) {
  .section-title {
    font-size: 1.5rem;
  }
}

.section-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.link-text {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.3s ease;
}

.link-text:hover {
  color: white;
}

.link-text i {
  transition: transform 0.3s ease;
}

.link-text:hover i {
  transform: translateX(4px);
}

/* Grids */
.tournament-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .tournament-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .tournament-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .tournament-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* CTA Box */
.cta-box {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .cta-box {
    padding: 3rem;
  }
}

.cta-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

@media (min-width: 640px) {
  .cta-title {
    font-size: 1.5rem;
  }
}

.cta-desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}
</style>
