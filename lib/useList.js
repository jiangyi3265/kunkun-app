import { ref } from 'vue'
import { request } from './api'
export function useList(endpoint, filters = () => ({})) {
 const items=ref([]),loading=ref(false),error=ref(''),total=ref(0),page=ref(1);let generation=0
 async function load(reset=true){if(!reset&&loading.value)return;const current=++generation,requestedPage=reset?1:page.value+1;loading.value=true;error.value='';if(reset){items.value=[];total.value=0}try{const d=await request(endpoint,'GET',{...filters(),page:requestedPage});if(current!==generation)return;const rows=d.items||d;items.value=reset?rows:[...items.value,...rows];total.value=d.total??rows.length;page.value=requestedPage}catch(e){if(current===generation)error.value=e.message}finally{if(current===generation)loading.value=false}}
 function more(){if(items.value.length<total.value&&!loading.value)return load(false)}
 return {items,loading,error,total,load,more}
}
