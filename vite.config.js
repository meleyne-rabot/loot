import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Simule en dev la Vercel Function /api/generate.js (Vite seul ne sait pas
// exécuter le dossier /api — vercel dev le ferait, mais on veut que `npm run
// dev` marche directement).
function devApiPlugin(env) {
  return {
    name: 'dev-api-generate',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', async () => {
          try {
            const { runGenerate } = await server.ssrLoadModule('/api/_generateCore.js')
            const payload = raw ? JSON.parse(raw) : {}
            const { status, body } = await runGenerate(payload, env.ANTHROPIC_API_KEY)
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Erreur serveur dev', detail: String(err) }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      devApiPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false, // on fournit déjà public/manifest.webmanifest
        includeManifestIcons: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
          skipWaiting: true,
          clientsClaim: true,
        },
      }),
    ],
  }
})
