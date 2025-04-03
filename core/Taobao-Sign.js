let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')
let localOcrUtil = require('../lib/LocalOcrUtil.js')
let signFailedUtil = singletonRequire('SignFailedUtil')
let logFloaty = singletonRequire('LogFloaty')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  const _this = this
  const _package_name = 'com.taobao.taobao'
  const storageHelper = new SignStorageHelper(this)
  this.initStorages = function () {
    storageHelper.initStorages()
  }

  BaseSignRunner.call(this)
  this.countdownLimitCounter = 0
  this.finishThisLoop = false
  this.browseAdCount = 0
  this.created_schedule = false
  this.startTime = null
  this.reopenTime = 0

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
    logFloaty.pushLog('检查是否有关闭按钮')
    let closeButton = widgetUtils.widgetGetOne('关闭按钮', 3000)
    if (closeButton) {
      this.displayButtonAndClick(closeButton, '找到了关闭按钮')
    } else {
      logFloaty.pushLog('未找到关闭按钮')
      FloatyInstance.setFloatyText('没有关闭确认弹框')
    }
    this.processGastureIfNeed()
  }

  this.openSignPage = function () {
    if (new Date().getTime() - this.startTime > 1000 * 10 * 60) {
      this.pushErrorLog('运行超时，需要退出当前签到')
      return false
    }
    this.processGastureIfNeed()
    let signBtn = this.displayButtonAndClick(widgetUtils.widgetGetOne('红包签到'), '找到了签到按钮')
    if (!signBtn) {
      this.processGastureIfNeed()
      if (this.captureAndCheckByOcr('我的淘宝', '我的淘宝', [config.device_width / 2, config.device_height * 0.8, config.device_width / 2, config.device_height * 0.2], 1000, true, 3)) {
        signBtn = this.displayButtonAndClick(widgetUtils.widgetGetOne('签到领现金'), '找到了签领现金按钮')
      }
    } 
    if (signBtn) {
      if (widgetUtils.widgetCheck('我的心愿', 3000)) {
        this.pushLog('当前是淘宝活动界面，再次寻找入口')
        signBtn = this.displayButtonAndClick(widgetUtils.widgetGetOne('红包签到'), '找到了红包签到按钮')
      }
    }
    return !!signBtn
  }

  this.checkAndCollect = function () {
    if (this.openSignPage()) {
      widgetUtils.widgetWaiting('赚元宝', null, 2000)
      sleep(1000)
      this.processGastureIfNeed()
      this.checkDailySign()
      this.checkCountdownBtn(true)
      this.browseAds()
      if (this.signed) {
        this.setExecuted()
      } else {
        // 可能有问题 直接杀死淘宝
        commonFunctions.killCurrentApp()
      }
      // 签到是成功了，但是未主动设置定时任务，估计有问题
      if (!this.created_schedule) {
        if (!storageHelper.checkIsCountdownExecuted()) {
          logUtils.warnInfo(['今日未创建过定时任务，直接设置五分钟后的执行计划'])
          this.createNextSchedule(this.taskCode, new Date().getTime() + 300000)
        } else if (this.has_countdown_widget) {
          logUtils.warnInfo(['有倒计时控件，但是未能正确识别倒计时时间，直接设置5分钟后的执行计划'])
          this.createNextSchedule(this.taskCode, new Date().getTime() + 300000)
        }
      }
    } else {
      logUtils.warnInfo(['未能打开签到界面'])
    }
  }

  this.checkDailySign = function () {
    if (commonFunctions.checkIsTaobaoSigned()) {
      FloatyInstance.setFloatyText('今日已完成签到')
      this.signed = true
      return
    }
    sleep(1000)
    this.processGastureIfNeed()
    let screen = commonFunctions.captureScreen()
    if (screen && localOcrUtil.enabled) {
      let find = localOcrUtil.recognizeWithBounds(screen, null, '.*立即签到.*')
      if (find && find.length > 0) {
        let bounds = find[0].bounds
        FloatyInstance.setFloatyInfo(this.boundsToPosition(bounds), '立即签到')
        sleep(1000)
        automator.click(bounds.centerX(), bounds.centerY())
        sleep(1000)
        find = widgetUtils.widgetGetOne('.*继续领(现金|钱).*')
        if (find) {
          FloatyInstance.setFloatyInfo(this.boundsToPosition(find.bounds()), '继续领现金')
          this.signed = true
          // 找到了继续领现金才能确保确实已签到
          commonFunctions.setTaobaoSigned()
        }
      } else {
        FloatyInstance.setFloatyText('未找到立即签到，查找继续领现金')
        sleep(1000)
        find = widgetUtils.widgetGetOne('.*继续领(现金|钱).*')
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
            signFailedUtil.recordFailedScreen(screen, this.taskCode, '签到')
          }
          sleep(1000)
        }
      }
    } else {
      logUtils.warnInfo(['获取截图失败或不支持OCR 暂未实现 相应签到逻辑'])
    }
  }

  /**
   * 
   * @param {string} targetText 目标文本
   * @param {Array} b 目标区域，bounds信息，left,top,right,bottom
   * @returns 
   */
  function findByWidgetOrOcr (targetText, b) {
    let region = null
    if (b && b.length == 4) {
      region = [b[0], b[1], b[2] - b[0], b[3] - b[1]]
    }
    let find = widgetUtils.widgetGetOne(targetText, 3000, null, null, (() => { if (b) { return m => m.boundsInside(b[0], b[1], b[2], b[3]) } else { return null } })())
    if (find) {
      return find
    }
    let screen = commonFunctions.captureScreen()
    if (screen && localOcrUtil.enabled) {
      find = localOcrUtil.recognizeWithBounds(screen, region, targetText)
      if (find && find.length > 0) {
        return { bounds: () => find[0].bounds, target: find[0], content: find[0].label }
      }
    }
    return null
  }

  this.checkCountdownBtn = function (waitForNext) {
    if (this.countdownLimitCounter > 4) {
      logUtils.warnInfo(['可能界面有弹窗导致卡死，直接返回并创建五分钟后的定时启动'])
      this.createNextSchedule(this.taskCode, new Date().getTime() + 300 * 1000)
      this.created_schedule = true
      this.finishThisLoop = true
      return
    }
    FloatyInstance.setFloatyText('查找是否存在 click collect')
    let awardCountdown = findByWidgetOrOcr('点击.*取', [config.device_width / 2, config.device_height * 0.1, config.device_width, config.device_height * 0.6])
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
      FloatyInstance.setFloatyInfo({ x: config.device_width / 2, y: config.device_height / 2 }, '查找是否存在 倒计时')
      this.has_countdown_widget = false
      let countdown = widgetUtils.widgetGetOne('倒计时', null, true, null, m => m.boundsInside(config.device_width / 2, config.device_height * 0.1, config.device_width, config.device_height * 0.6))
      let totalSeconds = null
      if (countdown) {
        this.has_countdown_widget = true
        FloatyInstance.setFloatyText(' ')
        sleep(100)
        storageHelper.saveCountdownRegion(this.boundsToRegion(countdown.bounds))
        totalSeconds = ocrChecking(this.boundsToRegion(countdown.bounds), 1)
      } else {
        totalSeconds = ocrChecking(storageHelper.getCountdownRegion() || [config.device_width / 2, config.device_height * 0.2, config.device_width / 2, config.device_height * 0.4], 1)
      }
      if (totalSeconds) {
        let position = countdown ? this.boundsToPosition(countdown.target.bounds()) : null
        if (position) {
          position.x -= 200
        }
        FloatyInstance.setFloatyInfo(position, '计算倒计时' + totalSeconds + '秒')
        if (waitForNext) {
          if (totalSeconds < 60) {
            commonFunctions.commonDelay(totalSeconds / 60, '等待元宝')
            this.checkCountdownBtn(true)
          } else {
            this.createNextSchedule(this.taskCode, new Date().getTime() + totalSeconds * 1000)
            this.created_schedule = true
            storageHelper.incrCountdown(true)
          }
        }
        sleep(1000)
      } else {
        if (checkEnded(storageHelper.getCountdownRegion() || [config.device_width / 2, config.device_height * 0.2, config.device_width / 2, config.device_height * 0.4])) {
          this.created_schedule = true
          this.pushLog('今日倒计时领取已结束，明日再来')
          return
        }
        logUtils.errorInfo(['OCR识别倒计时数据失败'])
        signFailedUtil.recordFailedScreen(commonFunctions.checkCaptureScreenPermission(), this.taskCode, '倒计时识别')
      }
    }
  }


  function ocrChecking (countdownRegion, tryTime) {
    tryTime = tryTime || 1
    let screen = commonFunctions.checkCaptureScreenPermission()
    let contents = localOcrUtil.recognizeWithBounds(screen, countdownRegion, /^\D*((\d+:){2}\d+)\D*$/)
    logUtils.debugInfo(['ocr识别文本信息：{}', JSON.stringify(contents)])
    let regex = /^\D*((\d+:){2}\d+)\D*$/
    if (contents && contents.length > 0 && regex.test(contents[0].label)) {
      let text = regex.exec(contents[0].label)[1]
      regex = /(\d+(:?))/g
      let totalNums = []
      let find = null
      while ((find = regex.exec(text)) != null) {
        totalNums.push(parseInt(find[1]))
      }
      let i = 0
      return totalNums.reverse().reduce((a, b) => { a += b * Math.pow(60, i++); return a }, 0)
    }
    if (tryTime <= 3) {
      sleep(1000)
      logUtils.warnInfo(['ocr识别失败，尝试再次识别'])
      return ocrChecking(countdownRegion, tryTime + 1)
    }
    return null
  }

  function checkEnded (countdownRegion) {
    let screen = commonFunctions.checkCaptureScreenPermission()
    let contents = localOcrUtil.recognizeWithBounds(screen, countdownRegion, /明日再来/)
    logUtils.debugInfo(['ocr识别文本信息：{}', JSON.stringify(contents)])
    if (contents && contents.length > 0) {
      return true
    }
    return false
  }

  this.browseAds = function (memo) {
    memo = memo || {}
    sleep(1000)
    let entry = widgetUtils.widgetGetOne('赚元宝', 2000)
    if (this.displayButtonAndClick(entry, '赚元宝')) {
      sleep(1000)
      let taskList = [
        hangBrowse, doSearch, watchVideo,
        browseGoods, dailyMoney, hangSeckill, orderWithdraw, hangSaveMoney,
        // 构建通用方法
        this.buildCommonMemoTask('购物返现金', '购物返.*现金.*0/1.*', 'purchaseWithdraw')
      ]
      // 遍历所有可操作任务
      for (let i = 0; i < taskList.length; i++) {
        if (taskList[i].apply(this, [memo])) {
          return this.browseAds(memo)
        }
      }
      this.pushLog('已完成所有可完成任务')
      this.displayButtonAndClick(className('android.widget.Button').textContains('关闭').findOne(1000))
    } else {
      this.reopenTime += 1
      if (this.reopenTime > 5) {
        this.pushErrorLog('重新打开签到界面失败多次，退出执行')
      }
      this.pushLog('无法找到赚元宝 可能界面不正常 重新打开')
      commonFunctions.minimize()
      this.launchTaobao()
      if (this.openSignPage()) {
        this.browseAds(memo)
      } else {
        this.pushErrorLog('重新打开签到界面失败，退出执行')
      }
    }
  }

  this.wrapLoopTask = function (memo, desc, callback, key) {
    if (memo[key]) {
      return false
    }
    this.pushLog('查找是否存在任务：' + desc)
    if (callback()) {
      return true
    }
    memo[key] = true
    this.pushLog('未找到任务：' + desc)
    return false
  }

  this.buildCommonMemoTask = function (desc, title, key) {
    return (memo) => this.wrapLoopTask(memo, desc, () => this.buildCommonWaitingTask(title), key)
  }

  function clickTargetWithA11y (container, targetGetter) {
    if (!container) {
      return false
    }
    try {
      let target = targetGetter()
      if (target) {
        return target.click()
      } else {
        logUtils.warnInfo(['目标控件不存在'])
        return false
      }
    } catch (e) {
      logUtils.errorInfo(['提取目标控件异常' + e])
      return false
    }
  }

  this.buildCommonWaitingTask = function (title) {
    let entryTitle = widgetUtils.widgetGetOne(title, 2000)
    if (clickTargetWithA11y(entryTitle, () => entryTitle.parent().parent().child(1))) {
      let limit = 32
      while (limit-- > 0) {
        if (widgetUtils.widgetGetOne('任务完成', 1000)) {
          this.pushLog('找到了任务完成')
          break
        }
        this.replaceLastLog('等待任务完成' + (limit) + 's')
      }
      automator.back()
      return true
    }
    return false
  }

  function hangBrowse (memo) {
    return this.wrapLoopTask(memo, '去逛逛', () => {
      let hangout = widgetUtils.widgetGetOne('去逛逛')
      if (this.displayButtonAndClick(hangout, '去逛逛')) {
        sleep(1000)
        this.doBrowsing()
        this.browseAdCount++
        sleep(1000)
        automator.back()
        return true
      }
      return false
    }, 'hangDone')
  }

  function doSearch (memo) {
    return this.wrapLoopTask(memo, '去搜索', () => {
      let searchBtn = widgetUtils.widgetGetOne('去搜索')
      if (this.displayButtonAndClick(searchBtn, '去搜索')) {
        sleep(1000)
        let root = widgetUtils.widgetGetOne('搜索发现', 1000)
        if (root) {
          let firstContainer = root.parent()
          let firstTarget = widgetUtils.subWidgetGetOne(firstContainer, '.+', 2000, false, matcher => {
            return matcher.clickable().filter(node => {
              let content = node.desc() || node.text()
              return content.indexOf('搜索发现') < 0
            })
          })
          if (!this.displayButtonAndClick(firstTarget, '第一个搜索词')) {
            back()
            this.pushErrorLog('查找搜索词失败')
            if (!widgetUtils.widgetGetOne('赚元宝', 2000)) {
              back()
            }
            return false
          } else {
            logUtils.debugInfo(['控件内容：{}', firstTarget.desc() || firstTarget.text()])
          }
          logUtils.debugInfo('点击了第一个搜索词')
          if (widgetUtils.widgetGetOne('浏览本页面.*', 1000)) {
            logUtils.debugInfo(['当前控件信息检测为浏览本页面直到控件消失结束'])
            this.doBrowsing('浏览本页面.*')
          } else {
            logUtils.debugInfo(['当前控件信息检测为浏览本页面直到出现任务已完成'])
            let limit = 15
            while (!widgetUtils.widgetGetOne('.*任务已完成.*', 1000) && limit-- > 0) {
              automator.gestureDown()
              sleep(1000)
            }
          }
          logUtils.debugInfo('任务完成')
          back()
          sleep(100)
          back()
          return true
        } else {
          back()
          this.pushLog('无法找到 搜索发现 无法执行搜索任务')
          logUtils.warnInfo('未能找到 搜索发现')
          if (!widgetUtils.widgetGetOne('赚元宝', 2000)) {
            back()
          }
          return false
        }
      }
    }, 'searchDone')
  }

  function watchVideo (memo) {
    return this.wrapLoopTask(memo, '好物沉浸看', () => this.buildCommonWaitingTask('好物沉浸看.*0/1.*'), 'watchVideoAdDone')
  }

  function browseGoods (memo) {
    return this.wrapLoopTask(memo, '逛精选好物', () => {
      let entryTitle = widgetUtils.widgetGetOne('逛精选好货.*[012]/3.*', 2009)
      if (this.displayButtonAndClick(entryTitle)) {
        this.doBrowsing('滑动浏览.*')
        sleep(1000)
        automator.back()
        return true
      }
      return false
    }, 'browseGoodsDone')
  }

  function dailyMoney (memo) {
    return this.wrapLoopTask(memo, '天天领钱', () => this.buildCommonWaitingTask('去天天领钱.*0/1.*'), 'dailyMoney')
  }

  function hangSeckill (memo) {
    return this.wrapLoopTask(memo, '逛淘宝秒杀', () => this.buildCommonWaitingTask('逛淘宝秒杀.*0/1.*'), 'hangSeckill')
  }

  function orderWithdraw (memo) {
    return this.wrapLoopTask(memo, '下单立即提现', () => this.buildCommonWaitingTask('下单立即提现.*0/1.*'), 'orderWithdraw')
  }

  function hangSaveMoney (memo) {
    return this.wrapLoopTask(memo, '逛省钱包', () => this.buildCommonWaitingTask('逛省钱包.*0/1.*'), 'hangSaveMoney')
  }

  this.doSearching = function () {
    if (widgetUtils.idWaiting('com.taobao.taobao:id/dynamic_container')) {
      FloatyInstance.setFloatyText('查找搜索发现')
      let countDown = new java.util.concurrent.CountDownLatch(1)
      let searchIcon = null
      threads.start(function () {
        searchIcon = selector().className('android.view.View').boundsInside(0, 0, 0.8 * config.device_width, 0.7 * config.device_height).untilFind()
        countDown.countDown()
      })
      countDown.await(5, java.util.concurrent.TimeUnit.SECONDS)
      if (searchIcon && searchIcon.length > 1 && (searchIcon = searchIcon[1])) {
        this.displayButtonAndClick(searchIcon, '推荐商品')
        sleep(1000)
        this.doBrowsing('浏览本页面.*')
        sleep(1000)
        automator.back()
      } else {
        FloatyInstance.setFloatyText('未找到推荐商品')
        logUtils.errorInfo(['未找到推荐商品控件，自动搜索失败'])
        signFailedUtil.recordFailedScreen(commonFunctions.checkCaptureScreenPermission(), this.taskCode, '搜索任务')
        this.search_no_more = true
      }
      automator.back()
    }
    sleep(1000)
    automator.back()
  }

  this.doBrowsing = function (content, timeoutSeconds) {
    let startY = config.device_height - config.device_height * 0.15
    let endY = startY - config.device_height * 0.3
    automator.gestureDown(startY, endY)
    let start = new Date().getTime()
    let cost = null
    while ((cost = new Date().getTime() - start) < (timeoutSeconds || 16) * 1000 || widgetUtils.widgetWaiting(content || '滑动浏览', null, 5000) && cost < 40000) {
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
    this.startTime = new Date().getTime()
    this.launchTaobao(_package_name)
    sleep(1000)
    this.checkAndCollect()
    sleep(1000)
    commonFunctions.minimize(_package_name)
  }

  this.processGastureIfNeed = function () {
    let tips = widgetUtils.widgetGetOne('.*完成验证.*', 1000)
    if (tips) {
      this.pushLog('存在滑动验证码')
      let slider = widgetUtils.widgetGetOne('滑块')
      if (!slider) {
        this.pushErrorLog('未能找到滑块位置')
        warnInfo(['未能找到滑块位置'], true)
        return
      }
      let start = {
        x: slider.bounds().left + 10,
        y: slider.bounds().centerY()
      }
      let end = {
        x: config.device_width - 10,
        y: slider.bounds().bottom - 10
      }
      automator.gesturePath(start, end, 1000)
      this.pushLog('手势执行完毕,等待验证结束')
      sleep(2000)
    }
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner

module.exports = new SignRunner()


// ---
function SignStorageHelper (runner) {
  const HANG_WORK_DONE = "TB_HANG_WORK_DONE"
  const COUNTDOWN_CHECKING = "TB_COUNTDOWN_CHECKING"
  const COUNTDOWN_REGION = "TB_COUNTDOWN_REGION"
  this.initStorages = function () {
    // 逛一逛任务是否完成
    this.hangStore = runner.createStoreOperator(HANG_WORK_DONE, { executed: false, count: 0 })
    // 是否执行过倒计时
    this.countdownStore = runner.createStoreOperator(COUNTDOWN_CHECKING, { executed: false, count: 0 })
    // 存储倒计时识别区域
    this.countdownRegionStore = runner.createStoreOperator(COUNTDOWN_REGION, {}, true)
  }

  this.isHangTaskDone = function () {
    return this.hangStore.getValue().executed
  }

  this.incrHangTask = function () {
    this.hangStore.updateStorageValue(storeValue => storeValue.count += 1)
  }

  this.isHangTooMuch = function () {
    this.incrHangTask()
    if (this.hangStore.getValue().count >= 10) {
      logUtils.warnInfo(['逛一逛任务执行超过10次，应该是出问题了，直接跳过并设置为已完成'])
      this.setHangTaskDone()
    }
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
    logUtils.debugInfo(['当前倒计时执行次数：{}', executeInfo.count])
    // 假定倒计时设置次数，最少3次
    if (executeInfo.count >= 3) {
      return true
    }
    return false
  }

  this.getCountdownRegion = function () {
    return this.countdownRegionStore.getValue().region
  }

  this.saveCountdownRegion = function (region) {
    logUtils.debugInfo(['存储倒计时区域：{}', JSON.stringify(region)])
    this.countdownRegionStore.updateStorageValue(storageValue => storageValue.region = region)
  }

}