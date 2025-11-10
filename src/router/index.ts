import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'

// Get base path from environment or default to '/'
const getBasePath = () => {
  if (import.meta.env.BASE_URL) {
    return import.meta.env.BASE_URL
  }
  return '/'
}

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

const basePath = getBasePath()

const router = createRouter({
  history: createWebHistory(basePath),
  routes
})

// Navigation guard to handle index.html in URL
router.beforeEach((to, from, next) => {
  // If the path contains index.html, redirect to root (which will redirect to /holdings)
  if (to.path.includes('index.html')) {
    next('/')
    return
  }
  next()
})

// Handle GitHub Pages routing issues
if (typeof window !== 'undefined') {
  router.isReady().then(() => {
    // Check for stored redirect path from 404.html
    const storedPath = sessionStorage.getItem('ghp-redirect-path')
    if (storedPath) {
      // Parse the stored path
      const hashIndex = storedPath.indexOf('#')
      const searchIndex = storedPath.indexOf('?')
      
      let path = storedPath
      let query: Record<string, string> = {}
      let hash = ''
      
      // Extract hash
      if (hashIndex !== -1) {
        hash = storedPath.slice(hashIndex)
        path = storedPath.slice(0, hashIndex)
      }
      
      // Extract query params
      if (searchIndex !== -1 && (hashIndex === -1 || searchIndex < hashIndex)) {
        const queryString = path.slice(searchIndex + 1)
        path = path.slice(0, searchIndex)
        query = Object.fromEntries(new URLSearchParams(queryString))
      }
      
      // Clean up immediately
      sessionStorage.removeItem('ghp-redirect-path')
      
      // Navigate to the stored path
      if (path && path !== '/' && path !== basePath) {
        router.replace({ path, query, hash })
      }
    }
  })
}

export default router

