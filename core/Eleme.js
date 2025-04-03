/**
 * 签到代码模板
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
// 本地OCR工具 按需引用
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  const DAILY_SIGNED = 'eleme_DAILY_SIGNED'
  this.initStorages = function () {
    // 是否执行过签到
    this.signedStore = this.createStoreOperator(DAILY_SIGNED, { executed: false, count: 0 })
  }
  BaseSignRunner.call(this)
  let _package_name = 'me.ele'
  this.visitedTasks = []
  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    let mine = this.openEleme()
    if (mine) {
      this.pushLog('找到了我的按钮')
      automator.clickCenter(mine)
      sleep(1000)
      this.pushLog('通过OCR查找赚吃货豆')
      let rewardButton = this.captureAndCheckByOcr('.*(赚|賺)?吃货豆.*', '赚吃货豆', null, null, true, 3)
      if (rewardButton) {
        sleep(1000)
        if (!this.signedStore.getValue().executed) {
          this.doDailySign()
        } else {
          this.pushLog('今日已签到，不再检测是否已签到')
        }
        this.doHangTasks()
        if (!this.signedStore.getValue().executed) {
          warnInfo(['今日签到判断为失败，延迟重试'])
        } else {
          this.setExecuted()
        }
      } else {
        this.pushLog('未找到赚吃货豆按钮')
      }
    } else {
      this.pushLog('未找到我的按钮')
    }
    sleep(1000)
    commonFunctions.minimize()
  }

  this.doDailySign = function () {
    if (this.captureAndCheckByOcr('^签到$', '签到', null, null, true)) {
      sleep(1000) // 等待控件稳定 重新获取一遍
      if (this.captureAndCheckByOcr('明日签到', null, null, null, false)) {
        this.pushLog('找到明日签到 设置今日签到成功')
        this.signedStore.updateStorageValue(value => value.executed = true)
      }
    } else {
      this.pushLog('未找到立即签到按钮')
      if (this.captureAndCheckByOcr('^连签$', '连签', null, null, true)) {
        this.pushLog('点击了连签')
        sleep(1000)
        if (this.captureAndCheckByOcr('已连续签到.*', '已连续签到', null, null, false)) {
          this.pushLog('打开了抽屉 设置今日签到成功')
          this.signedStore.updateStorageValue(value => value.executed = true)
        }
      } else {
        this.pushLog('无法确定今日是否成功签到')
      }
    }
  }

  /**
   * 打开任务抽屉界面
   * 
   * @param {boolean} reopen 是否是重新打开，如果是则不再尝试重新打开 避免陷入死循环
   * @returns 
   */
  this.openDrawer = function (reopen) {

    if (this.captureAndCheckByOcr('连签|做任务.*', null, null, null, true)) {
      this.pushLog('点击打开抽屉成功')
      return true
    }
    if (this.captureAndCheckByOcr('已连续签到.*', null, null, null, false)) {
      this.pushLog('当前已经打开抽屉')
      return true
    }
    this.pushLog('打开抽屉失败')
    return false
  }

  /**
   * 执行逛逛任务
   */
  this.doHangTasks = function (hangLimit) {
    hangLimit = hangLimit || 5
    if (!this.openDrawer()) {
      return
    }
    // 滑动界面
    automator.randomScrollDown()
    sleep(2000)
    let checkBtn = this.captureAndCheckByOcr('.*去(浏览|逛逛|完成).*', '执行任务', [config.device_width / 2, 0, config.device_width / 2, config.device_height])
    // 增加限制 避免进入死循环 这里大概就11个
    let limit = 15, region = null, executed = false
    while (checkBtn && limit-- > 0) {
      let bds = checkBtn.bounds()
      let checkTaskInfo = this.captureAndGetOcrText('任务信息', [0, bds.top - bds.height(), bds.left, bds.height() * 2.5])
      debugInfo(['任务信息：{}', checkTaskInfo])
      if (this.visitedTasks.indexOf(checkTaskInfo) >= 0) {
        warnInfo(['当前任务已执行过，可能又是饿了么搞幺蛾子：{}', checkTaskInfo])
        region = [0, bds.bottom, config.device_width, config.device_height - bds.bottom]
        checkBtn = this.captureAndCheckByOcr('.*去(浏览|逛逛|完成).*', '执行任务', region)
        if (!checkBtn) {
          debugInfo(['排除重复任务后，无更多任务'])
          break
        }
      }
      this.visitedTasks.push(checkTaskInfo)
      this.pushLog('找到了去(浏览|逛逛|完成)')
      sleep(500)
      automator.clickCenter(checkBtn)
      sleep(2000)
      let total = 20
      this.pushLog('等待' + total + '秒')
      while (total-- > 0) {
        sleep(1000)
        this.replaceLastLog('等待' + total + '秒')
      }
      this.pushLog('准备返回')
      sleep(1000)
      automator.back()
      sleep(1000)
      let l = 3
      while (!this.captureAndCheckByOcr('浏览赚豆|任务记录') && l-- > 0) {
        automator.back()
        sleep(1000)
      }
      sleep(2000)
      checkBtn = this.captureAndCheckByOcr('.*去(浏览|逛逛|完成).*', '执行任务', region)
      executed = true
    }
    if (!checkBtn) {
      let hangBtns = widgetUtils.widgetGetAll('去(浏览|逛逛|完成)', 1000)
      if (hangBtns && hangBtns.length > 0) {
        this.pushLog('有任务按钮，但OCR识别失败')
        warnInfo(['有任务按钮，但OCR识别失败'], true)
      } else {
        this.pushLog('控件识别无任务按钮')
        // hangLimit = 0
      }
      if (executed && --hangLimit > 0) {
        this.pushLog('退出并重新进入当前页面，刷新列表')
        automator.back()
        sleep(1000)
        if (this.captureAndCheckByOcr('.*(赚|賺)?吃货豆.*', '赚吃货豆', null, null, true, 3)) {
          return this.doHangTasks(hangLimit)
        } else {
          this.pushLog('未找到赚吃货豆按钮，退出并重新进入当前页面失败')
        }
      }
      this.pushLog('未找到去(浏览|逛逛|完成)')
    }
    return true
  }

  /**
   * 打开饿了么
   *
   * @returns 
   */
  this.openEleme = function () {
    commonFunctions.launchPackage(_package_name)
    sleep(500)
    this.pushLog('校验是否有打开确认弹框')
    let confirm = widgetUtils.widgetGetOne(/^打开|允许$/, 3000)
    if (confirm) {
      this.displayButtonAndClick(confirm, '找到了打开按钮')
    } else {
      this.pushLog('没有打开确认弹框')
    }
    return widgetUtils.widgetGetOne('我的')
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner

module.exports = new SignRunner()