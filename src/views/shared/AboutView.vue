<template>
  <div class="about-container">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Về chúng tôi</h1>
        <p class="page-subtitle">Nền tảng quản lý giải đấu thể thao toàn diện</p>
      </div>

      <section class="about-section">
        <div class="about-content">
          <h2>Sứ mệnh</h2>
          <p>
            Chúng tôi xây dựng nền tảng quản lý giải đấu thể thao với mục tiêu đơn giản hóa quy trình tổ chức,
            giúp các câu lạc bộ và ban tổ chức tiết kiệm thời gian, tập trung vào việc mang lại trải nghiệm
            thể thao tuyệt vời cho người chơi và khán giả.
          </p>
        </div>
      </section>

      <section class="about-section">
        <div class="about-content">
          <h2>Tính năng nổi bật</h2>
          <div class="feature-grid">
            <div class="feature-card">
              <i class="pi pi-calendar"></i>
              <h3>Quản lý lịch thi đấu</h3>
              <p>Tự động tạo và quản lý lịch thi đấu thông minh</p>
            </div>
            <div class="feature-card">
              <i class="pi pi-users"></i>
              <h3>Quản lý đội tuyển</h3>
              <p>Đăng ký và quản lý thông tin câu lạc bộ dễ dàng</p>
            </div>
            
            <div class="feature-card">
              <i class="pi pi-mobile"></i>
              <h3>Đa nền tảng</h3>
              <p>Hỗ trợ truy cập trên mọi thiết bị</p>
            </div>
          </div>
        </div>
      </section>

      <section class="about-section">
        <div class="about-content">
          <h2>Liên hệ</h2>
          <p>
            Mọi thắc mắc và góp ý, vui lòng liên hệ với chúng tôi qua email:
            <a href="mailto:support@giaidau.vn" class="contact-link">support@giaidau.vn</a>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// About page component
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  padding: 80px 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 60px;
}

.page-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 16px;
}

.page-subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
}

.about-section {
  margin-bottom: 48px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.about-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}

.about-content p {
  line-height: 1.8;
  color: #cbd5e1;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.feature-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s, background 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.06);
}

.feature-card i {
  font-size: 2rem;
  color: #60a5fa;
  margin-bottom: 12px;
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 0.9rem;
  color: #94a3b8;
}

.contact-link {
  color: #60a5fa;
  text-decoration: none;
}

.contact-link:hover {
  text-decoration: underline;
}
</style>
