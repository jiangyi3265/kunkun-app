import { key, session } from './api'

// A response may be lost after commit. Persist each pending intent until it is acknowledged.
export function retryIntent(scope, payload) {
  const storage = `boost_intent_${session.user?.id}_${scope}`
  const fingerprint = JSON.stringify(payload)
  const existing = uni.getStorageSync(storage)
  if (existing?.fingerprint === fingerprint && existing.requestKey) return { ...existing, storage }
  const intent = { requestKey: key(), fingerprint, payload }
  uni.setStorageSync(storage, intent)
  return { ...intent, storage }
}
export function completeIntent(intent) { if (uni.getStorageSync(intent.storage)?.requestKey === intent.requestKey) uni.removeStorageSync(intent.storage) }

export function pendingIntent(scope) {const storage=`boost_intent_${session.user?.id}_${scope}`;const value=uni.getStorageSync(storage);return value?.requestKey?{...value,storage}:null}
