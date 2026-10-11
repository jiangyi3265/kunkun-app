<script>
 import {startReminders,stopReminders} from "./lib/reminders"
 import {consumeStartupStorageIssue} from "./lib/session"
	export default {
		onLaunch: function() {
			console.log('App Launch')
			const issue=consumeStartupStorageIssue()
			if(issue){
				console.warn('[startup] '+issue)
				uni.showToast({title:'登录缓存读取失败，请重新登录',icon:'none',duration:3000})
			}
		},
		onShow: function() {
			startReminders()
		},
		onHide: function() {
			stopReminders()
		}
	}
</script>

<style>
@import './styles/app.css';
</style>
