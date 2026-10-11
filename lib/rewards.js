import {API_BASE,key,request,session} from './api'
export const rewardImage = path => /^\/boost-reward-media\/[a-f0-9]{32}\.png$/.test(path||'') ? API_BASE+path : ''
export const rewardStatus={WAIT_ADDRESS:'待填写地址',WAIT_SHIP:'待发货',SHIPPED:'已发货',COMPLETED:'已完成'}
// Keep an uncertain operation across reloads; the same server key returns its saved result.
export function rewardIntent(kind,id,data={}){
 const memberId=Number(session.user?.id)
 if(!Number.isSafeInteger(memberId)||memberId<1||!session.token)throw new Error('请先登录后重试')
 const storage='reward_intent_'+memberId+'_'+kind+'_'+id
 const saved=uni.getStorageSync(storage)
 if(saved&&saved.memberId===memberId&&typeof saved.data?.requestKey==='string')return {...saved,storage}
 const value={memberId,data:{...data,requestKey:key()}}
 uni.setStorageSync(storage,value);return {...value,storage}
}
export async function submitReward(intent,path){
 const result=await request(path,'POST',intent.data)
 uni.removeStorageSync(intent.storage);return result
}
export function discardRejectedReward(intent,error){if(error.code>=400&&error.code<500&&error.code!==401&&error.code!==429)uni.removeStorageSync(intent.storage)}
