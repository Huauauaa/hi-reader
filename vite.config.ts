import fs from 'node:fs'
import path from 'node:path'
import type { Connect } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { slashRedirect } from './src/lib/slashRedirect'

const base = process.env.BASE_PATH || '/hi-reader/'

function redirectBareBase(server: { middlewares: Connect.Server }) {
  server.middlewares.use((req, res, next) => {
    const to = slashRedirect(req.url ?? '', base)
    if (!to) return next()
    res.statusCode = 302
    res.setHeader('Location', to)
    res.end()
  })
}

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'redirect-bare-base',
      configureServer: redirectBareBase,
      configurePreviewServer: redirectBareBase,
    },
    {
      name: 'spa-404',
      closeBundle() {
        const dist = path.resolve('dist')
        fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
      },
    },
  ],
  worker: { format: 'es' },
})
