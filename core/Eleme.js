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
          let signBtn = widgetUtils.widgetGetOne('^签到$')
          if (signBtn) {
            boundsInfo = signBtn.bounds()
            FloatyInstance.setFloatyInfo({ x: boundsInfo.centerX(), y: boundsInfo.top - 10 }, '立即签到')
            sleep(500)
            if (!signBtn.click()) {
              warnInfo(['无障碍点击失败，尝试坐标点击：{},{}', boundsInfo.centerX(), boundsInfo.top - 10])
              automator.click(boundsInfo.centerX(), boundsInfo.top - 10)
            }
            sleep(1000)
            if (widgetUtils.widgetCheck('明日签到', 500)) {
              this.signedStore.updateStorageValue(value => value.executed = true)
            } else {
              warnInfo(['签到失败，下次执行时继续尝试'])
            }
          } else {
            this.pushLog('未找到立即签到按钮')
            let signed = widgetUtils.widgetCheck('(今日已|明日)签到.*', 1500)
            if (signed) {
              this.pushLog('今日已签到')
              this.signedStore.updateStorageValue(value => value.executed = true)
            } else {
              this.pushLog('无法确定今日是否成功签到')
            }
          }
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

  /**
   * 打开任务抽屉界面
   * 
   * @param {boolean} reopen 是否是重新打开，如果是则不再尝试重新打开 避免陷入死循环
   * @returns 
   */
  this.openDrawer = function (reopen) {
    let browseAndReward = widgetUtils.widgetGetOne('连续签到\\d天')
    if (!browseAndReward) {
      browseAndReward = widgetUtils.widgetGetOne('领豆赚豆按钮')
    }
    if (!browseAndReward) {
      warnInfo(['未找到领豆赚豆按钮，尝试控件信息识别'], true)
      browseAndReward = selector().className('android.view.View').clickable(true).filter(v => {
        let bdInfo = v.bounds()
        return bdInfo.width() > config.device_width / 2 && bdInfo.width() / bdInfo.height() > 2 && bdInfo.left > 0
      }).findOne(config.timeout_findOne)
    }
    if (!this.displayButtonAndClick(browseAndReward, '找到了领豆赚豆按钮', null, true)) {
      this.pushLog('未找到领豆赚豆按钮')
      // 自动设置五分钟后继续
      this.createNextSchedule(this.taskCode)
      return false
    }
    let checkLimit = 5
    while (!widgetUtils.widgetWaiting('任务记录|展开更多', 1000) && checkLimit-- > 0) {
      this.displayButtonAndClick(browseAndReward, '重新点击领豆赚豆按钮' + checkLimit, null, true)
      sleep(1000)
    }

    sleep(1000)
    let anchorWidget = widgetUtils.widgetGetOne('浏览赚豆')
    if (anchorWidget) {
      let point = { x: anchorWidget.bounds().centerX(), y: anchorWidget.bounds().centerY() }
      FloatyInstance.setFloatyInfo(point, '浏览赚豆')
      // 向上滑动
      automator.swipe(point.x, point.y > config.device_height * 0.8 ? config.device_height * 0.8 : point.y, point.x, config.device_height / 2, 800)
      return true
    } else {
      this.pushLog('未找到浏览赚豆按钮')
      sleep(1000)
      if (!reopen) {
        return this.openDrawer(true)
      }
    }
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
    sleep(1000)
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
      while (total-- > 0) {
        sleep(1000)
        this.pushLog('等待' + total + '秒')
      }
      this.pushLog('准备返回')
      sleep(1000)
      automator.back()
      sleep(1000)
      let l = 3
      while (!widgetUtils.widgetCheck('浏览赚豆', 2000) && l-- > 0) {
        let btn = null
        if ((btn = widgetUtils.widgetGetOne('已连签\\d+天'))) {
          FloatyInstance.setFloatyInfo({ x: btn.bounds().centerX(), y: btn.bounds().centerY() }, '找到了已连签控件，直接打开抽屉开始执行任务')
          return this.doHangTasks(hangLimit)
        }
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