import { API_BASE, session } from './session'
export { API_BASE, session } from './session'
import { prepareMedia, mediaUrl, clearMediaCache, setMediaRequest } from './media'
setMediaRequest(request)
export async function linkWechat(){
  // #ifdef MP-WEIXIN
  const token=session.token
  const login=await new Promise((resolve,reject)=>uni.login({provider:'weixin',success:resolve,fail:()=>reject(new Error('微信授权失败，请重试'))}));assertSession(token);await request('/boost/auth/wechat-link','POST',{code:login.code})
  // #endif
}
export async function confirmTransfer(id){
  if((await loadConfig()).paymentsEnabled===false)throw new Error('支付及资金操作暂未开放')
  // #ifdef MP-WEIXIN
  const p=await request(`/boost/wallet/withdrawals/${id}/confirmation`);await new Promise((resolve,reject)=>wx.requestMerchantTransfer({mchId:p.mchId,appId:p.appId,package:p.package,success:resolve,fail:()=>reject(new Error('尚未确认收款，请重试'))}));toast('请稍后刷新提现记录')
  // #endif
  // #ifndef MP-WEIXIN
  throw new Error('请在微信小程序中确认收款')
  // #endif
}
let openingLogin = false
function assertSession(token) {
  if (session.token !== token) throw Object.assign(new Error('登录状态已变化，请重试'), { code: 'SESSION_CHANGED' })
}
function expired(token, status, code) {
  if ((status === 401 || code === 401) && token && session.token === token) {
    clearSession(); toast('登录已失效，请重新登录'); requireLogin()
  }
}
export function request(path, method = 'GET', data) {
  const token = session.token
  return new Promise((resolve, reject) => uni.request({ url: API_BASE + path, method, data, timeout: 15000,
    header: { 'Content-Type': 'application/json', 'X-Boost-Token': token },
    success: async ({ data: response, statusCode }) => {
      try {
        assertSession(token)
        expired(token, statusCode, response?.code)
        if (statusCode < 200 || statusCode >= 300 || response?.code !== 200) throw Object.assign(new Error(response?.msg || '请求失败，请稍后重试'), {code:response?.code||statusCode})
        if (path !== '/boost/media/access') await prepareMedia(response.data)
        assertSession(token)
        resolve(response.data)
      } catch (e) { reject(e) }
    },
    fail: () => reject(new Error('连接失败，请检查网络后重试')) }))
}
export async function loadConfig() {
  if (session.config) return session.config
  const config = await request('/boost/config')
  if (typeof config?.policyVersion !== 'string' || !config.policyVersion.trim()) throw new Error('协议配置不完整，请稍后重试')
  session.config = config
  return config
}
export async function loadMe() { const token = session.token; if (token) { const user = await request('/boost/me'); if (session.token !== token) throw new Error('登录状态已变化，请重试'); session.user = user } return session.user }
export function setSession(data) { session.token = data.token; session.user = data.user; uni.setStorageSync('boost_token', data.token) }
export function clearSession() { session.token = ''; session.user = null; uni.removeStorageSync('boost_token'); clearMediaCache() }
export function requireLogin() { if (session.token) return true; const pages = getCurrentPages(); if (!openingLogin && pages[pages.length-1]?.route !== 'pages/auth/index') { openingLogin = true; uni.navigateTo({ url: '/pages/auth/index', complete: () => { openingLogin = false } }) } return false }
export function go(path, params = {}) { const q = Object.entries(params).filter(([,v]) => v !== undefined && v !== null).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); uni.navigateTo({ url: '/pages/' + path + (q ? '?' + q : '') }) }
export function toast(title) { uni.showToast({ title, icon: 'none', duration: 2400 }) }
export async function safely(action, success = '') { try { const result = await action(); if (success) toast(success); return result === undefined ? true : result } catch(e) { toast(e.message); return false } }
export function money(cents = 0) { return (Number(cents) / 100).toFixed(2).replace(/\.00$/, '') }
export function date(v) { return v ? String(v).replace('T',' ').slice(5,16) : '' }
export function key() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2) }
export function imageUrl(path) { return mediaUrl(path) }
export function images(value) { try { return Array.isArray(value) ? value : JSON.parse(value || '[]') } catch { return [] } }
export async function chatWith(peerId, listingId) { if (!requireLogin()) return; const r = await safely(() => request('/boost/conversations','POST',{peerId,listingId})); if(r) go('chat/index',{id:r.id}) }
export function confirm(content, title = '请确认') { return new Promise(resolve => uni.showModal({title,content,confirmText:'确认',confirmColor:'#191919',success:r=>resolve(r.confirm),fail:()=>resolve(false)})) }
export async function upload(path, purpose = 'LISTING') { const token=session.token; return new Promise((resolve,reject)=>uni.uploadFile({url:API_BASE+'/boost/upload',filePath:path,name:'file',formData:{purpose},timeout:30000,header:{'X-Boost-Token':token},success:r=>{try{assertSession(token);const d=JSON.parse(r.data);expired(token,r.statusCode,d.code);if(r.statusCode>=200&&r.statusCode<300&&d.code===200)resolve(d.data.url);else reject(new Error(d.msg||'上传失败'))}catch(e){reject(e instanceof SyntaxError?new Error('上传响应无效，请重试'):e)}},fail:()=>reject(new Error('图片上传失败，请重试'))})) }
export async function payOrder(id) {
 const token=session.token,c=await loadConfig();assertSession(token);if(c.paymentsEnabled===false)throw new Error('支付及资金操作暂未开放');if(c.simulatedPayment){if(!await confirm('这是本地测试支付，不会扣除真实资金。确认后道具订单将进入待交付状态。','测试支付'))return false;assertSession(token);await request(`/boost/orders/${id}/simulated-pay`,'POST');return true}
 // #ifdef MP-WEIXIN
 await linkWechat();const p=await request(`/boost/orders/${id}/wechat-pay`,'POST');await new Promise((resolve,reject)=>uni.requestPayment({...p,success:resolve,fail:()=>reject(new Error('支付未完成，可在订单中继续支付'))}));toast('支付结果确认中，请稍后刷新订单');return true
 // #endif
 // #ifndef MP-WEIXIN
 // eslint-disable-next-line no-unreachable -- uni-app removes the other platform branch before compilation.
 throw new Error('请在微信小程序内完成支付')
 // #endif
}
export const labels={WAIT_DELIVERY:'待交付',WAIT_CONFIRM:'待收货',SOLD:'已售出',VERIFIED:'已实名',WAIT_PAY:'待付款',WAIT_START:'待开始',IN_PROGRESS:'进行中',REVIEW:'待验收',COMPLETED:'已完成',CANCELLED:'已取消',AFTERSALE:'售后中',REFUNDED:'已退款',REFUNDING:'退款中',REFUND_EXCEPTION:'退款异常',ACTIVE:'上架中',PENDING:'审核中',OFFLINE:'已下架',REJECTED:'未通过',RESERVED:'待付款',MATCHED:'已接单',APPROVED:'已认证',NONE:'未认证',SIMULATED_PAID:'测试已完成',PROCESSING:'处理中',WAIT_USER_CONFIRM:'待确认收款',PAID:'已到账',FAILED:'转账失败'}
