<template>
  <footer class="footer-root">
    <!-- Decorative top glow line -->
    <div class="footer-glow-line"></div>

    <div class="footer-container">
      <!-- Main Grid -->
      <div class="footer-grid">

        <!-- Brand Column -->
        <div class="footer-brand">
          <div class="brand-logo">
            <div class="brand-icon">
              <i class="pi pi-trophy"></i>
            </div>
            <span class="brand-name">MyLeague</span>
          </div>
          <p class="brand-desc">
            Nền tảng quản lý giải đấu thể thao chuyên nghiệp. Kết nối câu lạc bộ, tổ chức giải đấu, theo dõi kết quả.
          </p>
          <!-- Social Links -->
          <div class="social-row">
            <button
              v-for="social in socialLinks"
              :key="social.name"
              @click="openSocial(social.url)"
              class="social-btn"
              :style="{ '--social-color': social.color, '--social-glow': social.glow }"
              :title="social.name"
              type="button"
            >
              <i :class="social.icon"></i>
            </button>
          </div>
        </div>

        <!-- Quick Links Column -->
        <div class="footer-col">
          <div class="col-header">
            <span class="col-dot"></span>
            <h4>Liên kết nhanh</h4>
          </div>
          <ul class="footer-links">
            <li v-for="link in quickLinks" :key="link.path">
              <router-link :to="link.path" class="footer-link">
                <i class="pi pi-angle-right link-arrow"></i>
                {{ link.label }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Sports Column -->
        <div class="footer-col">
          <div class="col-header">
            <span class="col-dot"></span>
            <h4>Bộ môn</h4>
          </div>
          <ul class="footer-links">
            <li v-for="sport in sports" :key="sport">
              <span class="footer-link">
                <i class="pi pi-angle-right link-arrow"></i>
                {{ sport }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Contact Column -->
        <div class="footer-col">
          <div class="col-header">
            <span class="col-dot"></span>
            <h4>Liên hệ</h4>
          </div>
          <ul class="contact-list">
            <li class="contact-item">
              <span class="contact-icon email-icon"><i class="pi pi-envelope"></i></span>
              <span>support@myleague.vn</span>
            </li>
            <li class="contact-item">
              <span class="contact-icon phone-icon"><i class="pi pi-phone"></i></span>
              <span>1900 1234 56</span>
            </li>
            <li class="contact-item">
              <span class="contact-icon map-icon"><i class="pi pi-map-marker"></i></span>
              <span>TP. Hồ Chí Minh, Việt Nam</span>
            </li>
          </ul>
        </div>

      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-left">
          <span class="copyright-badge">
            <i class="pi pi-shield"></i>
            © {{ currentYear }} MyLeague
          </span>
          <span class="separator">·</span>
          <span class="rights-text">All rights reserved.</span>
        </div>
        <div class="footer-bottom-right">
          <router-link to="/privacy" class="bottom-link">Chính sách bảo mật</router-link>
          <span class="separator">·</span>
          <router-link to="/terms" class="bottom-link">Điều khoản sử dụng</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>



function openSocial(url) {
  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

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
  { name: 'Facebook', icon: 'pi pi-facebook', url: 'https://www.facebook.com/thien.155729/', color: '#1877f2', glow: '29, 119, 242' },
  { name: 'YouTube',  icon: 'pi pi-youtube',  url: 'https://www.youtube.com/@cristiano', color: '#ff0000', glow: '255, 0, 0' },
  { name: 'Instagram',icon: 'pi pi-instagram',url: 'https://www.instagram.com/cristiano/', color: '#e4405f', glow: '228, 64, 95' },
  { name: 'X / Twitter', icon: 'pi pi-twitter', url: 'https://www.bing.com/ck/a?!&&p=3e82a5f95187ae8b53931bc56939859631d66ea4a13b7e28cd035a58d7c8a4baJmltdHM9MTc3ODExMjAwMA&ptn=3&ver=2&hsh=4&fclid=3a87f3d4-ba8d-65bb-0eb9-e55ebbeb64d2&psq=x+cristiano+ronaldo&u=a1aHR0cHM6Ly94LmNvbS9jcmlzdGlhbm8', color: '#1da1f2', glow: '29, 161, 242' },
];
</script>

<style scoped>
/* ── Root ─────────────────────────────── */
.footer-root {
  position: relative;
  background: linear-gradient(180deg, #0d0d1a 0%, #080813 100%);
  overflow: hidden;
}

/* Decorative top glow line */
.footer-glow-line {
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(139, 92, 246, 0.6) 30%,
    rgba(59, 130, 246, 0.8) 50%,
    rgba(236, 72, 153, 0.6) 70%,
    transparent 100%
  );
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}

/* Subtle background pattern */
.footer-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 10% 100%, rgba(99,102,241,0.07) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 90% 80%, rgba(236,72,153,0.06) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Container ─────────────────────────── */
.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 32px 32px;
  position: relative;
  z-index: 1;
}

/* ── Main Grid ─────────────────────────── */
.footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.2fr;
  gap: 48px;
  padding-bottom: 40px;
}

@media (max-width: 1024px) {
  .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
}
@media (max-width: 600px) {
  .footer-grid { grid-template-columns: 1fr; gap: 28px; }
  .footer-container { padding: 36px 20px 24px; }
}

/* ── Brand ─────────────────────────────── */
.footer-brand {}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.45);
  flex-shrink: 0;
}

.brand-icon .pi {
  color: white;
  font-size: 1.25rem;
}

.brand-name {
  font-size: 1.375rem;
  font-weight: 800;
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
}

.brand-desc {
  color: rgba(255,255,255,0.48);
  font-size: 0.875rem;
  line-height: 1.7;
  margin-bottom: 24px;
}

/* ── Social row ─────────────────────────── */
.social-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
  text-decoration: none;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.social-btn:focus,
.social-btn:focus-visible {
  outline: none;
  box-shadow: none;
}

.social-btn:active {
  transform: translateY(-2px) scale(1.04);
}

.social-btn:hover {
  background: var(--social-color);
  border-color: var(--social-color);
  color: white;
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 8px 24px rgba(var(--social-glow), 0.45);
}

/* ── Column ────────────────────────────── */
.footer-col {}

.col-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.col-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
  flex-shrink: 0;
}

.col-header h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.3px;
  margin: 0;
}

/* ── Footer links ────────────────────────── */
.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.5);
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.footer-link:hover {
  color: rgba(255,255,255,0.9);
  transform: translateX(4px);
}

.link-arrow {
  font-size: 0.75rem;
  color: rgba(139, 92, 246, 0.6);
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.footer-link:hover .link-arrow {
  color: #a78bfa;
  transform: translateX(2px);
}

/* ── Contact ─────────────────────────────── */
.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: rgba(255,255,255,0.55);
  font-size: 0.875rem;
  line-height: 1.5;
}

.contact-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.email-icon {
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.25);
  color: #818cf8;
}

.phone-icon {
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.22);
  color: #4ade80;
}

.map-icon {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.22);
  color: #f87171;
}

/* ── Bottom bar ──────────────────────────── */
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 28px;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.footer-bottom-left,
.footer-bottom-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.copyright-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.22);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
  font-weight: 600;
}

.copyright-badge .pi {
  font-size: 0.75rem;
  color: #818cf8;
}

.rights-text {
  color: rgba(255,255,255,0.35);
  font-size: 0.8rem;
}

.separator {
  color: rgba(255,255,255,0.2);
  font-size: 0.85rem;
}

.bottom-link {
  color: rgba(255,255,255,0.4);
  font-size: 0.8rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.bottom-link:hover {
  color: rgba(255,255,255,0.8);
}
</style>
