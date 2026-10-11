import {reactive,watch,onScopeDispose} from 'vue'
import {onHide,onUnload} from '@dcloudio/uni-app'
import {session} from './session'

// A real rendered confirmation in both H5 and WeChat. Pending actions are
// cancelled when the page leaves or the signed-in session changes.
export function useConfirmation(){
 const confirmation=reactive({id:0,open:false,title:'',content:''})
 let pending=null
 function answerConfirmation(answer){
  if(!pending||(answer&&answer.id!==confirmation.id))return
  const accepted=answer?.accepted===true
  const resolve=pending;pending=null;confirmation.open=false
  confirmation.title='';confirmation.content='';resolve(accepted===true)
 }
 function confirm(content,title='请确认'){
  answerConfirmation(false)
  confirmation.id++;confirmation.title=title;confirmation.content=content;confirmation.open=true
  return new Promise(resolve=>{pending=resolve})
 }
 const cancel=()=>answerConfirmation(false)
 watch(()=>session.token,cancel,{flush:'sync'})
 onHide(cancel);onUnload(cancel);onScopeDispose(cancel)
 return {confirmation,confirm,answerConfirmation}
}
