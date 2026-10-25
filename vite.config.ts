import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // O navegador chama /api na própria origem e o Vite repassa à volta-api.
  // A API ainda não libera CORS para o front, então o proxy resolve isso.
  const proxy = {
    '/api': {
      target:
        env.VITE_API_PROXY_TARGET || 'https://api.qa.54.210.1.34.sslip.io',
      changeOrigin: true,
      rewrite: (caminho: string) => caminho.replace(/^\/api/, ''),
    },
    '/chat-api': {
      target:
        env.VITE_CHAT_PROXY_TARGET || 'https://chat.qa.54.210.1.34.sslip.io',
      changeOrigin: true,
      rewrite: (caminho: string) => caminho.replace(/^\/chat-api/, ''),
    },
    '/ranking-api': {
      target:
        env.VITE_RANKING_PROXY_TARGET ||
        'https://ranking.qa.54.210.1.34.sslip.io',
      changeOrigin: true,
      rewrite: (caminho: string) => caminho.replace(/^\/ranking-api/, ''),
    },
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
