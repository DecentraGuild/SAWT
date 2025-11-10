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

// Get base path from environment or default to '/'
const getBasePath = () => {
  if (import.meta.env.BASE_URL) {
    return import.meta.env.BASE_URL
  }
  return '/'
}

const router = createRouter({
  history: createWebHistory(getBasePath()),
  routes
})

// Handle GitHub Pages 404.html redirect
// When GitHub Pages serves 404.html, it stores the original path in sessionStorage
// and redirects to index.html. We need to restore the original path.
if (typeof window !== 'undefined') {
  const storedPath = sessionStorage.getItem('404-redirect-path')
  if (storedPath) {
    // Clear the stored path
    sessionStorage.removeItem('404-redirect-path')
    
    // Extract path, search, and hash
    const hashIndex = storedPath.indexOf('#')
    const searchIndex = storedPath.indexOf('?')
    
    let path = storedPath
    let search = ''
    let hash = ''
    
    // Extract hash first (it comes last)
    if (hashIndex !== -1) {
      hash = storedPath.slice(hashIndex)
      path = storedPath.slice(0, hashIndex)
    }
    
    // Extract search params
    if (searchIndex !== -1 && (hashIndex === -1 || searchIndex < hashIndex)) {
      search = path.slice(searchIndex)
      path = path.slice(0, searchIndex)
    }
    
    // Get the base path and strip it from the stored path
    const basePath = getBasePath()
    if (basePath !== '/' && path.startsWith(basePath)) {
      // Remove the base path from the beginning
      path = path.slice(basePath.length - 1) // -1 to keep the leading /
    }
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    
    // Navigate to the correct path with search and hash
    router.replace(path + search + hash)
  }
}

export default router

