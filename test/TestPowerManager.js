/*
 * @Author: TonyJiangWJ
 * @Date: 2020-09-21 09:33:00
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-09-21 10:03:19
 * @Description: 
 */
require('../modules/init_if_needed.js')(runtime, this)
// $power_manager.requestIgnoreBatteryOptimizations(true)
log($power_manager.isIgnoringBatteryOptimizations())
let data = {
  action: 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  data: 'package:' + context.packageName
}
log(JSON.stringify(data))
app.startActivity(data)