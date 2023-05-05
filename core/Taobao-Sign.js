let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {

  const _package_name = 'com.taobao.taobao'
  const storageHelper = new SignStorageHelper(this)
  this.initStorages = function () {
    storageHelper.initStorages()
  }

  BaseSignRunner.call(this)
  this.countdownLimitCounter = 0
  this.finishThisLoop = false

  this.launchTaobao = function () {
    app.launch(_package_name)
    sleep(500)
    FloatyInstance.setFloatyText('校验是否有打开确认弹框')
    let confirm = widgetUtils.widgetGetOne(/^打开|允许$/, 3000)
    if (confirm) {
      this.displayButtonAndClick(confirm, '找到了打开按钮')
    } else {
      FloatyInstance.setFloatyText('没有打开确认弹框')
    }
  }

  this.checkAndCollect = function () {
    let signBtn = this.displayButtonAndClick(widgetUtils.widgetGetOne('签到'), '找到了签到按钮')
    if (signBtn) {
      widgetUtils.widgetWaiting('去赚元宝')
      sleep(1000)
      this.checkDailySign()
      this.browseAds()
      if (this.signed) {
        this.setExecuted()
      }
      // 签到是成功了，但是未主动设置定时任务，估计有问题
      if (!storageHelper.checkIsCountdownExecuted()) {
        warnInfo(['今日未创建过定时任务，直接设置五分钟后的执行计划'])
        this.createNextSchedule(this.taskCode, new Date().getTime() + 300000)
        storageHelper.incrCountdown()
      }
    } else {
      logUtils.warnInfo(['未找到签到按钮'])
    }
  }

  this.checkDailySign = function () {
    if (commonFunctions.checkIsTaobaoSigned()) {
      FloatyInstance.setFloatyText('今日已完成签到')
      this.signed = true
      return
    }
    sleep(1000)
    let screen = commonFunctions.captureScreen()
    if (screen && localOcrUtil.enabled) {
      let find = localOcrUtil.recognizeWithBounds(screen, null, '.*立即签到.*')
      if (find && find.length > 0) {
        let bounds = find[0].bounds
        FloatyInstance.setFloatyInfo(this.boundsToPosition(bounds), '立即签到')
        sleep(1000)
        automator.click(bounds.centerX(), bounds.centerY())
        sleep(1000)
        find = widgetUtils.widgetGetOne('.*继续领现金.*')
        if (find) {
          FloatyInstance.setFloatyInfo(this.boundsToPosition(find.bounds()), '继续领现金')
          this.signed = true
          // 找到了继续领现金才能确保确实已签到
          commonFunctions.setTaobaoSigned()
        }
      } else {
        FloatyInstance.setFloatyText('未找到立即签到，查找继续领现金')
        sleep(1000)
        find = widgetUtils.widgetGetOne('.*继续领现金.*')
        if (find) {
          FloatyInstance.setFloatyInfo(this.boundsToPosition(find.bounds()), '继续领现金')
          this.signed = true
          // 找到了继续领现金才能确保确实已签到
          commonFunctions.setTaobaoSigned()
        } else {
          if (commonFunctions.checkTaobaoFailedCount() > 3) {
            FloatyInstance.setFloatyText('查找继续领现金失败多次，标记为签到成功')
            logUtils.warnInfo(['寻找 继续领现金 失败多次，直接标记为成功，请确认是否已经正常签到'], true)
            this.signed = true
          } else {
            FloatyInstance.setFloatyText('未找到继续领现金，签到失败')
            commonFunctions.increaseTbFailedCount()
          }
          sleep(1000)
        }
      }
    } else {
      warnInfo(['获取截图失败或不支持OCR 暂未实现 相应签到逻辑'])
    }
  }

  this.checkCountdownBtn = function (waitForNext) {
    if (this.countdownLimitCounter > 4) {
      logUtils.warnInfo(['可能界面有弹窗导致卡死，直接返回并创建五分钟后的定时启动'])
      this.createNextSchedule(this.taskCode, new Date().getTime() + 300 * 1000)
      this.finishThisLoop = true
      return
    }
    let awardCountdown = widgetUtils.widgetGetOne('点击领取', null, null, null, m => m.boundsInside(config.device_width / 2, 0, config.device_width, config.device_height * 0.4))
    if (awardCountdown) {
      this.displayButton(awardCountdown, '可以领')
      automator.clickCenter(awardCountdown)
      sleep(1000)
      if (this.closeDialogIfPossible()) {
        logUtils.debugInfo(['通过弹窗浏览广告'])
      }
      this.countdownLimitCounter++
      this.checkCountdownBtn(waitForNext)
    } else {
      let countdown = widgetUtils.widgetGetOne(/((\d+:){2}\d+$)/, null, true, null, m => m.boundsInside(config.device_width / 2, 0, config.device_width, config.device_height * 0.4))
      if (countdown) {
        FloatyInstance.setFloatyInfo(this.boundsToPosition(countdown.target.bounds()), '剩余时间：' + countdown.content)
        sleep(1000)
        let regex = /((\d+(:?)){1,3})/
        let text = countdown.content
        if (regex.test(text)) {
          text = regex.exec(text)[1]
          regex = /(\d+(:?))/g
          let totalNums = []
          let find = null
          while ((find = regex.exec(text)) != null) {
            totalNums.push(parseInt(find[1]))
          }
          let i = 0
          let totalSeconds = totalNums.reverse().reduce((a, b) => { a += b * Math.pow(60, i++); return a }, 0)
          FloatyInstance.setFloatyInfo(this.boundsToPosition(countdown.target.bounds()), '计算倒计时' + totalSeconds + '秒')
          if (waitForNext) {
            if (totalSeconds < 60) {
              commonFunctions.commonDelay(totalSeconds / 60, '等待元宝')
              this.checkCountdownBtn(true)
            } else {
              this.createNextSchedule(this.taskCode, new Date().getTime() + totalSeconds * 1000)
              storageHelper.incrCountdown(true)
            }
          }
          sleep(1000)
        }
      }
    }

  }

  this.browseAds = function () {
    sleep(1000)
    if (storageHelper.isHangTaskDone()) {
      this.checkCountdownBtn(true)
    } else {
      let moreCoins = widgetUtils.widgetGetOne('\\+\\d{4}', null, true, null, m => m.boundsInside(0, 0, config.device_width / 2, config.device_height * 0.5))
      if (moreCoins) {
        this.checkCountdownBtn()
        if (this.finishThisLoop) {
          return
        }
        this.displayButtonAndClick(moreCoins.target, moreCoins.content)
        sleep(1000)
        sleep(1000)
        let hangout = widgetUtils.widgetGetOne('去逛逛')
        let noMore = false
        if (this.displayButtonAndClick(hangout, '去逛逛')) {
          sleep(1000)
          this.doBrowsing()
          sleep(1000)
          automator.back()
        } else {
          logUtils.warnInfo(['未找到去逛逛 可能已经完成了'])
          let searchBtn = widgetUtils.widgetGetOne('去搜索')
          if (this.displayButtonAndClick(searchBtn, '去搜索')) {
            this.doSearching()
          } else {
            let finished = widgetUtils.widgetGetOne('已完成')
            // 点进去 然后返回
            if (this.displayButtonAndClick(finished, '已完成')) {
              noMore = true
              sleep(1000)
              automator.back()
              storageHelper.setHangTaskDone()
            }
          }
        }
        sleep(1000)
        if (this.closeDialogIfPossible()) {
          logUtils.debugInfo(['已经通过弹窗浏览广告'])
        }
        this.checkCountdownBtn(true)
        sleep(1000)
        if (!noMore && !this.finishThisLoop) {
          this.browseAds()
        }
      }
    }
  }

  this.doSearching = function () {
    if (widgetUtils.idWaiting('com.taobao.taobao:id/dynamic_container')) {
      FloatyInstance.setFloatyText('查找推荐商品')
      let countDown = new java.util.concurrent.CountDownLatch(1)
      let searchIcon = null
      threads.start(function() {
        searchIcon = selector().clickable().className('android.view.View').boundsInside(0, 0, 0.8 * config.device_width, 0.7 * config.device_height).untilFind()
        countDown.countDown()
      })
      countDown.await(5, java.util.concurrent.TimeUnit.SECONDS)
      if (searchIcon && searchIcon.length > 1 && (searchIcon = searchIcon[1])) {
        this.displayButtonAndClick(searchIcon, '推荐商品')
        sleep(1000)
        this.doBrowsing('浏览本页面.*')
        sleep(1000)
      } else {
        FloatyInstance.setFloatyText('未找到推荐商品')
      }
      automator.back()
    }
    sleep(1000)
    automator.back()
  }

  this.doBrowsing = function (content) {
    let startY = config.device_height - config.device_height * 0.15
    let endY = startY - config.device_height * 0.3
    automator.gestureDown(startY, endY)
    let start = new Date().getTime()
    while (widgetUtils.widgetWaiting(content || '滑动浏览', null, 5000) && new Date().getTime() - start < 40000) {
      sleep(4000)
      automator.gestureDown(startY, endY)
    }
    FloatyInstance.setFloatyText('浏览完成')
  }



  this.closeDialogIfPossible = function () {
    let toUse = widgetUtils.alternativeWidget('去使用', '立即领\\d+元宝', 3000, true)
    if (toUse.value == 1) {
      automator.clickCenter(toUse.target)
      sleep(3000)
    } else if (toUse.value == 2) {
      automator.clickCenter(toUse.target)
      sleep(1000)
      this.doBrowsing()
      automator.back()
      sleep(1000)
      this.closeDialogIfPossible()
      return true
    }
    return false
  }

  this.exec = function () {
    this.launchTaobao(_package_name)
    sleep(1000)
    this.checkAndCollect()
    sleep(1000)
    commonFunctions.minimize(_package_name)
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner

module.exports = new SignRunner()


// ---
function SignStorageHelper (runner) {
  const HANG_WORK_DONE = "TB_HANG_WORK_DONE"
  const COUNTDOWN_CHECKING = "TB_COUNTDOWN_CHECKING"
  this.initStorages = function () {
    // 逛一逛任务是否完成
    this.hangStore = runner.createStoreOperator(HANG_WORK_DONE, { executed: false, count: 0 })
    // 是否执行过倒计时
    this.countdownStore = runner.createStoreOperator(COUNTDOWN_CHECKING, { executed: false, count: 0 })
  }

  this.isHangTaskDone = function () {
    return this.hangStore.getValue().executed
  }

  this.incrHangTask = function () {
    this.hangStore.updateStorageValue(storeValue => storeValue.count += 1)
  }

  this.setHangTaskDone = function () {
    this.hangStore.updateStorageValue(storeValue => storeValue.executed = true)
  }

  /**
   * 增加倒计时的执行次数
   * @param {boolean} realExecuted 是否真实的运行过
   */
  this.incrCountdown = function (realExecuted) {
    this.countdownStore.updateStorageValue(value => {
      value.count += 1
      if (realExecuted) {
        value.executed = true
      }
    })
  }

  this.checkIsCountdownExecuted = function () {
    let executeInfo = this.countdownStore.getValue()
    if (executeInfo.executed || executeInfo.count >= 3) {
      return true
    }
    return false
  }

}