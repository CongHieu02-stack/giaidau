import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';

// Import router
import router from './router/index.js';

// Import auth store for eager initialization
import { useAuthStore } from './stores/auth.js';

// Import root component
import App from './App.vue';

// Import styles
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './style.css';

// Create app instance
const app = createApp(App);

// Create Pinia store
const pinia = createPinia();

// Configure PrimeVue with Aura theme
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.dark',
            cssLayer: false
        }
    },
    ripple: true,
    inputStyle: 'filled'
});

// Use plugins
app.use(pinia);

// Initialize auth before router mounts so session is ready for navigation guards
const authStore = useAuthStore();
authStore.initialize();

app.use(router);
app.use(ToastService);
app.use(ConfirmationService);

// Register directives
app.directive('tooltip', Tooltip);

// Mount the app
app.mount('#app');