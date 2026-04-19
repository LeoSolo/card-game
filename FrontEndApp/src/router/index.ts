import { createRouter, createWebHashHistory } from 'vue-router'
import StartPage from '@views/StartPage.vue'
import HubPage from '@views/HubPage.vue'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'start-page',
            component: StartPage
        },
        {
            path: '/hub',
            name: 'hub-page',
            component: HubPage
        }
    ]
})

export default router