import {request,loadConfig,go} from './api'
import {rewardImage} from './rewards'
export const contentImage=path=>path==='/static/player-equipment-banner.jpg'?path:rewardImage(path)
export async function loadSite(){return (await loadConfig()).contentEnabled?request('/boost/content/site'):null}
export function openContentTarget(target){
 if(typeof target!=='string'||! /^(market\/index|hall\/index|content\/activities|rewards\/mall|rewards\/activity(?:\?id=[1-9][0-9]*)?|content\/activity\?id=[1-9][0-9]*)$/.test(target))return
 const [path,query]=target.split('?');go(path,query?{id:query.slice(3)}:{})
}
