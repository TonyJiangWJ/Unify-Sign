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
// 日志打印 按需引用
let logUtils = singletonRequire('LogUtils')
let WarningFloaty = singletonRequire('WarningFloaty')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  let _package_name = 'com.eg.android.AlipayGphone'
  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // ...
    // 在这里写签到执行的代码
    // ...
    if (this.openCreditsPage()) {
      this.checkAndSign()
    } else {
      FloatyInstance.setFloatyText('进入签到页面失败')
      sleep(1000)
    }
    // 执行成功后触发 标记当前任务已完成 失败了请勿调用
    // this.setExecuted()
    commonFunctions.minimize()
  }

  /**
   * 打开积分签到页面
   */
  this.openCreditsPage = function () {
    commonFunctions.launchPackage(_package_name)
    sleep(500)
    if (config.is_alipay_locked) {
      alipayUnlocker.unlockAlipay()
      sleep(500)
    }

    app.startActivity({
      action: 'VIEW',
      data: 'alipays://platformapi/startapp?appId=60000081',
      packageName: _package_name
    })
    FloatyInstance.setFloatyText('查找 商家积分 控件')
    sleep(500)
    let creditEntry = widgetUtils.widgetGetOne('商家积分')
    if (this.displayButtonAndClick(creditEntry, '商家积分')) {
      return true
    }

    // FloatyInstance.setFloatyText('查找 商家服务 控件')
    // let entry = widgetUtils.widgetGetOne('商家服务')
    // if (this.displayButtonAndClick(entry, '商家服务')) {
    //   FloatyInstance.setFloatyText('查找 商家积分 控件')
    //   sleep(500)
    //   let creditEntry = widgetUtils.widgetGetOne('商家积分')
    //   if (this.displayButtonAndClick(creditEntry, '商家积分')) {
    //     return true
    //   }
    // }
    return false
  }

  /**
   * 执行签到
   */
  this.checkAndSign = function () {
    FloatyInstance.setFloatyText('查找今日签到控件')
    let signEntry = widgetUtils.widgetGetOne('今日签到领.*')
    if (this.displayButton(signEntry, '今日签到')) {
      let clickPoint = { x: signEntry.bounds().left, y: signEntry.bounds().bottom + signEntry.bounds().height() }
      logUtils.debugInfo(['点击位置：{}', JSON.stringify(clickPoint)])
      automator.click(clickPoint.x, clickPoint.y)
      sleep(1000)
      let region = [config.device_width / 2, config.device_height * 0.3, config.device_width / 2, config.device_height * 0.3]
      let targetContainer = widgetUtils.widgetGetById('am-tabs-bar-activeTab-content')
      if (targetContainer) {
        sleep(1000)
        widgetUtils.widgetGetById('am-tabs-bar-activeTab-content')
        let containerBounds = targetContainer.bounds()
        logUtils.debugInfo(['根据控件信息获取ocr识别区域'])
        region = [containerBounds.centerX(), containerBounds.top - 20, containerBounds.width() / 2, containerBounds.height()]
      }
      logUtils.debugInfo(['ocr识别区域：{}', JSON.stringify(region)])
      WarningFloaty.addRectangle('识别区域', region)
      sleep(1000)
      if (this.captureAndCheckByOcr('^领取$', '领取按钮', region, null, true, 3)) {
        this.setExecuted()
      } else {
        FloatyInstance.setFloatyText('未找到领取按钮')
      }
      WarningFloaty.clearAll()
      this.doTask()
    } else {
      FloatyInstance.setFloatyText('未找到签到入口，可能今天已经完成签到')
      this.findEntranceAndDoTask()
      // TODO 校验是否真实的完成了签到
      this.setExecuted()
    }
    sleep(500)
  }

  this.findEntranceAndDoTask = function () {
    FloatyInstance.setFloatyText('查找 领更多积分 入口')
    if (this.captureAndCheckByOcr('^领更多积分$', '任务入口', null, null, true, 3)) {
      sleep(1000)
      this.doTask()
    }
    FloatyInstance.setFloatyText('')
  }

  this.doTask = function (tryTime) {
    tryTime = tryTime || 1
    if (tryTime >= 10) {
      logUtils.errorInfo(['执行超过十次，估计死循环了 并没有那么多任务可以执行'])
      return
    }
    let startY = config.device_height - config.device_height * 0.15
    let endY = startY - config.device_height * 0.3
    FloatyInstance.setFloatyText('查找去浏览|去完成')
    let browserBtns = widgetUtils.widgetGetAll('去浏览|去完成') || []
    let findOne = false
    browserBtns = browserBtns.filter(btn => {
      if (btn.text() == '去浏览') {
        findOne = true
        return true
      }
      if (findOne) {
        return false
      }
      let btnContainer = btn.parent()
      let listContainer = btnContainer.parent()
      if (btnContainer.indexInParent() <= 1) {
        return false
      }
      let titleContainer = listContainer.child(btnContainer.indexInParent() - 1)
      let title = titleContainer.child(0).text()
      return title.indexOf('15秒') > -1
    })
    let browserBtn = null
    if (browserBtns.length > 0) {
      browserBtn = browserBtns[0]
    }
    if (this.displayButtonAndClick(browserBtn, '去浏览', null, true)) {
      widgetUtils.widgetWaiting('.*浏览15秒.*')
      let limit = 16
      while (limit-- > 0 && !widgetUtils.widgetCheck('任务已完成', 1000)) {
        automator.gestureDown(startY, endY)
        FloatyInstance.setFloatyText('继续等待' + limit + '秒')
        sleep(100)
      }
      automator.back()
      sleep(1000)
      this.doTask(tryTime + 1)
    }
    FloatyInstance.setFloatyText('没有更多浏览任务了')
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
