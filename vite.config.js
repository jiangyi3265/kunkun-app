import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// Keep the HBuilderX project structure while also supporting reproducible CLI builds.
process.env.UNI_INPUT_DIR = process.cwd()
const plugins = uni()
// This project keeps node_modules inside UNI_INPUT_DIR. The SDK's H5 API
// detector otherwise mistakes its own runtime for an app using cloud facial
// recognition and injects a blocking remote script on every subsequent visit.
for (const plugin of plugins.flat(Infinity)) {
  if (plugin?.name !== 'uni:h5-api' || typeof plugin.transform !== 'function') continue
  const transform = plugin.transform
  plugin.transform = function (code, id, ...args) {
    if (id.replace(/\\/g, '/').includes('/node_modules/')) return
    return transform.call(this, code, id, ...args)
  }
}
export default defineConfig({
  plugins,
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: {
    '/api': { target: process.env.BOOST_API_URL || 'http://127.0.0.1:8080', changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') }
  }}
})
