import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Plugin to copy public files to public folder
// index.html stays in public folder along with all other assets
const copyPublicToPublic = () => {
  return {
    name: 'copy-public-to-public',
    closeBundle() {
      const publicDir = join(__dirname, 'public')
      const outPublicDir = join(__dirname, '../backend/public')

      // Create public directory in output
      mkdirSync(outPublicDir, { recursive: true })

      // Copy all files from public to public folder (with original names)
      // This includes favicons, manifest, etc. that aren't processed by Vite
      if (existsSync(publicDir)) {
        const files = readdirSync(publicDir)
        files.forEach((file) => {
          const src = join(publicDir, file)
          const dest = join(outPublicDir, file)
          if (statSync(src).isFile()) {
            copyFileSync(src, dest)
          }
        })
      }
      // index.html is built by Vite and will be in outPublicDir already
    },
  }
}

// Read version from VERSION file
function getVersion(): string {
  try {
    const versionFile = join(__dirname, '../VERSION')
    if (existsSync(versionFile)) {
      const version = readFileSync(versionFile, 'utf-8').trim()
      return version || '1.0.0'
    }
  } catch (error) {
    console.warn('Failed to read VERSION file:', error)
  }
  return '1.0.0'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyPublicToPublic()],
  base: '/public/',
  publicDir: 'public', // Keep publicDir enabled so files are available during dev
  define: {
    __APP_VERSION__: JSON.stringify(getVersion()),
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // All built assets go directly in public folder (no subfolder)
        // Exclude public files from hashing by using a function
        assetFileNames: (assetInfo) => {
          // Don't hash files that come from public directory (they're copied separately)
          const name = assetInfo.name || ''
          if (name.includes('favicon') || name.includes('android-chrome') ||
              name.includes('apple-touch') || name.includes('site.webmanifest')) {
            return '[name][extname]'
          }
          return '[name]-[hash][extname]'
        },
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
      },
    },
  },
})

