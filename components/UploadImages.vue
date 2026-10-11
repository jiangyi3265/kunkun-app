<template><view><view class="uploads"><view v-for="(file,i) in modelValue" :key="file" class="upload-thumb"><image :src="imageUrl(file)" mode="aspectFill" @click="preview(file)" /><button class="ui-button remove-image" aria-label="移除图片" @click="remove(i)">×</button></view><button v-if="modelValue.length<limit" class="ui-button upload-add" :disabled="busy" @click="choose"><AppIcon class="app-icon" name="plus" :size="26" /><text>{{busy?'上传中':'添加图片'}}</text></button></view><text v-if="error" class="field-error">{{error}}</text></view></template>
<script setup>
import {ref,nextTick,watch,onBeforeUnmount} from 'vue';import AppIcon from './AppIcon.vue';import {upload,imageUrl,session} from '../lib/api';import {previewMedia} from '../lib/media'
const props=defineProps({modelValue:{type:Array,default:()=>[]},limit:{type:Number,default:9},purpose:{type:String,default:'LISTING'}});const emit=defineEmits(['update:modelValue','busy']);const busy=ref(false),error=ref('')
function remove(i){emit('update:modelValue',props.modelValue.filter((_,n)=>n!==i))}
function preview(file){previewMedia(props.modelValue,file)}
let generation=0
function invalidate(){generation++;busy.value=false;error.value='';emit('busy',false)}
watch(()=>session.token,invalidate,{flush:'sync'})
onBeforeUnmount(invalidate)
function choose(){
 if(busy.value||props.modelValue.length>=props.limit)return
 const token=session.token,version=++generation
 busy.value=true;emit('busy',true);error.value=''
 const active=()=>version===generation&&token===session.token
 const finish=()=>{if(version===generation){busy.value=false;emit('busy',false)}}
 uni.chooseImage({count:props.limit-props.modelValue.length,sizeType:['compressed'],success:async r=>{
  try{if(!active())return
   for(const path of r.tempFilePaths){if(!active()||props.modelValue.length>=props.limit)return;const url=await upload(path,props.purpose);if(!active())return;emit('update:modelValue',[...props.modelValue,url]);await nextTick()}
  }catch(e){if(active())error.value=e.message}finally{finish()}
 },fail:finish})
}
</script>
