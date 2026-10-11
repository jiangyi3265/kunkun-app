<template><AppShell title="我的钱包" back footer><template #actions><button class="ui-button text-button" @click="showWithdrawals=!showWithdrawals">提现记录</button></template><StateView :loading="loading" :error="error" :count="wallet?1:0" @retry="load" /><view v-if="wallet&&!error&&!loading" class="pad"><view class="balance-card"><text class="tiny">可提现余额（元）</text><view class="row between"><text class="balance-number">{{money(wallet.balanceCents)}}</text><button class="ui-button btn dark small" :disabled="session.config?.paymentsEnabled===false" @click="showForm=!showForm">提现</button></view><view class="balance-stats"><view><text>待结算</text><text>{{money(wallet.pendingCents)}}</text></view><view><text>累计收入</text><text>{{money(wallet.totalCents)}}</text></view></view></view><view class="deposit-card section">
<view class="row between"><view class="row deposit-heading"><AppIcon name="shield" :size="20" /><text class="field-label">保证金（元）</text></view><text class="tag gray">缴退暂未开放</text></view>
<text v-if="depositAvailable" class="deposit-amount">¥ {{money(wallet.depositCents)}}</text><text v-else class="deposit-unavailable">暂未获取</text>
<text class="deposit-description">{{depositAvailable?'与可提现余额分开记录，当前仅展示金额。':'保证金数据暂未获取，请稍后重新进入钱包查看。'}}</text>
</view><view v-if="session.config?.simulatedPayment" class="notice section"><AppIcon class="app-icon" name="info" :size="17" /><text>测试钱包，余额与提现均不代表真实资金。</text></view><view v-if="session.config?.paymentsEnabled===false" class="notice section"><AppIcon class="app-icon" name="info" :size="17" /><text>支付及资金操作暂未开放，当前仅可查看钱包与历史记录。</text></view><view v-if="showForm&&session.config?.paymentsEnabled!==false" class="card section"><text class="field-label">申请提现</text><view class="field-row"><text>提现金额（元）</text><input v-model="amount" @blur="amount=$event.detail.value" type="digit" placeholder="至少 1 元" /></view><view class="field-row"><text>收款人</text><input v-model="accountName" @blur="accountName=$event.detail.value" placeholder="填写收款人姓名" maxlength="100" /></view><view v-if="session.config?.simulatedPayment" class="field-row"><text>测试收款账号</text><input v-model="accountNumber" @blur="accountNumber=$event.detail.value" placeholder="填写收款账号" maxlength="100" /></view><text v-if="!session.config?.simulatedPayment" class="muted tiny" style="display:block;margin:10px 0">款项转入当前绑定的微信余额。姓名须与微信实名一致。</text><text class="muted tiny">提交后冻结该笔余额，审核未通过时自动退回。</text><text v-if="formError" class="field-error">{{formError}}</text><button class="ui-button btn wide section" :disabled="busy" @click="withdraw">{{busy?'提交中…':'提交提现申请'}}</button></view><view v-if="showWithdrawals" class="card section"><text class="field-label">提现记录</text><view v-for="w in wallet.withdrawals" :key="w.id" class="list-row"><view class="stack flex-1"><text>提现 ¥{{money(w.amountCents)}}</text><text class="muted tiny">{{date(w.createdAt)}} · {{w.note||'等待平台审核'}}</text></view><button v-if="session.config?.paymentsEnabled!==false&&w.status==='WAIT_USER_CONFIRM'" class="ui-button btn small" @click="safely(()=>confirmTransfer(w.id))">确认收款</button><text v-else class="tag">{{labels[w.status]}}</text></view><button v-if="withdrawMore" class="ui-button load-more" :disabled="moreBusy" @click="moreWithdrawals">更多提现记录</button><StateView :count="wallet.withdrawals.length" title="还没有提现记录" description="服务验收结算后，即可申请提现" /></view><view class="section-heading section"><text class="section-title">收支明细</text><text class="muted tiny">全部历史可分页查看</text></view><view class="tabs" style="background:transparent;padding:0"><button class="ui-button" v-for="f in filters" :key="f" :class="{selected:filter===f}" @click="changeFilter(f)">{{f}}</button></view><view class="ledger-list"><view v-for="l in ledger" :key="l.id" class="list-row"><view class="ledger-icon" :class="{expense:l.amountCents<0}"><AppIcon class="app-icon" :name="l.amountCents<0?'wallet':'bag'" :size="20" /></view><view class="stack flex-1"><text class="bold">{{l.title}}</text><text class="muted tiny">{{date(l.createdAt)}}</text></view><text class="ledger-amount" :class="{success:l.amountCents>0}">{{l.amountCents>0?'+':''}}{{money(l.amountCents)}}</text></view><button v-if="ledgerMore" class="ui-button load-more" :disabled="moreBusy" @click="moreLedger">更多收支明细</button><StateView :count="ledger.length" title="还没有相关明细" description="每笔结算与提现都会记录在这里" /></view><view class="notice section"><AppIcon class="app-icon" name="info" :size="16" /><text>订单验收完成后，收入计入可提现余额。</text></view></view><template #footer><button class="ui-button btn outline wide" @click="showWithdrawals=!showWithdrawals">{{showWithdrawals?'收起提现记录':'查看提现记录'}}</button></template></AppShell></template>
<script setup>
import {ref,computed} from 'vue'
import {onShow,onHide,onUnload} from '@dcloudio/uni-app'
import AppShell from '../../components/AppShell.vue'
import AppIcon from '../../components/AppIcon.vue'
import StateView from '../../components/StateView.vue'
import {request,requireLogin,money,date,labels,session,loadConfig,key,confirm,toast,linkWechat,confirmTransfer,safely} from '../../lib/api'
const wallet=ref(null),loading=ref(false),error=ref(''),showForm=ref(false),showWithdrawals=ref(false),busy=ref(false),amount=ref(''),accountName=ref(''),accountNumber=ref(''),formError=ref(''),filter=ref('全部'),filters=['全部','收入','支出']
const ledgerPage=ref(1),withdrawPage=ref(1),ledgerMore=ref(false),withdrawMore=ref(false),moreBusy=ref(false)
let viewVersion=0,ledgerVersion=0,withdrawVersion=0,owner='',requestKey=key()
const ledger=computed(()=>(wallet.value?.ledger||[]).filter(l=>filter.value==='全部'||(filter.value==='收入'?l.amountCents>0:l.amountCents<0)))
const depositAvailable=computed(()=>Number.isSafeInteger(wallet.value?.depositCents)&&wallet.value.depositCents>=0)
const kindOf=f=>f==='收入'?'income':f==='支出'?'expense':''
function invalidate(){viewVersion++;ledgerVersion++;withdrawVersion++;moreBusy.value=false}
onShow(()=>{if(requireLogin())load()})
onHide(invalidate)
onUnload(invalidate)
async function load(){
  invalidate()
  const version=viewVersion,token=session.token,current=()=>version===viewVersion&&token===session.token
  if(owner!==token){owner=token;amount.value=accountName.value=accountNumber.value=formError.value='';showForm.value=showWithdrawals.value=false;filter.value='全部';requestKey=key()}
  loading.value=true;error.value='';wallet.value=null
  try{
    await loadConfig();if(!current())return
    const [w,l,t]=await Promise.all([request('/boost/wallet'),request('/boost/wallet/ledger','GET',{kind:kindOf(filter.value)}),request('/boost/wallet/withdrawals')])
    if(!current())return
    wallet.value={...w,ledger:l.items,withdrawals:t.items};ledgerPage.value=withdrawPage.value=1;ledgerMore.value=l.hasMore;withdrawMore.value=t.hasMore
  }catch(e){if(current()){wallet.value=null;error.value=e.message}}finally{if(current())loading.value=false}
}
async function changeFilter(f){
  if(filter.value===f||!wallet.value)return
  filter.value=f;ledgerVersion++;withdrawVersion++;moreBusy.value=false;ledgerPage.value=0;ledgerMore.value=true;wallet.value.ledger=[];await moreLedger()
}
async function moreLedger(){
  if(moreBusy.value||!wallet.value||!ledgerMore.value)return
  const token=session.token,view=viewVersion,version=++ledgerVersion,current=()=>view===viewVersion&&version===ledgerVersion&&token===session.token
  moreBusy.value=true
  try{
    const d=await request('/boost/wallet/ledger','GET',{page:ledgerPage.value+1,kind:kindOf(filter.value)})
    if(!current())return
    wallet.value.ledger=[...new Map([...wallet.value.ledger,...d.items].map(x=>[x.id,x])).values()];ledgerPage.value++;ledgerMore.value=d.hasMore
  }catch(e){if(current())toast(e.message)}finally{if(current())moreBusy.value=false}
}
async function moreWithdrawals(){
  if(moreBusy.value||!wallet.value||!withdrawMore.value)return
  const token=session.token,view=viewVersion,version=++withdrawVersion,current=()=>view===viewVersion&&version===withdrawVersion&&token===session.token
  moreBusy.value=true
  try{
    const d=await request('/boost/wallet/withdrawals','GET',{page:withdrawPage.value+1})
    if(!current())return
    wallet.value.withdrawals=[...new Map([...wallet.value.withdrawals,...d.items].map(x=>[x.id,x])).values()];withdrawPage.value++;withdrawMore.value=d.hasMore
  }catch(e){if(current())toast(e.message)}finally{if(current())moreBusy.value=false}
}
async function withdraw(){
  if(busy.value)return
  formError.value=''
  if(session.config?.paymentsEnabled===false){formError.value='支付及资金操作暂未开放';return}
  if(!/^\d+(\.\d{1,2})?$/.test(amount.value)){formError.value='请输入有效金额，最多两位小数';return}
  const token=session.token,view=viewVersion,current=()=>view===viewVersion&&token===session.token
  busy.value=true
  try{
    if(!await confirm('提交提现申请后，该笔余额将冻结等待处理。')||!current())return
    if(!session.config?.simulatedPayment)await linkWechat()
    if(!current())return
    await request('/boost/wallet/withdraw','POST',{amountCents:Math.round(Number(amount.value)*100),accountName:accountName.value,accountNumber:accountNumber.value,requestKey})
    if(!current())return
    requestKey=key();showForm.value=false;showWithdrawals.value=true;toast('申请已提交');await load()
  }catch(e){if(current())formError.value=e.message}finally{busy.value=false}
}
</script>
<style scoped>.balance-card{padding:22px;background:#ffe433;border-radius:18px}.balance-number{font-size:45px;font-weight:800;letter-spacing:-2px}.balance-stats{display:flex;margin-top:16px}.balance-stats>view{width:50%;display:flex;flex-direction:column;gap:4px;font-size:12px;color:#776528}.balance-stats>view+view{border-left:1px solid #d9be35;padding-left:24px}.balance-stats>view>text:last-child{font-size:18px;font-weight:700;color:#191919}.ledger-list{background:#fff;border-radius:14px;padding:0 14px}.ledger-list .list-row{min-height:82px;font-size:13px}.ledger-icon{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff5a8}.ledger-icon.expense{background:#ebecef}.ledger-amount{font-weight:750;font-size:16px}.balance-card{padding:18px;border-radius:12px}.balance-number{font-size:43px;letter-spacing:-1px}.balance-stats{margin-top:14px}.ledger-list .list-row{min-height:74px}.ledger-icon{width:40px;height:40px}.ledger-list{padding:0 12px}.ledger-list .bold{font-weight:600}.tabs{justify-content:space-around}.balance-card .btn{min-width:88px;min-height:36px}.deposit-card{padding:16px;border:1px solid var(--line);border-radius:12px;background:#fff}.deposit-heading{gap:8px;min-width:0}.deposit-heading .field-label{margin:0;font-size:14px}.deposit-card .row.between{gap:8px}.deposit-amount{display:block;margin:8px 0 4px;font-size:28px;font-weight:750;line-height:1.3;overflow-wrap:anywhere}.deposit-description{display:block;font-size:12px;line-height:1.6;color:#777a84}.deposit-unavailable{display:block;margin:12px 0 6px;color:#777a84;font-size:16px}</style>
