import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Get base path for GitHub Pages
// For project pages: /repository-name/
// For user/organization pages: /
const getBasePath = () => {
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
    // If it's a user/organization page (ends with .github.io), use root
    if (repoName.endsWith('.github.io')) {
      return '/'
    }
    // Otherwise, use the repository name as base path
    return `/${repoName}/`
  }
  return '/'
}

export default defineConfig({
  base: getBasePath(),
  plugins: [vue()],
  optimizeDeps: {
    include: ['@apollo/client', '@vue/apollo-composable']
  },
  server: {
    proxy: {
      '/graphql': {
        target: 'https://graph.roguedatahub.xyz',
        changeOrigin: true,
        secure: true,
        // Vite will automatically append /graphql to the target
      },
    },
  },
})

