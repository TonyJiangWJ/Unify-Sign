/**
 * 华住会签到
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
  let _package_name = 'com.htinns'

  this.openApp = function () {
    app.launchPackage(_package_name)
    sleep(500)
    this.pushLog('校验是否有打开确认弹框')
    let confirm = widgetUtils.widgetGetOne(/^打开|允许$/, 3000)
    if (confirm) {
      this.displayButtonAndClick(confirm, '找到了打开按钮')
    } else {
      this.pushLog('没有打开确认弹框')
    }
    widgetUtils.widgetWaiting('会员')

    sleep(1000)
    let target = widgetUtils.widgetGetOne('会员')
    return this.displayButtonAndClick(target, '找到了会员')
  }

  this.skipNavigation = function () {
    let target = widgetUtils.widgetGetOne('跳过引导', 1000)
    return this.displayButtonAndClick(target, '找到了跳过')
  }

  this.doSign = function () {
    widgetUtils.widgetWaiting('签到')
    sleep(1000)
    let signEntry = widgetUtils.widgetGetOne('签到')
    if (this.displayButtonAndClick(signEntry, '找到了签到按钮')) {
      sleep(1000)
      this.skipNavigation()
      if (!widgetUtils.widgetWaiting('签到|签到开盲盒', 2000)) {
        this.pushLog('未找到 签到 按钮 校验是否已签到')
        if (widgetUtils.widgetWaiting('已签到', 2000)) {
          this.pushLog('今日已签到')
          return true
        }
      }
      this.pushLog('查找 签到 按钮')
      return this.doExecuteSign()
    }
    return false
  }

  this.doExecuteSign = function (time) {
    time = time || 0
    if (time > 3) {
      return false
    }
    let signBtn = widgetUtils.widgetGetOne('签到|签到开盲盒')
    if (this.displayButtonAndClick(signBtn, '执行签到')) {
      let check = widgetUtils.widgetWaiting('已签到', 1000)
      if (check) {
        return true
      } else {
        this.pushLog('未找到 已签到 重新签到')
        sleep(1000)
        return this.doExecuteSign(time + 1)
      }
    }
  }
  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // ...
    // 在这里写签到执行的代码
    // ...
    if (!this.openApp()) {
      commonFunctions.killCurrentApp()
      sleep(1000)
      this.openApp()
    }
    sleep(1000)
    if (this.doSign()) {
      // 执行成功后触发 标记当前任务已完成 失败了请勿调用
      this.setExecuted()
    }
    // 直接关闭
    commonFunctions.killCurrentApp()
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
