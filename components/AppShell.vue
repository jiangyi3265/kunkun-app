<template><view class="app-shell" :style="nativeHeaderStyle" :class="{'with-tabs':!!tab,'has-title':!!title,'with-footer':footer,'home-shell':tab==='home'}"><view v-if="title" class="topbar"><button v-if="back" class="ui-button icon-button" aria-label="返回" @click="returnBack"><AppIcon class="app-icon" name="back" /></button><view :class="back?'page-title':'root-title'"><slot name="title">{{title}}</slot></view><view class="topbar-actions"><slot name="actions" /></view></view><view class="page-body"><slot /></view><view v-if="footer" class="fixed-footer"><slot name="footer" /></view><view v-if="tab" class="tabbar"><button class="ui-button" v-for="item in tabs" :key="item.key" :class="['tab-item',{active:tab===item.key,publish:item.key==='publish'}]" :aria-label="item.label" @click="switchTab(item)"><view class="tab-icon"><AppIcon class="app-icon" :name="item.icon" :size="item.key==='publish'?26:23" /><text v-if="item.key==='messages'&&session.user?.unread" class="dot" /></view><text>{{item.label}}</text></button></view></view></template>
<script setup>
import {ref,onMounted,onUnmounted} from 'vue';import AppIcon from './AppIcon.vue';import {session,requireLogin} from '../lib/api'
const props=defineProps({title:String,back:Boolean,tab:String,footer:Boolean})
const nativeHeaderStyle=ref({})
// #ifdef MP-WEIXIN
function updateNativeHeader(){
 let status=0,space=64
 try{const info=uni.getWindowInfo?uni.getWindowInfo():uni.getSystemInfoSync();status=Math.max(0,Number(info.statusBarHeight)||0)}catch{/* Keep a visible fallback if an older client cannot provide geometry. */}
 try{const menu=uni.getMenuButtonBoundingClientRect();if(Number.isFinite(menu.bottom)&&menu.bottom>status)space=Math.max(44,menu.bottom-status+8)}catch{/* Use the reserved fallback menu row. */}
 nativeHeaderStyle.value={'--native-status-height':status+'px','--native-menu-space':space+'px'}
}
updateNativeHeader()
onMounted(()=>uni.onWindowResize?.(updateNativeHeader))
onUnmounted(()=>uni.offWindowResize?.(updateNativeHeader))
// #endif
const tabs=[{key:'home',label:'首页',icon:'home',path:'index/index'},{key:'market',label:'市场',icon:'bag',path:'market/index'},{key:'publish',label:'发布',icon:'plus',path:'publish/index'},{key:'messages',label:'消息',icon:'chat',path:'messages/index'},{key:'mine',label:'我的',icon:'user',path:'mine/index'}]
function switchTab(item){if(props.tab===item.key)return;if(['publish','messages'].includes(item.key)&&!requireLogin())return;uni.reLaunch({url:'/pages/'+item.path})}
function returnBack(){if(getCurrentPages().length>1)uni.navigateBack();else uni.reLaunch({url:'/pages/index/index'})}
</script>
