<template><view v-if="state.open" class="confirmation-mask" @touchmove.stop.prevent @click.stop><view class="confirmation-panel" role="dialog" aria-modal="true" :aria-label="state.title"><text class="confirmation-title">{{state.title}}</text><text class="confirmation-content">{{state.content}}</text><view class="confirmation-actions"><button class="ui-button btn outline confirmation-cancel" @click="answer(false)">取消</button><button class="ui-button btn confirmation-accept" @click="answer(true)">确认</button></view></view></view></template>
<script setup>
const props=defineProps({state:{type:Object,required:true}})
const emit=defineEmits(['answer'])
const requestId=props.state.id
function answer(accepted){emit('answer',{id:requestId,accepted})}
</script>
<style scoped>.confirmation-mask{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2000;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}.confirmation-panel{width:100%;max-width:340px;box-sizing:border-box;background:#fff;border-radius:18px;padding:24px}.confirmation-title{display:block;font-size:19px;font-weight:700;text-align:center}.confirmation-content{display:block;font-size:15px;line-height:1.7;margin:18px 0 24px;overflow-wrap:anywhere;white-space:pre-wrap}.confirmation-actions{display:flex;gap:12px}.confirmation-actions .btn{flex:1;min-width:0;min-height:44px}</style>
