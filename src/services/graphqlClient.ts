import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

// In development: use Vite proxy to /graphql (proxies to graph.roguedatahub.xyz/graphql)
// In production: use Cloudflare proxy (handles CORS for production domain)
const graphqlUrl = import.meta.env.DEV 
  ? '/graphql' 
  : 'https://graphql-proxy.lorddo3066.workers.dev'

const httpLink = createHttpLink({
  uri: graphqlUrl,
})

export const graphqlClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Always fetch from network
    },
    query: {
      fetchPolicy: 'network-only', // Always fetch from network
    },
  },
})

