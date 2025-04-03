/**
 * 一嗨租车积分签到
 */

// 配置信息
let { config } = require('../config.js')(runtime, global)
// 单例require 必须引用
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, global)
// 悬浮窗组件 按需引用
let FloatyInstance = singletonRequire('FloatyUtil')
// 找控件专用 按需引用
let widgetUtils = singletonRequire('WidgetUtils')
// 自动执行专用 如点击等 按需引用
let automator = singletonRequire('Automator')
// 大部分的公共方法 按需引用
let commonFunctions = singletonRequire('CommonFunction')
// 日志打印 按需引用
let logUtils = singletonRequire('LogUtils')
// 本地OCR工具 按需引用
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  this.package_name = 'com.ehai'

  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // ...
    // 在这里写签到执行的代码
    // ...
    if (this.openPage()) {
      let signBtn = widgetUtils.widgetGetById('com.ehai:id/btn_sign_in', 2000)
      if (this.displayButtonAndClick(signBtn)) {
        this.pushLog('签到完成：' + signBtn.text())
        // 执行成功后触发 标记当前任务已完成 失败了请勿调用
        this.setExecuted()
      }
    }
    commonFunctions.minimize()
  }

  this.openPage = function () {
    this.openPackageAndSkipDialog(this.package_name)
    let mineTarget = widgetUtils.widgetGetById('com.ehai:id/tv_my_ehi', 1000)
    if (this.displayButtonAndClick(mineTarget)) {
      sleep(1000)
      let signEntry = widgetUtils.widgetGetOne('签到领积分', 2000)
      if (this.displayButtonAndClick(signEntry)) {
        return !!widgetUtils.widgetWaiting('积分明细')
      } else {
        this.pushErrorLog('查找 签到领积分 控件失败')
      }
    } else {
      this.pushErrorLog('无法找到 我的 控件，id：com.ehai:id/tv_my_ehi')
    }
    return false
  }
  
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
