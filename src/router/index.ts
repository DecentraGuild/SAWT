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

// Build routes with conditional redirect
const rootRedirect = (): string | { path: string; query?: Record<string, string>; hash?: string } => {
  // Check if we have a stored 404 redirect path
  if (typeof window !== 'undefined') {
    const storedPath = sessionStorage.getItem('404-redirect-path')
    if (storedPath) {
      // Parse the stored path to extract path, query, and hash
      const basePath = getBasePath()
      
      // Extract hash first (it comes last in URL)
      const hashIndex = storedPath.indexOf('#')
      const searchIndex = storedPath.indexOf('?')
      
      let path = storedPath
      let query = ''
      let hash = ''
      
      // Extract hash
      if (hashIndex !== -1) {
        hash = storedPath.slice(hashIndex)
        path = storedPath.slice(0, hashIndex)
      }
      
      // Extract query params
      if (searchIndex !== -1 && (hashIndex === -1 || searchIndex < hashIndex)) {
        query = path.slice(searchIndex + 1, hashIndex !== -1 ? hashIndex : undefined)
        path = path.slice(0, searchIndex)
      }
      
      // Strip base path if present
      if (basePath !== '/' && path.startsWith(basePath)) {
        path = path.slice(basePath.length)
      }
      
      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = '/' + path
      }
      
      // Only redirect if it's a valid route (not root)
      if (path !== '/' && path !== basePath) {
        // Return object with path, query, and hash to preserve them
        const result: { path: string; query?: Record<string, string>; hash?: string } = { path }
        if (query) {
          // Parse query string into object
          const params = new URLSearchParams(query)
          result.query = Object.fromEntries(params) as Record<string, string>
        }
        if (hash) {
          result.hash = hash
        }
        return result
      }
    }
  }
  return '/holdings'
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: BaseLayout,
    // Use function redirect to check for 404 restore
    redirect: rootRedirect,
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

// Clean up 404 redirect path from sessionStorage after routes are defined
// The redirect function will handle the actual redirect
if (typeof window !== 'undefined') {
  const storedPath = sessionStorage.getItem('404-redirect-path')
  if (storedPath) {
    // We'll clear it after the router processes it
    // Store it temporarily for the redirect function
  }
}

const router = createRouter({
  history: createWebHistory(basePath),
  routes
})

// Clean up sessionStorage after router is ready
if (typeof window !== 'undefined') {
  router.isReady().then(() => {
    // Clear the 404 redirect path after router has processed it
    sessionStorage.removeItem('404-redirect-path')
  })
}

export default router

