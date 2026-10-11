<template>
 <AppShell :title="editing?'编辑发布':service?'出售道具':'发布求购'" back :tab="service||editing?'':'publish'">
  <template #actions><button class="ui-button text-button" :disabled="!ready||uploading||detailUploading" @click="saveDraft">草稿</button></template>
  <StateView v-if="!ready" :loading="initializing" :error="loadError" :count="0" title="请先登录" @retry="initialize" />
  <view v-if="ready" class="pad publish-page" :class="{service}">
   <view v-if="!service" class="notice"><AppIcon class="app-icon" name="info" :size="18" /><text>和平精英 · 地铁逃生，仅限游戏道具</text></view>
   <view v-if="!canPublish(session.user,form.kind)" class="notice certification-notice"><AppIcon class="app-icon" name="shield" :size="20" /><view class="flex-1"><text class="bold">{{service?'出售需实名和店铺认证':'求购只需实名认证'}}</text><text class="muted tiny" style="display:block">{{service?'先实名认证，再提交店铺资料及验证手机号':'完成真实实名核验后即可发布求购'}}</text></view><button class="ui-button btn small" @click="go(session.user?.playerProfile?.realnameStatus==='VERIFIED'?'certification/index':'identity/index')">去认证</button></view>
   <view class="card publish-fields">
    <view v-if="service" class="publish-block"><view class="row between"><text class="field-label">道具图片</text><text class="muted tiny">最多 9 张</text></view><UploadImages v-model="form.images" @busy="uploading=$event" /></view>
    <view class="publish-block"><label class="field-label">{{service?'道具标题':'求购标题'}}</label><view class="title-input"><input v-model="form.title" @blur="form.title=$event.detail.value" class="text-input" placeholder="例如：地铁逃生六级护甲一件" maxlength="60" /><text class="counter">{{form.title.length}}/60</text></view></view>
    <view v-if="!service" class="publish-block"><text class="field-label">添加截图（选填）</text><UploadImages v-model="form.images" @busy="uploading=$event" /></view>
    <view class="publish-specs"><view v-for="f in choices" :key="f.key" class="field-row"><text>{{f.label}}</text><picker :range="f.values" @change="form[f.key]=f.values[$event.detail.value]"><view class="picker-value">{{form[f.key]}}<AppIcon name="chevron" :size="15" /></view></picker></view>
     <view class="field-row"><text>游戏区服</text><picker :range="GAME_SERVERS" range-key="label" @change="selectServer"><view class="picker-value">{{gameServerLabel(form)}}<AppIcon name="chevron" :size="15" /></view></picker></view>
     <view class="field-row"><text>游戏模式</text><text>地铁逃生</text></view>
     <view class="publish-block"><label class="field-label">道具介绍</label><textarea v-model="form.itemDetails" @blur="form.itemDetails=$event.detail.value" class="textarea" maxlength="500" placeholder="介绍道具名称、品质、等级、配件等" /></view>
    </view>
    <view class="publish-block detail-image-upload"><text class="field-label">上传详情页（选填）</text><text class="muted tiny">最多 9 张，按上传顺序展示，可包含道具介绍和交易说明</text><UploadImages v-model="form.detailImages" @busy="detailUploading=$event" /></view>
    <view class="field-row publish-price"><text>{{service?'单价（元 / 件）':'求购单价（元 / 件）'}}</text><input v-model="price" @blur="price=$event.detail.value" class="amount-input" type="digit" placeholder="¥ 0.00" /></view>
    <view class="field-row publish-quantity"><text>{{service?'总数量（件）':'求购数量（件）'}}</text><input v-model="form.quantity" @blur="form.quantity=$event.detail.value" type="number" placeholder="1–9999" /></view>
    <text v-if="conversionNotice" class="field-error">原发布按整批计价，请重新确认每件单价；保存后重新审核。</text>
    <text class="muted tiny publish-price-note">{{service?'买家可以选择购买件数，订单总价按单价 × 件数计算。':'填写每件预算和需要的数量；先沟通，再从卖家商品下单。'}}</text>
   </view>
   <view class="check-row" @click="agreed=!agreed"><text :class="['check-box',{checked:agreed}]">{{agreed?'✓':''}}</text><text>我已阅读并同意</text><text class="link" @click.stop="go('account/index',{type:'rules'})">发布与交易规则</text></view>
   <text v-if="error" class="field-error">{{error}}</text><button class="ui-button btn wide" :disabled="busy||uploading||detailUploading||initializing||verifiedFor!==session.token||!canPublish(session.user,form.kind)" @click="submit">{{busy?'正在提交…':editing?'保存并重新审核':service?'出售道具':'确认发布'}}</button>
   <text class="muted tiny approval-note">发布后由平台审核，通过后展示在市场</text><button v-if="!service&&!editing" class="ui-button text-button service-entry" @click="go('publish/service')">我有道具要出售 ›</button>
  </view>
 </AppShell>
</template>

<script setup>
import {ref,reactive,onMounted,watch} from 'vue';import {onShow} from '@dcloudio/uni-app';import AppShell from './AppShell.vue';import AppIcon from './AppIcon.vue';import UploadImages from './UploadImages.vue';import StateView from './StateView.vue';import {session,loadMe,requireLogin,go,request,images,toast} from '../lib/api';import {ITEM_CATEGORIES,canPublish,GAME_SERVERS,gameServerLabel} from '../lib/playerTrade';import {retryIntent,completeIntent} from '../lib/retryIntent'
const detailUploading=ref(false),conversionNotice=ref(false);function selectServer(e){const s=GAME_SERVERS[Number(e.detail.value)];if(s){form.zone=s.zone;form.platform=s.platform}}
const props=defineProps({service:Boolean,editing:[String,Number]});const price=ref(''),agreed=ref(false),busy=ref(false),uploading=ref(false),error=ref(''),ready=ref(false),initializing=ref(false),loadError=ref(''),verifiedFor=ref('')
const defaults=()=>({kind:props.service?'SERVICE':'REQUEST',businessType:'PLAYER_ITEM',title:'',game:'和平精英',zone:'微信区',platform:'安卓',itemCategory:'密钥',quantity:1,itemDetails:'',deliveryTerms:'',description:'',images:[],detailImages:[],pricingMode:'UNIT'})
const form=reactive(defaults())
const choices=[{key:'itemCategory',label:'道具分类',values:ITEM_CATEGORIES}]
let initializedFor='',pendingFor='',readyDraftKey='',version=0
const draftKey=()=>`player_item_v2_draft_${session.user.id}_${props.service?'SERVICE':'REQUEST'}${props.editing?'_edit_'+props.editing:''}`
function persistDraft(){if(readyDraftKey)uni.setStorageSync(readyDraftKey,{form:{...form,images:[...form.images],detailImages:[...form.detailImages]},price:price.value})}
watch(()=>session.token,(token,old)=>{if(ready.value&&old&&token!==old)persistDraft();initialize()})
watch(()=>props.editing,initialize);onMounted(initialize)
onShow(()=>initialize(true))
async function initialize(force=false){
 if(!session.token){version++;ready.value=false;initializing.value=false;initializedFor='';pendingFor='';requireLogin();return}
 const context=`${session.token}:${props.service}:${props.editing||'new'}`
 if(force&&ready.value&&initializedFor===context)persistDraft()
 if((!force&&ready.value&&initializedFor===context)||pendingFor===context)return
 const background=force&&ready.value&&initializedFor===context
 const ticket=++version;pendingFor=context;if(!background)ready.value=false;verifiedFor.value='';initializing.value=true;loadError.value=''
 try{
  await loadMe();if(ticket!==version)return
  verifiedFor.value=session.token
  if(background)return
  let saved=defaults(),savedPrice='';conversionNotice.value=false
  if(props.editing){const d=await request('/boost/listings/'+props.editing);if(ticket!==version)return;if(d.ownerId!==session.user.id||d.kind!==saved.kind||d.businessType!=='PLAYER_ITEM')throw new Error('只能编辑自己的对应类型发布');for(const k of Object.keys(saved))if(d[k]!==undefined)saved[k]=d[k];saved.images=images(d.images);saved.detailImages=images(d.detailImages);conversionNotice.value=d.pricingMode!=='UNIT';savedPrice=conversionNotice.value?'':String(d.priceCents/100);saved.pricingMode='UNIT'}
  const key=draftKey(),draft=uni.getStorageSync(key)
  if(draft?.form&&typeof draft.price==='string'){for(const k of Object.keys(saved))if(draft.form[k]!==undefined)saved[k]=draft.form[k];saved.images=images(saved.images);saved.detailImages=images(saved.detailImages);savedPrice=draft.price}
  if(ticket!==version)return
  Object.assign(form,saved);price.value=savedPrice;agreed.value=false;error.value='';readyDraftKey=key;initializedFor=context;ready.value=true
 }catch(e){if(ticket===version){verifiedFor.value='';loadError.value=e.message;if(background)error.value=e.message}}finally{if(ticket===version){initializing.value=false;pendingFor=''}}
}
function saveDraft(){if(!ready.value||uploading.value||detailUploading.value||!requireLogin())return;persistDraft();toast('草稿已保存到当前设备')}
async function submit(){if(busy.value||uploading.value||detailUploading.value||initializing.value||verifiedFor.value!==session.token||!ready.value||!requireLogin())return;error.value='';if(!agreed.value){error.value='请先同意发布规则';return}if(!canPublish(session.user,form.kind)){error.value=props.service?'出售需要实名、店铺认证及已验证手机号':'求购需要实名认证';return}if(form.title.trim().length<5||form.itemDetails.trim().length<2){error.value='请完善标题和道具介绍';return}if(props.service&&!form.images.length){error.value='出售道具请上传游戏内实物截图';return}if(!/^\d+(\.\d{1,2})?$/.test(price.value)||Number(price.value)<1||Number(price.value)>100000){error.value='请填写 1–100000 元的金额，最多两位小数';return}if(!Number.isInteger(Number(form.quantity))||Number(form.quantity)<1||Number(form.quantity)>9999){error.value='数量须为 1–9999 的整数';return}persistDraft();busy.value=true;try{const payload={...form,pricingMode:'UNIT',description:'',deliveryTerms:'',priceCents:Math.round(Number(price.value)*100),quantity:Number(form.quantity)};const intent=props.editing?null:retryIntent('publish_'+form.kind,payload);await request('/boost/listings'+(props.editing?'/'+props.editing:''),props.editing?'PUT':'POST',{...payload,...(intent?{requestKey:intent.requestKey}:{})});if(intent)completeIntent(intent);uni.removeStorageSync(readyDraftKey);toast('提交成功，等待审核');uni.redirectTo({url:'/pages/manage/index?kind='+form.kind})}catch(e){error.value=e.message}finally{busy.value=false}}
</script>

<style scoped>.publish-page{background:#fff;padding-top:8px}.publish-fields{padding:0;margin:14px 0 0;border-radius:0}.publish-block{margin-bottom:14px}.publish-block .field-label{font-weight:500;font-size:13px;margin-bottom:6px}.title-input{display:flex;align-items:center;background:#f6f6f8;border-radius:7px;padding-right:10px;gap:6px}.title-input input{flex:1;width:0;margin:0;height:38px;background:transparent}.title-input .counter{flex-shrink:0}.publish-specs{margin:4px 0 12px}.publish-specs .field-row{min-height:42px}.publish-specs input{font-size:13px;max-width:55%;height:40px}.publish-price{margin:0 0 14px;border-bottom:0}.publish-price input{max-width:60%;font-size:26px;height:40px}.publish-price-note{display:block;margin-bottom:4px}.publish-block .textarea{min-height:98px;font-size:13px}.publish-page.service .textarea{min-height:112px;background:#fff;padding:0}.approval-note{display:block;text-align:center;margin-top:8px;font-size:10px}.service-entry{margin:5px auto}.certification-notice{margin-bottom:12px}.publish-block>.row .field-label{margin:0 0 8px}.publish-page .notice{min-height:36px}</style>
