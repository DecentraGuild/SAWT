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

// Handle GitHub Pages 404.html redirect format
// When GitHub Pages serves 404.html, it redirects to /?/path
// We need to convert this back to the proper path
if (typeof window !== 'undefined') {
  const search = window.location.search
  if (search && search.startsWith('?/')) {
    // Extract the path from the query string (format: ?/path)
    let path = search.slice(2) // Remove '?/'
    
    // Handle query parameters and hash
    const hashIndex = path.indexOf('#')
    let hash = ''
    if (hashIndex !== -1) {
      hash = path.slice(hashIndex)
      path = path.slice(0, hashIndex)
    }
    
    // Handle query parameters (format: ?/path&param=value)
    const queryIndex = path.indexOf('&')
    if (queryIndex !== -1) {
      path = path.slice(0, queryIndex)
    }
    
    // Replace ~and~ with & (used by 404.html to escape &)
    path = path.replace(/~and~/g, '&')
    
    // Navigate to the correct path
    router.replace(path + hash)
  }
}

export default router

