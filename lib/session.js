import { reactive } from 'vue'
let base=import.meta.env.VITE_API_BASE_URL||''
// #ifdef H5
if(!base)base='/api'
// #endif
// #ifndef H5
if(!base)base=import.meta.env.DEV?'http://127.0.0.1:8080':''
// #endif
export const API_BASE=base.replace(/\/$/,'')
let startupStorageIssue=''
function restoredToken(){
  try {
    const token=uni.getStorageSync('boost_token')
    if(token && typeof token!=='string'){
      startupStorageIssue='INVALID_SESSION_STORAGE'
      return ''
    }
    return token||''
  } catch {
    // Storage is optional for anonymous browsing; never let it abort App registration.
    startupStorageIssue='SESSION_STORAGE_UNAVAILABLE'
    return ''
  }
}
export const session=reactive({token:restoredToken(),user:null,config:null})
export function consumeStartupStorageIssue(){
  const issue=startupStorageIssue
  startupStorageIssue=''
  return issue
}
