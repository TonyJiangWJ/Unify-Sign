/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-25 16:46:06
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2024-04-25 23:32:38
 * @Description: 
 */

let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let alipayUnlocker = singletonRequire('AlipayUnlocker')
let widgetUtils = singletonRequire('WidgetUtils')
let logUtils = singletonRequire('LogUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')
let BaseSignRunner = require('./BaseSignRunner.js')
let signFailedUtil = singletonRequire('SignFailedUtil')

function CreditRunner () {
  BaseSignRunner.call(this)
  let _package_name = 'com.eg.android.AlipayGphone'
  let _family_regex = /^\+(\d+)$/

  this.collectFamily = false

  this.openCreditPage = function (tryTime) {
    tryTime = tryTime || 1
    commonFunctions.launchPackage(_package_name)
    sleep(500)
    if (config.is_alipay_locked) {
      alipayUnlocker.unlockAlipay()
    }
    app.startActivity({
      action: 'VIEW',
      data: 'alipays://platformapi/startapp?appId=20000160&url=%2Fwww%2FmyPoints.html',
      packageName: _package_name
    })
    sleep(500)
    FloatyInstance.setFloatyText('校验是否有打开确认弹框')
    let confirm = widgetUtils.widgetGetOne(/^打开$/, 3000)
    if (confirm) {
      this.displayButtonAndClick(confirm, '找到了打开按钮')
    } else {
      FloatyInstance.setFloatyText('没有打开确认弹框')
    }
    if (!widgetUtils.widgetWaiting('(我的(积分|等级特权))|每日签到')) {
      if (tryTime >= 5) {
        warnInfo(['检测到未能进入会员积分界面，已尝试多次，放弃重试'])
        return false
      }
      warnInfo(['检测到未能进入会员积分界面，重新进入'])
      commonFunctions.minimize()
      return this.openCreditPage(tryTime++)
    }
    return true
  }


  /**
   * 判断比例 是不是正方形
   * @param {目标控件} bounds 
   */
  this.isCollectableBall = function (bounds) {
    if (bounds) {
      let flag = Math.abs(bounds.width() - bounds.height()) <= 10 && bounds.width() > 30
      logUtils.debugInfo(['校验控件形状是否符合：[{}, {}] result: {}', bounds.width(), bounds.height(), flag])
      return flag
    }
    return false
  }

  this.canCollect = function (val) {
    let bounds = val.bounds()
    return this.isCollectableBall(bounds)
  }

  this.collectCredits = function (position, regex) {
    // 等待稳定
    sleep(1000)
    let widgets = widgetUtils.widgetGetAll(regex, null, true)
    let collected = true
    while (widgets && collected) {
      logUtils.logInfo(['总数：{}', widgets.target.length])
      let targets = widgets.target
      let isDesc = widgets.isDesc
      let totalCollect = 0
      targets.forEach(val => {
        let contentInfo = isDesc ? val.desc() : val.text()
        if (this.canCollect(val)) {
          automator.clickCenter(val)
          logUtils.logInfo([
            'value: {}', contentInfo
          ])
          totalCollect += parseInt(regex.exec(contentInfo)[1])
          sleep(500)
        }
      })
      logUtils.infoLog(['{} 总共领取：「{}」分', position, totalCollect])
      collected = totalCollect > 0
      if (collected) {
        sleep(1000)
        // 再次检测, 缩短检测超时时间为两秒
        widgets = widgetUtils.widgetGetAll(regex, 2000, true)
      }
    }
  }

  this.checkAndCollect = function () {
    sleep(1000)
    FloatyInstance.setFloatyTextColor('#00ff00')
    FloatyInstance.setFloatyText('检测是否有今日支付积分')
    auto.clearCache && auto.clearCache()
    // 今日支付积分
    target = widgetUtils.widgetGetOne('.*全部领取.*')
    if (target) {
      this.displayButtonAndClick(target, '找到了支付积分，准备收取')
    } else {
      if (!this.captureAndCheckByOcr('全部领取', '全部领取', null, null, true, 3)) {
        FloatyInstance.setFloatyTextColor('#ff0000')
        FloatyInstance.setFloatyText('未找到今日支付积分')
        signFailedUtil.recordFailedWidgets(this.taskCode, '支付积分')
        sleep(1000)
      }
    }
    sleep(500)
    FloatyInstance.setFloatyTextColor('#00ff00')
    FloatyInstance.setFloatyText('准备执行每日签到')
    // 直接进入积分签到
    openSignPage()
    this.doTask()
    // 十五秒广告
    this.doBrowseTask()
    automator.back()
    commonFunctions.setAliCreditsSigned()
  }



  this.enterCreditsTaskList = function () {
    let target = widgetUtils.widgetGetOne('每日签到')
    if (this.displayButtonAndClick(target, '准备执行签到浏览任务')) {
      sleep(1000)
      return true
    } else {
      FloatyInstance.setFloatyText('未能找到每日签到入口')
      sleep(1000)
    }
    return false
  }

  this.doTask = function () {

    let startY = config.device_height - config.device_height * 0.15
    let endY = startY - config.device_height * 0.3
    FloatyInstance.setFloatyText('查找任务')
    sleep(1000)
    let toFinishList = widgetUtils.widgetGetAll('\\s*去完成')
    if (!toFinishList || toFinishList.length <= 0) {
      logUtils.warnInfo(['无可完成任务'])
      signFailedUtil.recordFailedWidgets(this.taskCode, '每日任务')
      return
    }
    let anyFailed = false
    let firstTitle = null
    let toFinishBtn = toFinishList.filter(v => {
      try {
        // TODO 需要优化一下这块控件信息的判断 一旦结构变更就无法正确执行了
        let title = v.parent().parent().parent().child(0).child(0).child(1).text()
        logUtils.debugInfo(['读取任务标题为：{}', title])
        if (title && title.indexOf('视频') > -1) {
          return false
        }
        if (title && title.indexOf('15秒') > -1) {
          if (!firstTitle) {
            firstTitle = title
          }
          return true
        }
        return false
      } catch (e) {
        anyFailed = true
        logUtils.errorInfo('读取控件信息失败 可能控件信息又变了' + e)
        return false
      }
    })
    if (anyFailed) {
      signFailedUtil.recordFailedWidgets(this.taskCode, '任务控件信息')
    }
    if (toFinishBtn && toFinishBtn.length > 0) {
      toFinishBtn = toFinishBtn[0]
      debugInfo(['执行任务：{}', firstTitle])
    } else {
      FloatyInstance.setFloatyText('非浏览任务，请手动执行')
      sleep(1000)
      toFinishBtn = null
    }
    if (this.displayButtonAndClick(toFinishBtn, '去完成', null, true)) {
      widgetUtils.widgetWaiting('点击或滑动')
      let limit = 16
      while (limit-- > 0 && !this.captureAndCheckByOcr('返回领积分', '返回领积分', null, null, false, 1)) {
        FloatyInstance.setFloatyText('等待' + limit + '秒')
        automator.gestureDown(startY, endY)
        sleep(1000)
      }
      automator.back()
      sleep(1000)

      let tmp
      if ((tmp = currentPackage()) != _package_name) {
        warnInfo(['检测到当前包名{}不正确，重新打开积分签到界面', tmp])
        openSignPage()
        sleep(1000)
        widgetUtils.widgetWaiting('去完成', null, 2000)
      }
      return this.doTask()
    }
  }

  this.doBrowseTask = function () {
    let browser15 = widgetUtils.widgetGetOne('逛15秒赚3积分')
    if (widgetUtils.widgetCheck('.*点击或滑动以下内容.*', 3000) && this.displayButtonAndClick(browser15, '15秒任务')) {
      sleep(1000)
      let limit = 16
      while (limit-- > 0 && widgetUtils.widgetCheck('.*点击或滑动以下内容.*', 3000)) {
        FloatyInstance.setFloatyText('等待' + limit + '秒')
        automator.gestureDown(startY, endY)
        sleep(1000)
      }
    }
  }

  this.doExection = function () {
    FloatyInstance.setFloatyPosition(400, 400)
    FloatyInstance.setFloatyText('准备打开领取积分页面')
    this.openCreditPage()
    FloatyInstance.setFloatyText('准备领取积分')
    this.checkAndCollect()
  }

  this.exec = function () {
    this.doExection()
    FloatyInstance.setFloatyText('领取完毕')
    if (this.sign_success || commonFunctions.checkIsAliCreditsSigned()) {
      this.setExecuted()
    }
    commonFunctions.minimize(_package_name)
  }

  function openSignPage () {
    let url = 'alipays://platformapi/startapp?appId=20000067&url=https%3A%2F%2Frender.alipay.com%2Fp%2Fyuyan%2F180020380000000023%2Fpoint-sign-in.html%3FchInfo%3D&launchKey=3755a1a6-6b02-4508-8714-cd2d393b08e9-1704164626631'
    app.startActivity({
      action: 'android.intent.action.VIEW',
      data: url,
      packageName: 'com.eg.android.AlipayGphone'
    })
  }

}

CreditRunner.prototype = Object.create(BaseSignRunner.prototype)
CreditRunner.prototype.constructor = CreditRunner

module.exports = new CreditRunner()
