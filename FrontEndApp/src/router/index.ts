import { createRouter, createWebHashHistory } from 'vue-router';

import HubPage from '@views/HubPage.vue';
import CombatPage from '@views/CombatPage.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'hub-page',
      component: HubPage,
    },
    {
      path: '/hub',
      redirect: '/',
    },
    {
      path: '/combat',
      name: 'combat-page',
      component: CombatPage,
    },
  ],
});

export default router;
