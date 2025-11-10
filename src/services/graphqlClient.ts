import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

// Use proxy in development to avoid CORS issues, Cloudflare proxy in production
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

