<template><AppShell :title="title" back><view class="pad"><StateView v-if="needsData" :loading="loading" :error="error" :count="data.length" :title="emptyTitle" description="你的使用记录会保留在这里" @retry="load" /><StateView v-if="['profile','settings','security'].includes(type)" :loading="loading" :error="loadError" :count="ready?1:0" @retry="load" /><template v-if="['favorites','history'].includes(type)"><view v-for="item in data" :key="item.id" style="margin-bottom:12px"><ServiceCard :item="item" horizontal /><text v-if="item.status!=='ACTIVE'" class="muted tiny">{{labels[item.status]}}，暂时无法下单</text></view></template><template v-else-if="type==='coupons'"><view v-for="c in data" :key="c.id" class="coupon" :class="{expired:c.usedOrderId||new Date(c.expiresAt)<new Date()}"><view class="coupon-value">¥{{money(c.discountCents)}}</view><view class="flex-1 stack"><text class="bold">{{c.title}}</text><text class="muted tiny">满 ¥{{money(c.minimumCents)}} 可用</text><text class="muted tiny">有效期至 {{String(c.expiresAt).slice(0,10)}}</text></view><text class="tiny">{{c.usedOrderId?'已使用':new Date(c.expiresAt)<new Date()?'已过期':'待使用'}}</text></view></template><template v-else-if="type==='follows'"><view v-for="s in data" :key="s.id" class="card row" @click="go('shop/index',{id:s.id})"><GameArt avatar :type="s.avatar" :src="s.avatar?.startsWith('/')?s.avatar:''" /><view class="stack flex-1"><text class="bold">{{s.nickname}}</text><text class="muted tiny">{{s.shopIntro||'查看在售道具'}}</text></view><AppIcon class="app-icon" name="chevron" :size="17" /></view></template><template v-else-if="type==='security'"><view class="card"><view v-for="f in passwordFields" :key="f.key" class="section"><label class="field-label">{{f.label}}</label><input v-model="password[f.key]" :disabled="busy||loading||!ready" @blur="password[f.key]=$event.detail.value" class="text-input" :placeholder="f.hint" password maxlength="64" /></view></view><view class="notice section">修改密码后，需要重新登录，其他设备上的登录也会退出。</view><text v-if="error" class="field-error">{{error}}</text><button class="ui-button btn wide section" :disabled="busy||loading||!ready" @click="changePassword">{{busy?'正在修改…':'确认修改密码'}}</button></template><template v-else-if="type==='profile'"><view class="card"><view class="avatar-editor"><GameArt avatar :size="76" :type="form.avatar" :src="form.avatar?.startsWith('/')?form.avatar:''" /><button class="ui-button btn small outline" :disabled="avatarBusy||busy||loading||!ready" @click="chooseAvatar">{{avatarBusy?'上传中…':'上传头像'}}</button><text class="muted tiny">相册或拍照，上传后保存资料</text></view><text class="field-label">或选择默认头像</text><view class="avatar-options"><button class="ui-button" v-for="a in ['hero','soldier','anime','crown']" :key="a" :disabled="busy||avatarBusy||loading||!ready" :class="{chosen:form.avatar===a}" @click="form.avatar=a"><GameArt avatar :size="54" :type="a" /></button></view><view class="field section"><label class="field-label">昵称</label><input v-model="form.nickname" :disabled="busy||loading||!ready" @blur="form.nickname=$event.detail.value" class="text-input" placeholder="2–24 个字符" maxlength="24" /></view><view class="field section"><label class="field-label">个人简介</label><textarea v-model="form.bio" :disabled="busy||avatarBusy||loading||!ready" class="text-input bio-input" placeholder="介绍一下自己和喜欢的道具" maxlength="160" /><text class="muted tiny">{{form.bio.length}} / 160</text></view><text class="muted tiny">IP属地：{{session.user?.playerProfile?.ipProvince||'未知'}}（由网络位置判断）</text><text class="muted tiny" style="display:block;margin-top:8px">账号：{{session.user?.username}}</text></view><text v-if="error" class="field-error">{{error}}</text><button class="ui-button btn wide" :disabled="busy||avatarBusy||loading||!ready" @click="save">保存资料</button></template><template v-else-if="type==='settings'"><view class="card"><view class="list-row" @click="go('account/index',{type:'profile'})"><AppIcon class="app-icon" name="user" /><text>个人资料</text><AppIcon class="app-icon" name="chevron" :size="16" /></view><view class="list-row" @click="go('account/index',{type:'security'})"><AppIcon class="app-icon" name="shield" /><text>修改密码</text><AppIcon class="app-icon" name="chevron" :size="16" /></view><view class="list-row"><AppIcon class="app-icon" name="bell" /><text class="flex-1">应用内消息提醒</text><switch :disabled="busy||loading||!ready" :checked="form.notifyEnabled" color="#d8bc00" @change="form.notifyEnabled=$event.detail.value;save()" /></view><view class="list-row" @click="go('account/index',{type:'rules'})"><AppIcon class="app-icon" name="shield" /><text>用户协议与隐私说明</text><AppIcon class="app-icon" name="chevron" :size="16" /></view><view class="list-row" @click="clearDrafts"><AppIcon class="app-icon" name="clean" /><text>清理本机草稿</text><AppIcon class="app-icon" name="chevron" :size="16" /></view></view><text class="muted tiny" style="display:block;margin:15px 0">控制使用应用期间的新消息提示。关闭后消息仍保留在消息中心；不提供离线微信推送。</text><button class="ui-button btn outline wide" :disabled="loggingOut||loading" @click="logout">退出登录</button></template><template v-else-if="type==='help'"><view class="help-banner"><AppIcon class="app-icon" name="headset" :size="42" /><text class="title">有问题，一起解决</text><text class="muted">先看常见问题，订单争议可申请平台协助</text></view><view class="card"><view v-for="(faq,i) in faqs" :key="faq.q" class="faq"><view class="row between" @click="expanded=expanded===i?-1:i"><text class="bold">{{faq.q}}</text><AppIcon class="app-icon" :name="expanded===i?'back':'chevron'" :size="15" /></view><text v-if="expanded===i" class="faq-answer">{{faq.a}}</text></view></view><button class="ui-button btn wide" @click="openOrders">查看订单 / 申请售后</button></template><template v-else><StateView :loading="loading" :error="error" :count="policy?1:0" @retry="loadPolicy" /><view v-if="policy" class="card rules"><text class="title">用户协议与隐私说明</text><text class="muted tiny">版本 {{policy.version}} · {{policy.effectiveDate||"开发测试"}}</text><text v-if="!policy.ready" class="notice">当前为测试环境，正式运营资料尚未配置。</text><view v-for="s in policy.sections" :key="s.title"><text class="bold">{{s.title}}</text><text style="display:block">{{s.text}}</text></view></view></template><button v-if="needsData&&hasMore" class="ui-button btn outline wide" :disabled="loadingMore" @click="more">{{loadingMore?"加载中…":"加载更多"}}</button></view></AppShell></template>
<script setup>
import {ref,reactive,computed,watch} from 'vue';import {onLoad,onShow,onUnload} from '@dcloudio/uni-app';import AppShell from '../../components/AppShell.vue';import AppIcon from '../../components/AppIcon.vue';import GameArt from '../../components/GameArt.vue';import ServiceCard from '../../components/ServiceCard.vue';import StateView from '../../components/StateView.vue';import {session,request,loadMe,requireLogin,clearSession,go,money,labels,confirm,toast,upload} from '../../lib/api'
import {prepareMedia} from '../../lib/media'
const avatarBusy=ref(false)
const policy=ref(null),page=ref(1),hasMore=ref(false),loadingMore=ref(false);const type=ref('settings'),data=ref([]),loading=ref(false),error=ref(''),busy=ref(false),expanded=ref(0),form=reactive({nickname:'',avatar:'hero',bio:'',notifyEnabled:true});const title=computed(()=>({favorites:'我的收藏',history:'浏览记录',follows:'我的关注',coupons:'我的优惠券',profile:'个人资料',security:'修改密码',settings:'设置',help:'帮助与客服',rules:'用户协议与隐私说明'}[type.value]||'设置')),needsData=computed(()=>['favorites','history','follows','coupons'].includes(type.value)),emptyTitle=computed(()=>({favorites:'还没有收藏的道具',history:'还没有浏览记录',follows:'还没有关注店铺',coupons:'暂时没有优惠券'}[type.value]));const faqs=[{q:'如何出售或发布求购？',a:'求购只需真实实名认证；出售还需通过店铺认证。填写道具分类、介绍、单价、数量和详情图片，提交平台审核。店铺手机号需短信验证，店铺材料只可首次提交，后续由后台更正。'},{q:'可以买卖游戏账号吗？',a:'只交易游戏道具，包括密钥、传世武器、头盔、护甲、背包、枪械、活动道具和日常道具，禁止游戏账号交易。'},{q:'求购如何成交？',a:'求购用于联系买家协商，不会自动接单。双方约定后，由卖家发布对应道具，买家从商品下单。'},{q:'如何确认收货？',a:'卖家提交游戏内交付凭证后，买家核对实际收到的道具再确认收货。支付尚未开放时，付款与交付操作不可用。'},{q:'会员和成长等级如何开通？',a:'点击我的页面成长卡片，可查看等级门槛及成长记录。会员由后台授予，成长由后台按原因调整；暂不开放购买，浏览与下单不自动增加成长值。'}]
const password=reactive({oldPassword:'',newPassword:'',confirmation:''}),passwordFields=[{key:'oldPassword',label:'当前密码',hint:'请输入当前密码'},{key:'newPassword',label:'新密码',hint:'8–64 个字符'},{key:'confirmation',label:'确认新密码',hint:'请再输入一次新密码'}];
const ready=ref(false),loadError=ref('')
let loadVersion=0
const loggingOut=ref(false)
watch(()=>session.token,()=>{
 loadVersion++;avatarBusy.value=false;ready.value=false;loadError.value='';loading.value=false;loadingMore.value=false;busy.value=false;loggingOut.value=false
 data.value=[];hasMore.value=false;error.value=''
 Object.assign(form,{nickname:'',avatar:'hero',bio:'',notifyEnabled:false})
 Object.assign(password,{oldPassword:'',newPassword:'',confirmation:''})
},{flush:'sync'})
const current=(version,token)=>version===loadVersion&&token===session.token
async function changePassword(){
 if(busy.value||loading.value||!ready.value)return
 error.value=''
 if(!password.oldPassword||password.newPassword.length<8||password.newPassword.length>64){error.value='请填写当前密码和 8–64 位新密码';return}
 if(password.newPassword!==password.confirmation){error.value='两次输入的新密码不一致';return}
 const token=session.token;busy.value=true
 try{await request('/boost/me/password','POST',{oldPassword:password.oldPassword,newPassword:password.newPassword});if(token!==session.token)return;clearSession();Object.assign(password,{oldPassword:'',newPassword:'',confirmation:''});toast('密码已修改，请重新登录');uni.reLaunch({url:'/pages/auth/index'})}
 catch(e){if(token===session.token)error.value=e.message}
 finally{if(token===session.token)busy.value=false}
}
onLoad(q=>type.value=q.type||'settings')
onUnload(()=>{loadVersion++;avatarBusy.value=false})
onShow(()=>{if(type.value==='rules'){loadPolicy();return}if(type.value==='help')return;if(type.value==='profile'&&(avatarBusy.value||busy.value))return;if(requireLogin())load()})
async function load(){
 const version=++loadVersion,token=session.token
 ready.value=false;loading.value=true;page.value=1;hasMore.value=false;error.value='';loadError.value='';data.value=[]
 try{const user=await loadMe();if(!current(version,token)||!user)return
  Object.assign(form,{nickname:user.nickname,avatar:user.avatar,bio:user.playerProfile?.bio||'',notifyEnabled:!!user.notifyEnabled})
  ready.value=true
  if(needsData.value){const d=await request(['favorites','history'].includes(type.value)?'/boost/saved/'+type.value:'/boost/'+type.value);if(!current(version,token))return;data.value=d.items;hasMore.value=d.hasMore}
 }catch(e){if(current(version,token)){loadError.value=e.message;if(!['profile','settings','security'].includes(type.value))error.value=e.message}}
 finally{if(current(version,token))loading.value=false}
}
async function loadPolicy(){const version=++loadVersion;loading.value=true;error.value='';try{const result=await request('/boost/policy');if(version===loadVersion)policy.value=result}catch(e){if(version===loadVersion)error.value=e.message}finally{if(version===loadVersion)loading.value=false}}
async function more(){
 if(loadingMore.value||loading.value)return
 const version=loadVersion,token=session.token,nextPage=page.value+1;loadingMore.value=true
 try{const d=await request(['favorites','history'].includes(type.value)?'/boost/saved/'+type.value:'/boost/'+type.value,'GET',{page:nextPage});if(!current(version,token))return;data.value=[...new Map([...data.value,...d.items].map(x=>[x.id,x])).values()];page.value=nextPage;hasMore.value=d.hasMore}
 catch(e){if(current(version,token))toast(e.message)}finally{if(current(version,token))loadingMore.value=false}
}
function chooseAvatar(){
 if(avatarBusy.value||busy.value||loading.value||!ready.value)return
 const token=session.token,version=loadVersion;avatarBusy.value=true;error.value=''
 const active=()=>current(version,token)
 uni.chooseImage({count:1,sizeType:['compressed'],sourceType:['album','camera'],success:async r=>{
  try{if(!active()||!r.tempFilePaths?.[0])return;const url=await upload(r.tempFilePaths[0],'AVATAR');if(!active())return;await prepareMedia([url]);if(active())form.avatar=url}
  catch(e){if(active())error.value=e.message}finally{if(active())avatarBusy.value=false}
 },fail:()=>{if(active())avatarBusy.value=false}})
}
async function save(){
 if(busy.value||avatarBusy.value||loading.value||!ready.value)return
 const token=session.token;error.value='';busy.value=true
 try{await request('/boost/me','PUT',{...form});await loadMe();if(token===session.token)toast('已保存')}
 catch(e){if(token===session.token){error.value=e.message;if(type.value==='settings')form.notifyEnabled=!!session.user?.notifyEnabled;toast(e.message)}}
 finally{if(token===session.token)busy.value=false}
}
async function logout(){
 if(loggingOut.value)return
 const token=session.token;if(!token)return;loggingOut.value=true;let confirmed=false
 try{confirmed=await confirm('确定退出当前账号？');if(!confirmed||token!==session.token)return;await request('/boost/auth/logout','POST')}
 catch{if(token===session.token)toast('本机已退出；网络恢复后可重新登录')}
 finally{if(token===session.token){loggingOut.value=false;if(confirmed){clearSession();uni.reLaunch({url:'/pages/index/index'})}}}
}
async function clearDrafts(){
 const token=session.token,id=session.user?.id;if(!token||!id)return
 if(await confirm('清理当前账号保存在本机的道具与求购草稿？')&&token===session.token&&id===session.user?.id){uni.getStorageInfoSync().keys.filter(k=>(k.startsWith(`boost_draft_${id}_`)||k.startsWith(`player_item_v1_draft_${id}_`))).forEach(k=>uni.removeStorageSync(k));toast('草稿已清理')}
}
function openOrders(){if(requireLogin())go('orders/index')}
</script>
<style scoped>.coupon{display:flex;align-items:center;gap:15px;padding:22px 15px;background:#fff5bc;border-radius:14px;margin-bottom:12px}.coupon-value{font-size:30px;font-weight:750;color:#dc593c}.coupon.expired{background:#ececef;color:#9698a1}.coupon.expired .coupon-value{color:#9698a1}.avatar-options{display:flex;gap:20px}.avatar-options .game-art{width:54px;height:54px}.avatar-options .chosen{outline:3px solid var(--yellow);border-radius:50%}.help-banner{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;background:#fff2a5;padding:25px 15px;border-radius:16px;margin-bottom:16px}.faq{padding:16px 0;border-bottom:1px solid #eee;font-size:14px}.faq:last-child{border:0}.faq-answer{display:block;line-height:1.9;color:#7b7e87;margin-top:12px;font-size:13px}.rules{display:flex;flex-direction:column;gap:16px;font-size:13px;line-height:1.9}.rules .bold{margin-top:8px}.avatar-editor{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px}.avatar-editor .tiny{flex-basis:100%}.bio-input{height:95px;width:100%;box-sizing:border-box}.avatar-options{gap:14px;margin-top:10px}</style>
