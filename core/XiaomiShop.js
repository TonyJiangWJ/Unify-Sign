/**
 * 小米商城 米金签到
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
  const _package_name = 'com.xiaomi.shop'

  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // ...
    // 在这里写签到执行的代码
    // ...
    if (this.openSignPage()) {
      if (this.doSign()) {
        // 执行成功后触发 标记当前任务已完成 失败了请勿调用
        this.setExecuted()
      }
    }
    FloatyInstance.setFloatyText('执行完毕')
    commonFunctions.minimize()
  }

  this.openSignPage = function (tryTime) {
    tryTime = tryTime || 1
    commonFunctions.launchPackage(_package_name)
    sleep(500)
    this.awaitAndSkip()
    let mineBtn = widgetUtils.widgetGetOne('我的')
    if (this.displayButtonAndClick(mineBtn, '我的', 1000)) {
      let entry = widgetUtils.widgetGetOne('米金')
      if (this.displayButtonAndClick(entry, '米金入口')) {
        return true
      }
    } else if (tryTime <= 3) {
      return this.openSignPage(tryTime + 1)
    }
    return false
  }

  this.doSign = function () {
    sleep(1000)
    let success = false
    if (this.captureAndCheckByOcr('米金天天赚', '米金天天赚', null, 1000, true, 3)) {
      sleep(1000)
      if (widgetUtils.widgetCheck('米金签到|已连签|立即签到')) {
        let signBtn = widgetUtils.widgetGetOne('立即签到')
        if (this.displayButtonAndClick(signBtn, '立即签到')) {
          this.pushLog('签到完成')
          sleep(1000)
          success = true
        } else if (widgetUtils.widgetCheck('已签到')) {
          this.pushLog('今日已签到')
          success = true
        }
      }
      // todo 校验签到已完成
      this.doBrowseTasks()
    }
    return success
  }

  this.doBrowseTasks = function () {
    this.pushLog('查找 去浏览')
    let browseBtn = widgetUtils.widgetGetOne('去浏览')
    if (this.displayButtonAndClick(browseBtn, '去浏览', 1000, true)) {
      sleep(2000)
      let browseCount = 0
      while (browseCount++ < 8) {
        let rewardBtn = widgetUtils.widgetGetOne('领取奖励', 1000)
        if (this.displayButtonAndClick(rewardBtn, '领取奖励')) {
          sleep(1000)
          break
        }
      }
      this.pushLog('返回查找 米金天天赚')
      automator.back()
      sleep(1000)
      let tryTime = 1
      let clicked = false
      while (!(clicked = this.captureAndCheckByOcr('米金天天赚', '米金天天赚', null, 1000, true, 2)) && ++tryTime <= 2) {
        sleep(1000)
        this.pushLog('未找到 米金天天赚 触发返回')
        automator.back()
      }
      if (clicked) {
        if (!widgetUtils.widgetCheck('米金签到|已连签|立即签到')) {
          this.pushLog('未找到 米金签到|已连签|立即签到')
          this.pushLog('再次查找并点击 米金天天赚' + this.captureAndCheckByOcr('米金天天赚', '米金天天赚', null, 1000, true, 2))
        }
        this.doBrowseTasks()
      }
    } else {
      this.pushLog('未找到去浏览按钮')
    }
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
