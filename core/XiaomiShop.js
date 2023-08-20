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
      this.doSign()
      // 执行成功后触发 标记当前任务已完成 失败了请勿调用
      this.setExecuted()
    }
    commonFunctions.minimize()
  }

  this.openSignPage = function (tryTime) {
    tryTime = tryTime || 1
    commonFunctions.launchPackage(_package_name)
    sleep(500)
    this.awaitAndSkip()
    let mineBtn = widgetUtils.widgetGetOne('我的')
    if (this.displayButtonAndClick(mineBtn, '我的', 1000)) {
      let entry = widgetUtils.widgetGetOne('米金星球')
      if (this.displayButtonAndClick(entry, '米金星球入口')) {
        return true
      }
    } else if (tryTime <= 3) {
      return this.openSignPage(tryTime + 1)
    }
    return false
  }

  this.doSign = function () {
    sleep(1000)
    widgetUtils.widgetWaiting('做任务领米金')
    let dialySign = widgetUtils.widgetGetOne('每日签到')
    this.displayButtonAndClick(dialySign, '每日签到')
    let browseBtn = widgetUtils.widgetGetOne('去浏览')
    while (this.displayButtonAndClick(browseBtn, '去浏览')) {
      FloatyInstance.setFloatyText('等待五秒')
      sleep(5000)
      automator.back()
      sleep(1000)
      let rewardBtn = widgetUtils.widgetGetOne('领取奖励', 2000)
      this.displayButtonAndClick(rewardBtn, '领取奖励')
      sleep(500)
      browseBtn = widgetUtils.widgetGetOne('去浏览')
    }
    let doTask = widgetUtils.widgetGetOne('做任务')
    if(this.displayButtonAndClick(doTask, '做任务')) {
      sleep(1000)
      widgetUtils.widgetWaiting('关注')
      let likeBtn = widgetUtils.widgetGetById('com.xiaomi.*mi_circle_like_iv', 2000, matcher => matcher.boundsInside(config.device_width / 2, config.device_height * 0.2, config.device_width, config.device_height * 0.7))
      let clicked = this.displayButtonAndClick(likeBtn, '点赞按钮')
      automator.back()
      sleep(1000)
      if (clicked) {
        let rewardBtn = widgetUtils.widgetGetOne('领取奖励', 2000)
        this.displayButtonAndClick(rewardBtn, '领取奖励')
      }
    }
    // 领取奖励
    let rewardBtn = widgetUtils.widgetGetOne('领取奖励', 2000)
    while (this.displayButtonAndClick(rewardBtn, '领取奖励')) {
      auto.clearCache && auto.clearCache()
      rewardBtn = widgetUtils.widgetGetOne('领取奖励', 2000)
      sleep(500)
    }
    // 去点赞
  }

  let _this = this
  function findReward() {
    let rewardBtn = widgetUtils.widgetGetOne('领取奖励', 2000)
    return this.displayButtonAndClick(rewardBtn, '领取奖励')
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
