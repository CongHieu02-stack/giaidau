# Frontend - Vue 3 MVC Structure

## Structure
```
frontend/src/
├── api/                 # API calls (Service layer)
│   ├── index.js         # Axios config
│   ├── auth.api.js      # Auth API
│   ├── user.api.js      # User API
│   ├── club.api.js      # Club API
│   └── tournament.api.js # Tournament API
│
├── assets/              # Static assets
├── components/          # Reusable UI components
│   ├── common/          # Common components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
│
├── composables/         # Vue 3 composables (Logic)
│   ├── useAuth.js       # Auth logic
│   ├── useUser.js       # User logic
│   ├── useClub.js       # Club logic
│   └── useTournament.js # Tournament logic
│
├── config/              # Configuration
├── middleware/          # Route guards
├── router/              # Vue Router config
│
├── stores/              # Pinia stores (State management)
│   ├── auth.store.js    # Auth state
│   ├── user.store.js    # User state
│   ├── club.store.js    # Club state
│   └── tournament.store.js # Tournament state
│
├── utils/               # Utility functions
├── validators/          # Form validation
│
└── views/               # Page components (View layer)
    ├── admin/
    ├── club-admin/
    ├── tournament-admin/
    ├── referee/
    ├── shared/
    └── user/
```

## MVC Flow (Frontend)
```
View (Vue Component) 
    ↓ (calls)
Composable (Logic)
    ↓ (calls)
Store (State) 
    ↓ (calls)
API Service (HTTP)
    ↓
Backend API
```

## Example: Getting User Data

**View** (`views/user/ProfileView.vue`):
```vue
<script setup>
import { useUserStore } from '@/stores/user.store';

const userStore = useUserStore();
const user = computed(() => userStore.currentUser);
</script>
```

**Store** (`stores/user.store.js`):
```js
const fetchUser = async (id) => {
  const { data } = await UserAPI.getById(id);
  currentUser.value = data.user;
};
```

**API** (`api/user.api.js`):
```js
const getById = (id) => api.get(`/users/${id}`);
```

## Setup
```bash
cd frontend
npm install
npm run dev
```
