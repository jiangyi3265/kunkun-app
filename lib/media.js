import { reactive } from 'vue'
import { API_BASE, session } from './session'
let request
export function setMediaRequest(handler){request=handler}

const cache = reactive({}), queued = new Set()
let scheduled = false, identity = ''
const isAsset = value => typeof value === 'string' && /^\/boost-media\/[a-f0-9]{32}\.(png|jpg|webp)$/.test(value)
export function clearMediaCache() { for (const key of Object.keys(cache)) delete cache[key]; queued.clear(); identity = session.token }
function currentIdentity() { if (identity !== session.token) clearMediaCache() }
export async function prepareMedia(data) {
  currentIdentity()
  const paths = new Set()
  function visit(value) {
    if (isAsset(value)) paths.add(value)
    else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object') Object.values(value).forEach(visit)
    else if (typeof value === 'string' && value.startsWith('["/boost-media/')) { try { visit(JSON.parse(value)) } catch {} }
  }
  visit(data)
  const needed = [...paths].filter(path => !cache[path] || cache[path].expires < Date.now())
  const token = session.token
  for (let i = 0; i < needed.length; i += 100) {
    const batch = needed.slice(i, i + 100)
    try {
      const grant = await request('/boost/media/access', 'POST', { paths: batch })
      if (token !== session.token) return
      for (const path of batch) cache[path] = { url: grant.urls[path] ? API_BASE + grant.urls[path] : '', expires: Date.now() + (grant.urls[path] ? 90000 : 10000) }
    } catch { if (token === session.token) for (const path of batch) cache[path] = { url: '', expires: Date.now() + 5000 } }
  }
}
export function mediaUrl(path) {
  if (!isAsset(path)) return path || ''
  currentIdentity()
  if (!cache[path] || cache[path].expires < Date.now()) {
    queued.add(path)
    if (!scheduled) { scheduled = true; Promise.resolve().then(async () => { scheduled = false; const paths = [...queued]; queued.clear(); await prepareMedia(paths) }) }
  }
  return cache[path]?.url || ''
}
export async function previewMedia(paths, current) {
  await prepareMedia(paths)
  const urls = paths.map(mediaUrl).filter(Boolean)
  if (urls.length) uni.previewImage({ urls, current: mediaUrl(current) || urls[0] })
}
