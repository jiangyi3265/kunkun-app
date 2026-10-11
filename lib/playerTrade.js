export const ITEM_CATEGORIES=['密钥','传世武器','头盔','护甲','背包','枪械','活动道具','日常道具']
export const PLAYER_TYPE='PLAYER_ITEM'
export const canPublish=(user,kind='SERVICE')=>user?.playerProfile?.realnameStatus==='VERIFIED'&&(kind==='REQUEST'||(user?.playerProfile?.shopStatus==='APPROVED'&&user?.playerProfile?.phoneVerified===true))
export const isItem=record=>record?.businessType===PLAYER_TYPE

export const GAME_SERVERS=[{label:"IOS-QQ",zone:"QQ区",platform:"iOS"},{label:"IOS-微信",zone:"微信区",platform:"iOS"},{label:"安卓QQ",zone:"QQ区",platform:"安卓"},{label:"安卓微信",zone:"微信区",platform:"安卓"},{label:"全平台",zone:"全平台",platform:"全平台"}]
export function gameServerLabel(item){return GAME_SERVERS.find(s=>s.zone===item?.zone&&s.platform===item?.platform)?.label||[item?.platform,item?.zone].filter(Boolean).join(" · ")}
