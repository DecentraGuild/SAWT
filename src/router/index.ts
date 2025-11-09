import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: BaseLayout,
    redirect: '/holdings',
    children: [
      {
        path: '/holdings',
        name: 'Holdings',
        component: () => import('../views/Holdings.vue')
      },
      {
        path: '/total',
        name: 'Total',
        component: () => import('../views/Total.vue')
      },
      {
        path: '/sage',
        name: 'Sage',
        component: () => import('../views/Sage.vue')
      },
      {
        path: '/locker',
        name: 'Locker',
        component: () => import('../views/Locker.vue')
      },
      {
        path: '/faction-claims',
        name: 'FactionClaims',
        component: () => import('../views/FactionClaims.vue')
      },
      {
        path: '/faction-fleets',
        name: 'FactionFleets',
        component: () => import('../views/FactionFleets.vue')
      },
      {
        path: '/marketplace',
        name: 'Marketplace',
        component: () => import('../views/Marketplace.vue')
      },
      {
        path: '/rentals',
        name: 'Rentals',
        component: () => import('../views/Rentals.vue')
      },
      {
        path: '/votes',
        name: 'Votes',
        component: () => import('../views/Votes.vue')
      },
      {
        path: '/raw-data',
        name: 'RawData',
        component: () => import('../views/RawData.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

