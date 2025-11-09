import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.GITHUB_REPOSITORY 
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
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
      },
    },
  },
})

