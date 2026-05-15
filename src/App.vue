<template>
  <div class="app-container">
    <AppNavbar v-if="!isAuthPage" />
    <main :class="['main-content', { 'with-navbar': !isAuthPage }]">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter v-if="!isAuthPage" />
    <Toast position="top-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppNavbar from './components/layout/AppNavbar.vue';
import AppFooter from './components/layout/AppFooter.vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const route = useRoute();
const isAuthPage = computed(() => {
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  return authPages.includes(route.path);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-content {
  flex: 1;
  background-color: #080b1a;
  background-image: 
    radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 70%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
  background-attachment: fixed;
}

.main-content.with-navbar {
  padding-top: 72px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content.with-navbar {
    padding-top: 68px;
  }
}

/* ── Page transition animations ── */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* ── Micro-interactions ── */
button, .p-button, .btn-join, .secondary-button, .primary-button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

button:active, .p-button:active, .btn-join:active, .secondary-button:active, .primary-button:active {
  transform: scale(0.97);
}

.p-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.p-card {
  border-radius: 16px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.p-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.p-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.p-inputtext, .p-dropdown, .p-calendar {
  border-radius: 8px;
}

.p-datatable {
  border-radius: 16px;
  overflow: hidden;
}

/* Glass morphism effect - improved for all browsers */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Animated gradient text */
.gradient-text {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Floating animation */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.float-animation {
  animation: float 3s ease-in-out infinite;
}

/* Pulse glow animation */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(96, 165, 250, 0.3); }
  50% { box-shadow: 0 0 40px rgba(96, 165, 250, 0.6); }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Slide animations */
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.slide-in-right {
  animation: slideInRight 0.5s ease-out;
}

.slide-in-left {
  animation: slideInLeft 0.5s ease-out;
}

.slide-in-up {
  animation: slideInUp 0.5s ease-out;
}

/* Scale animation */
@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.scale-in {
  animation: scaleIn 0.3s ease-out;
}

/* Fade animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(96, 165, 250, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(96, 165, 250, 0.7);
}
</style>