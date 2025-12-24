import { createRouter, createWebHistory } from 'vue-router'

// Ленивая загрузка компонентов (оптимизация)
const MainVue = () => import('@/components/MainVue.vue')
const AdminView = () => import('@/views/AdminView.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainVue
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
