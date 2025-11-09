import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { DefaultApolloClient } from '@vue/apollo-composable'
import router from './router'
import App from './App.vue'
import { graphqlClient } from './services/graphqlClient'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.provide(DefaultApolloClient, graphqlClient)
app.use(router)
app.mount('#app')
