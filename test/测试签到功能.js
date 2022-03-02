let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let WidgetUtils = singletonRequire('WidgetUtils')
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
FloatyInstance.setFloatyInfo({ x: config.device_width * 0.4, y: config.device_height / 2 }, '准备执行 签到功能测试' )
config._debugging = true
if (!commonFunctions.ensureAccessibilityEnabled()) {
  errorInfo('获取无障碍权限失败')
  exit()
}

// 请求截图权限
commonFunctions.requestScreenCaptureOrRestart(true)

let signRunner = require('../core/Weibo.js')
// let signRunner = require('../core/DingDong.js')
signRunner.setName('微博').exec()