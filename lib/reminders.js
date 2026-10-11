import { session, request, loadMe, toast } from './api'
let timer, active=false, generation=0, polling=false
export function stopReminders(){active=false;generation++;clearTimeout(timer)}
export function startReminders(){stopReminders();active=true;poll(generation)}
async function poll(epoch){
 if(!active||epoch!==generation)return
 if(!polling&&session.token){polling=true;const token=session.token
  try{if(!session.user)await loadMe();const value=await request('/boost/messages/summary');if(!active||epoch!==generation||token!==session.token)return
   session.user.unread=value.unread
   const key='boost_seen_messages_'+session.user.id,previous=uni.getStorageSync(key)
   const changed=previous&&(value.messageId>previous.messageId||value.noticeId>previous.noticeId)
   uni.setStorageSync(key,{messageId:value.messageId,noticeId:value.noticeId})
   if(changed&&value.unread&&session.user.notifyEnabled)toast('有新的消息或交易通知，请到消息中心查看')
  }catch{/* Normal page requests present connection errors; polling retries quietly. */}finally{polling=false}
 }
 if(active&&epoch===generation)timer=setTimeout(()=>poll(epoch),15000)
}
