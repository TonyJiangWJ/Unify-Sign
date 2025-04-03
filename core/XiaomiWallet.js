/**
 * 签到代码模板
 */

// 配置信息
let { config } = require('../config.js')(runtime, global)
// 单例require 必须引用
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, global)
// 钱包界面无法显示悬浮窗
// let FloatyInstance = singletonRequire('FloatyUtil')
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
let NotificationHelper = singletonRequire('Notification')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  this.packageName = 'com.mipay.wallet'

  this.launchApp = function () {
    commonFunctions.launchPackage(this.packageName)
    sleep(500)
    this.awaitAndSkip(['\\s*允许\\s*', '\\s*跳过\\s*'])
  }

  this.doSign = function () {
    let mine = widgetUtils.widgetGetOne('我的', 2000)
    if (!mine) {
      this.pushLog('未能找到 我的 按钮 可能存在弹窗广告，执行返回')
      automator.back()
      mine = widgetUtils.widgetGetOne('我的')
    }
    if (mine) {
      mine.click()
      sleep(1000)
      let dailySignEntry = widgetUtils.widgetGetOne('每日福利')
      if (dailySignEntry) {
        dailySignEntry.click()
        sleep(1000)
        // 执行成功后触发 标记当前任务已完成 失败了请勿调用
        if (widgetUtils.widgetGetOne('已签')) {
          this.pushLog('今日可能已完成签到')
        } else {
          this.pushLog('无法校验今天是否成功签到')
          NotificationHelper.createNotification('小米钱包每日签到', '今日签到未成功，请检查脚本或者手动签到', 'xiaomiwallet')
        }
        if (this.doDailyTask()) {
          this.setExecuted()
        } else {
          this.pushLog('今日任务执行失败')
          NotificationHelper.createNotification('小米钱包每日签到', '今日每日任务执行失败，请检查脚本或者手动签到', 'xiaomiwallet')
        }
      }
    } else {
      logUtils.warnInfo('未能找到 我的 按钮', true)
    }
  }

  this.doDailyTask = function () {
    let success = true
    if (!this.doBrowsePages()) {
      this.pushLog('执行每日浏览失败')
      success = false
    }
    if (!this.browseVideoMember()) {
      this.pushLog('执行每日视频会员任务失败')
      success = false
    }
    return success
  }

  this.doBrowsePages = function () {
    let entries = widgetUtils.widgetGetAll('去领取')
    if (entries && entries.length > 0) {
      entries = entries.filter(entry => {
        let rowContainer = entry.parent().parent()
        let title = rowContainer.child(1).text()
        if (title.indexOf('申请') > -1) {
          return false
        }
        return true
      })
    }
    if (!entries || entries.length == 0) {
      this.pushLog('今日浏览任务可能已完成')
      return true
    } else {
      this.doBrowse(entries[0])
      return this.doBrowsePages()
    }
  }

  this.doBrowse = function (entry) {
    let startY = config.device_height - config.device_height * 0.15
    let endY = startY - config.device_height * 0.3
    if (this.displayButtonAndClick(entry, '去领取')) {
      let limit = 10
      while (--limit > 0) {
        this.replaceLastLog('等待' + limit + '秒')
        automator.gestureDown(startY, endY, 1000)
      }
      automator.back()
      sleep(1000)
      return true
    }
    return false
  }

  this.browseVideoMember = function () {
    NotificationHelper.createNotification('小米钱包每日提醒',
      '视频会员领取提醒，目前懒得开发，请手动执行一下', 'xiaomiwallet:unimpl')
    return true
  }
  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // ...
    // 在这里写签到执行的代码
    // ...
    this.launchApp()
    // 点击我的
    // 点击 每日福利
    this.doSign()

    commonFunctions.minimize()
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
