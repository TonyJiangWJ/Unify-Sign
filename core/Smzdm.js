/**
 * 什么值得买
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
let logUtils = singletonRequire('LogUtils')
// 本地OCR工具 按需引用
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // 打开APP
    this.launchApp()
    // 执行签到
    this.doSign()
    commonFunctions.minimize()
  }

  this.launchApp = function () {
    commonFunctions.launchPackage('com.smzdm.client.android')
    sleep(500)
    this.awaitAndSkip()
    this.closeAdDialog()
  }

  this.closeAdDialog = function () {
    FloatyInstance.setFloatyText('查找是否有关闭广告')
    let close = widgetUtils.widgetGetById('com.smzdm.client.android:id/dialog_home_close', 1000)
    this.displayButtonAndClick(close, '关闭广告', 1000)
  }

  this.doSign = function () {
    FloatyInstance.setFloatyText('查找我的')
    let mine = widgetUtils.widgetGetById('com.smzdm.client.android:id/tab_usercenter')
    if (this.displayButtonAndClick(mine, '我的', 1000)) {
      FloatyInstance.setFloatyText('查找签到入口')
      let signEntry = widgetUtils.widgetGetById('com.smzdm.client.android:id/v_container_login_not_sign_animation', 3000)
      if (!this.displayButtonAndClick(signEntry, '签到入口')) {
        signEntry = widgetUtils.widgetGetById('com.smzdm.client.android:id/v_login_sign_background', 3000)
        FloatyInstance.setFloatyText('未找到签到入口，可能已完成签到进行校验')
        logUtils.warnInfo('未找到签到入口，可能已完成签到')
        this.displayButtonAndClick(signEntry)
      }
      if (widgetUtils.widgetCheck('已连续签到', 3000)) {
        this.setExecuted()
      }
    }
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
