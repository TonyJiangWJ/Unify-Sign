let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let WidgetUtils = singletonRequire('WidgetUtils')
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let { logInfo, errorInfo, warnInfo, debugInfo, infoLog, debugForDev, flushAllLogs } = singletonRequire('LogUtils')

config._debugging = true

logInfo('======初始化SQLite=======')
// let signTaskService = singletonRequire('SignTaskService')
// 初始化数据库连接
// signTaskService.init()

config.is_test = true
// let signRunner = require('../core/Weibo.js')
// let signRunner = require('../core/DingDong.js')
// let signRunner = require('../core/AlipayMerchantCredits.js')
// let signRunner = require('../core/AntCredits.js')
// let signRunner = require('../core/JingDongBeans.js')
// let signRunner = require('../core/BBFarm.js')
// 饿了么重置签到执行成功
// let elemeSignRunner = require('../core/Eleme.js')
// elemeSignRunner.initStorages()
// elemeSignRunner.signedStore.updateStorageValue(value => value.executed = false)

// 淘宝签到重置逛一逛任务执行次数
let taobaoSignRunner = require('../core/Taobao-Sign.js')
taobaoSignRunner.initStorages()
taobaoSignRunner.hangStore.updateStorageValue(value => {
  value.executed = false
  value.count = 0
})