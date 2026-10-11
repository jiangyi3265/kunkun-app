<template>
  <!-- #ifdef MP-WEIXIN -->
  <button class="ui-button btn wide outline section" :disabled="busy" @click="login">{{busy?'正在授权…':'微信快捷登录'}}</button>
  <!-- #endif -->
</template>
<script setup>
import {ref} from 'vue';import {request,setSession,toast,loadConfig} from '../lib/api'
const props=defineProps({agreed:Boolean});const busy=ref(false)
async function login(){if(!props.agreed){toast('请先阅读并同意用户协议');return}if(busy.value)return;busy.value=true;try{const policy=await loadConfig();const r=await new Promise((resolve,reject)=>uni.login({provider:'weixin',success:resolve,fail:reject}));setSession(await request('/boost/auth/wechat','POST',{code:r.code,acceptedPolicy:policy.policyVersion}));if(getCurrentPages().length>1)uni.navigateBack();else uni.reLaunch({url:'/pages/index/index'})}catch(e){toast(e.message||'微信授权未完成')}finally{busy.value=false}}
</script>
