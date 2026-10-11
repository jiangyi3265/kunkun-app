<template><image :src="`/static/icons/${name}.png`" class="app-icon" :style="{width:size+'px',height:size+'px'}" mode="aspectFit" :aria-label="label || name" /></template>
<script setup>defineProps({name:{type:String,default:'chevron'},size:{type:Number,default:22},label:String})</script>
<style scoped>.app-icon{display:inline-block;flex-shrink:0;vertical-align:middle}</style>
