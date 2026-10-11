<template><view class="game-art" :class="[avatar?'is-avatar':'','art-'+art]" :style="artStyle" :aria-label="game||art"><image v-if="src" class="custom-art" :src="imageUrl(src)" mode="aspectFill" /><image v-else class="atlas-image" src="/static/game-atlas.jpg" mode="scaleToFill" /><slot /></view></template>
<script setup>
import {computed} from 'vue';import {imageUrl} from '../lib/api'
const props=defineProps({game:String,type:String,src:String,avatar:Boolean,variant:String,size:[String,Number]});const art=computed(()=>props.type||({'王者荣耀':'hero','和平精英':'soldier','原神':'anime'}[props.game])||'crown')
// Native component hosts do not pass scoped size rules to this inner view.
// Keep the geometry on the actual image container in both renderers.
const artStyle=computed(()=>{
 const variants={shortcut:{width:'56px',height:'56px',borderRadius:'14px'},cover:{width:'100%',height:'168px'},horizontal:{width:'106px',height:'112px',borderRadius:'10px'},mini:{width:'72px',height:'72px',borderRadius:'9px'},manage:{width:'92px',height:'92px',borderRadius:'9px'},chat:{width:'64px',height:'64px',borderRadius:'9px'},detail:{width:'100%',height:'285px'},hero:{width:'180px',height:'180px',position:'absolute',right:'-8px',bottom:'-6px'},banner:{width:'120px',height:'120px',position:'absolute',right:'-6px',top:'-4px'},auth:{width:'90px',height:'90px',borderRadius:'25px'}}
 const geometry=variants[props.variant]||{width:'72px',height:'72px',borderRadius:'10px'}
 const size=typeof props.size==='number'?props.size+'px':props.size||'40px'
 return props.avatar?{width:size,height:size,minHeight:size,borderRadius:'50%'}:{...geometry,minHeight:geometry.height}
})
</script>
<style scoped>.game-art{background-color:#e6dfce;overflow:hidden;flex-shrink:0;position:relative;min-height:24px}.atlas-image{position:absolute;width:200%;height:200%;max-width:none;left:0;top:0;pointer-events:none}.art-soldier .atlas-image{left:-100%}.art-anime .atlas-image{top:-100%}.art-crown .atlas-image{top:-100%;left:-100%}.custom-art{position:absolute;width:100%;height:100%;top:0;left:0}.is-avatar{width:40px;height:40px;border-radius:50%}</style>
