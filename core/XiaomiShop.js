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
  const daily_sign_entry = '.*(做任务|米金天天|先赚米金兑权益|今日完成任务|去完成|去签到).*'

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
    this.pushLog('查找 我的')
    let mineBtn = widgetUtils.widgetGetOne('我的')
    if (this.displayButtonAndClick(mineBtn, '我的', 1000, false, bd => [bd.left + bd.width() / 2, bd.top - bd.height()])) {
      sleep(1000)
      this.captureAndCheckByOcr('下次再说|本次忽略', '下次再说', null, 1000, true, 1)
      this.pushLog('查找 米金 入口')
      let entry = widgetUtils.widgetGetOne('米金')
      if (this.displayButtonAndClick(entry, '米金入口')) {
        if (widgetUtils.widgetCheck('.*(积攒米金|每日签到|米金即将过期).*', 2000) || this.captureAndCheckByOcr('每日签到')) {
          return true
        }
        this.pushWarningLog('无法找到签到页面控件')
      } else {
        this.pushWarningLog('打开 我的 页面失败')
      }
      return this.openSignPage(tryTime + 1)
    } else if (tryTime <= 3) {
      this.pushErrorLog('查找 我的 失败 二次尝试')
      this.captureAndCheckByOcr('下次再说|本次忽略', '下次再说', null, 1000, true, 1)
      return this.openSignPage(tryTime + 1)
    }
    return false
  }

  this.doSign = function () {
    sleep(2000)
    let success = false
    this.pushLog('通过OCR查找赚米金入口')
    if (this.captureAndCheckByOcr(daily_sign_entry, '赚米金入口', null, 1000, true, 3)) {
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
    } else {
      this.pushErrorLog('查找 赚米金入口 失败')
    }
    return success
  }

  this.doBrowseTasks = function () {
    this.pushLog('查找 去浏览')
    let browseBtn = widgetUtils.widgetGetOne('去浏览')
    if (this.displayButtonAndClick(browseBtn, '去浏览', 1000, true)) {
      sleep(2000)
      let browseCount = 0
      let clickedBack = false
      // 需要10秒 多等待些
      while (browseCount++ < 15) {
        let rewardBtn = widgetUtils.widgetGetOne('领取奖励', 1000)
        if (this.displayButtonAndClick(rewardBtn, '领取奖励')) {
          sleep(1000)
          clickedBack = true
          break
        }
      }
      this.pushLog('返回查找 赚米金入口')
      !clickedBack && automator.back()
      sleep(1000)
      let tryTime = 1
      let clicked = false
      while (!(clicked = this.captureAndCheckByOcr(daily_sign_entry, '赚米金入口', null, 1000, true, 2)) && ++tryTime <= 2) {
        sleep(1000)
        this.pushLog('未找到 赚米金入口 触发返回')
        automator.back()
      }
      if (clicked) {
        if (!widgetUtils.widgetCheck('米金签到|已连签|立即签到')) {
          this.pushLog('未找到 米金签到|已连签|立即签到')
          this.pushLog('再次查找并点击 赚米金入口' + this.captureAndCheckByOcr(daily_sign_entry, '赚米金入口', null, 1000, true, 2))
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
