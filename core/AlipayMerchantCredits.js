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
  const DAILY_SIGNED = 'alimerchaint_DAILY_SIGNED'
  this.initStorages = function () {
    // 是否执行过签到
    this.signedStore = this.createStoreOperator(DAILY_SIGNED, { executed: false, count: 0 })
  }

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
    sleep(1500)
    let creditEntry = widgetUtils.widgetGetOne('商家积分')
    if (this.displayButtonAndClick(creditEntry, '商家积分')) {
      this.pushLog('检查是否有可领取积分')
      this.displayButtonAndClick(widgetUtils.widgetGetOne('一键领取', 2000))
      creditEntry = widgetUtils.widgetGetOne('每日签到')
      if (this.displayButtonAndClick(creditEntry, '每日签到')) {
        return true
      }
    }

    return false
  }

  this.checkDailySign = function () {
    let signed = this.captureAndCheckByOcr('已领取')
    if (this.displayButton(signed, '已领取')) {
      this.setExecuted()
    } else {
      FloatyInstance.setFloatyText('未找到已领取按钮')
    }

  }

  /**
   * 执行签到
   */
  this.checkAndSign = function () {
    FloatyInstance.setFloatyText('查找今日签到控件')
    let signEntry = this.captureAndCheckByOcr('今日签到领.*')
    if (this.displayButton(signEntry, '今日签到')) {
      let clickPoint = { x: signEntry.bounds().left, y: signEntry.bounds().bottom + signEntry.bounds().height() }
      logUtils.debugInfo(['点击位置：{}', JSON.stringify(clickPoint)])
      automator.click(clickPoint.x, clickPoint.y)
      sleep(1000)
      this.checkDailySign()
      WarningFloaty.clearAll()
      this.doTask()
    } else {
      FloatyInstance.setFloatyText('未找到签到入口，可能今天已经完成签到')
      this.checkDailySign()
      this.findEntranceAndDoTask()
      // TODO 校验是否真实的完成了签到
      // this.setExecuted()
    }
    sleep(500)
  }

  this.findEntranceAndDoTask = function () {
    this.doTask()
    this.pushLog('任务执行完毕，准备检查是否有可领取的积分')
    this.openCreditsPage()
  }

  this.doTask = function (tryTime) {
    tryTime = tryTime || 1
    if (tryTime >= 10) {
      logUtils.errorInfo(['执行超过十次，估计死循环了 并没有那么多任务可以执行'])
      return
    }
    sleep(3000)
    let targetButtons = widgetUtils.widgetGetAll('去浏览|去完成', 3000)
    let task = getFirstTaskInfo.call(this, targetButtons)
    if (task) {
      task.execute.call(this)
      sleep(1000)
      if (!widgetUtils.widgetGetOne('赚更多积分', 2000)) {
        // 重新打开签到页面
        this.openCreditsPage()
      }
      this.doTask(tryTime - 1)
    }
    let collectBtns = widgetUtils.widgetGetAll('领积分', 3000)
    if (collectBtns && collectBtns.length > 0) {
      this.pushLog('存在领积分按钮 执行领取')
      collectBtns.forEach(btn => btn.click())
    }
  }

  function getFirstTaskInfo (btnList) {
    if (!btnList || btnList.length < 0) {
      return null
    }
    let taskInfos = btnList.map(btn => {
      let title = btn.parent().child(btn.indexInParent() - 3).text()
      return { title: title, btn: btn }
    })
    const taskDefine = [
      // 商品橱窗 滑动15秒
      () => buildTask((taskInfo) => /商品橱窗/.test(taskInfo.title), function () {
        let startY = config.device_height - config.device_height * 0.15
        let endY = startY - config.device_height * 0.3
        let limit = 16
        this.replaceLastLog('等待任务完成16s')
        while (limit-- > 0 && !widgetUtils.widgetGetOne('任务已完成', 1000)) {
          automator.gestureDown(startY, endY)
          this.replaceLastLog('等待任务完成' + limit + 's')
        }
        automator.back()
      }),
      // 视频任务 直接等待 设置静音
      () => buildTask((taskInfo) => /视频/.test(taskInfo.title), function () {
        let currentVolume = device.getMusicVolume()
        device.setMusicVolume(0)
        let limit = 32
        this.pushLog('等待' + limit + 's')
        while (limit-- > 0) {
          this.replaceLastLog('等待' + limit + 's')
          sleep(1000)
        }
        this.pushLog('等待3秒 确保完成')
        sleep(3000)
        device.setMusicVolume(currentVolume)
        automator.back()
      }),
      // 需要滑动等待的任务
      () => buildTask((taskInfo) => /逛0元下单好物|红包会场/.test(taskInfo.title),
        function () {
          let startY = config.device_height - config.device_height * 0.15
          let endY = startY - config.device_height * 0.3
          let limit = 35
          this.pushLog('等待任务完成'+limit+'s')
          while (limit-- > 0 && (widgetUtils.widgetGetOne('浏览.*秒|逛一逛.*', 3000) || limit > 5)) {
            automator.gestureDown(startY, endY)
            this.replaceLastLog('等待任务完成' + limit + 's')
          }
          automator.back()
        }
      ),
      // 进入并等待即可的任务
      () => buildTask((taskInfo) => /游戏中心|逛运动走路线|借呗|逛信用卡|红包集卡抽|芝麻攒粒攻略|逛一逛领优惠|网商贷|逛一逛租赁专场|飞猪旅行/.test(taskInfo.title),
        function () {
          let limit = 35
          this.pushLog('等待任务完成'+limit+'s')
          while (limit-- > 0 && (widgetUtils.widgetGetOne('浏览.*秒|逛一逛.*', 3000) || limit > 5)) {
            this.replaceLastLog('等待任务完成' + limit + 's')
            sleep(1000)
          }
          automator.back()
        }
      ),
    ]
    for (let i = 0; i < taskDefine.length; i++) {
      let taskExecutor = taskDefine[i]()
      if (taskExecutor)
        return {
          execute: function () {
            let taskInfo = taskExecutor.taskInfo
            this.pushLog('执行任务：' + taskInfo.title)
            let target = this.ensureTargetInVisible(taskInfo.btn, [0, config.device_height * 0.2, config.device_width, config.device_height * 0.8],
              () => widgetUtils.widgetGetOne(taskInfo.title, 2000))
            if (this.displayButtonAndClick(target, '去完成')) {
              sleep(1000)
              taskExecutor.executor.call(this)
            }
          }
        }
    }

    this.pushLog('当前任务列表均未定义：' + JSON.stringify(taskInfos.map(taskInfo => taskInfo.title)))

    return null
    function buildTask (filter, executor) {
      let results = taskInfos.filter(taskInfo => filter(taskInfo))
      if (results.length > 0) {
        return {
          taskInfo: results[0],
          executor: executor,
        }
      }
      return null
    }
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
