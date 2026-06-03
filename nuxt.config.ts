export default defineNuxtConfig({
  ssr: false,
  
  compatibilityDate: '2026-04-03',
  
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'JORDAN - Sistema de Control Interno',
      meta: [
        {
          name: 'description',
          content: 'Sistema de control interno para Purificadora de Agua JORDAN',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/LOGO.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/LOGO.png' },
        { rel: 'apple-touch-icon', href: '/LOGO.png' },
      ],
    },
  },

  css: ['~/assets/styles/globals.css', '~/assets/styles/tailwind.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  pinia: {
    autoImports: ['defineStore', 'storeToRefs'],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || (() => {
        throw new Error('NUXT_PUBLIC_API_BASE no está configurado')
      })(),
    },
  },

  devServer: {
    port: parseInt(process.env.NITRO_PORT || '3001'),
    host: 'localhost',
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  imports: {
    dirs: ['./stores', './composables', './utils'],
  },

  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
      },
    ],
  },

  build: {
    transpile: ['trpc-nuxt'],
  },

  devtools: {
    enabled: false,
  },

  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/sitemap.xml'],
    },
  },

  routeRules: {
    '/api/**': {
      proxy: 'https://backend-jordan-2026.onrender.com/api/**',
    },
  },

  vite: {
    define: {
      '__VITE_BUILD__': 'false',
    },
  },
});
