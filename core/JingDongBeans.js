
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)

let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')
let signFailedUtil = singletonRequire('SignFailedUtil')
let YoloTrainHelper = singletonRequire('YoloTrainHelper')

let BaseSignRunner = require('./BaseSignRunner.js')
function BeanCollector () {
  let _this = this
  this.initStorages = function () {
    this.dailyTaskStorage = this.createStoreOperator('jingdong_daily_task', { executed: false })
  }
  BaseSignRunner.call(this)
  const _package_name = 'com.jingdong.app.mall'
  const jingdongConfig = config.jingdong_config
  this.retryTime = 0
  this.subTasks = config.supported_signs.filter(task => task.taskCode === 'JingDong')[0].subTasks || [
    {
      taskCode: 'beanSign',
      taskName: '签到',
      enabled: true,
    },
    {
      taskCode: 'doubleSign',
      taskName: '双签领豆',
      enabled: false,
    },
    {
      taskCode: 'plantBean',
      taskName: '种豆得豆',
      enabled: true,
    }
  ]
  const SIGN = this.subTasks.filter(task => task.taskCode == 'beanSign')[0]
  const BEAN = this.subTasks.filter(task => task.taskCode == 'plantBean')[0]
  const DOUBLE_SIGN = this.subTasks.filter(task => task.taskCode == 'doubleSign')[0]

  /***********************
   * 综合操作
   ***********************/

  /**
   * 通过URL进入签到页面
   */
  function openSignPage (retry) {
    app.launchPackage(_package_name)
    if (openMine()) {
      let signEntry = widgetUtils.widgetGetOne('签到领豆')
      if (signEntry) {
        return _this.displayButtonAndClick(signEntry, '签到领豆')
      }
    } else {
      if (retry) {
        logUtils.errorInfo('无法找到 我的 无法执行签到任务')
        return false
      }
      logUtils.warnInfo(['无法找到指定控件 我的'])
      commonFunctions.killCurrentApp()
      return openSignPage(true)
    }
    return false
  }

  function openMine () {
    if (commonFunctions.myCurrentPackage() != _package_name) {
      app.launchPackage(_package_name)
      _this.pushLog('打开京东APP')
      sleep(2000)
    }
    if (widgetUtils.widgetWaiting('我的')) {
      let myWidget = widgetUtils.widgetGetOne('我的')
      automator.clickCenter(myWidget)
      return true
    }
    return false
  }

  function openPlant () {
    if (openMine()) {
      sleep(2000)
      let plantEntry = widgetUtils.widgetGetOne('种豆得豆')
      return _this.displayButtonAndClick(plantEntry, '种豆得豆')
    } else {
      _this.pushLog('打开失败')
    }
    return false
  }

  function verifySignOpened (timeout) {
    let verifyWidget = widgetUtils.widgetCheck('京东秒杀', timeout || 2000)
    if (verifyWidget) {
      logUtils.debugInfo(['找到京东秒杀控件，签到页面已打开 等待3秒 以确保页面加载完成'])
      sleep(3000)
      return true
    }
    return false
  }
  /**
   * 执行签到
   * @returns 
   */
  this.execDailySign = function () {
    if (this.isSubTaskExecuted(SIGN)) {
      return true
    }

    openSignPage()
    this.awaitAndSkip()
    if (verifySignOpened()) {
      // 等待加载动画
      sleep(1000)
      this.closePopup()

      this.checkBrowserResult()
      this.pushLog('检查是否有签到按钮或已完成签到')
      YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '签到页面', 'jingdong_sign', config.save_yolo_jingdong)
      let signBtn = widgetUtils.widgetGetOne('签到领豆')
      if (this.displayButtonAndClick(signBtn, '签到按钮')) {
        logUtils.debugInfo(['点击了签到按钮'])
        clicked = true
      } else {
        let region = [0, 0, config.device_width, config.device_height * 0.5]
        if (this.captureAndCheckByOcr('签到领豆', '领取按钮', region, null, true, 3)) {
          this.pushLog('OCR找到签到按钮：签到领豆')
          clicked = true
        } else {
          this.pushLog('未找到签到按钮 使用坐标点击')
          warnInfo('坐标点击签到不稳定，界面容易变化，请时刻注意坐标是否准确，否则可能导致签到失败。如果坐标不正确请在设置中修改坐标', true)
          FloatyInstance.setFloatyInfo({ x: jingdongConfig.sign_posi_x, y: jingdongConfig.sign_posi_y }, '坐标点击签到')
          sleep(1000)
          automator.click(jingdongConfig.sign_posi_x, jingdongConfig.sign_posi_y)
          clicked = true
        }
      }

      if (clicked) {
        // 二次校验是否正确签到
        checking = widgetUtils.widgetCheck('.*连签\\d+天', 1000)
        YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '签到执行后', 'jingdong_sign', config.save_yolo_jingdong)
        if (checking) {
          this.setSubTaskExecuted(SIGN)
          this.pushLog('二次校验，签到完成')
        } else {
          this.pushLog('二次校验失败，签到未完成')
        }
      } else {
        YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '未找到签到按钮', 'jingdong_sign', config.save_yolo_jingdong)
      }

      // 浏览商品
      this.browserGoods()

      back()
    }
  }

  this.browserGoods = function () {
    if (this.checkBrowserDone()) {
      this.browserGoodsDone = true
      this.dailyTaskStorage.updateStorageValue(value => value.executed = true)
      return
    }
    this.pushLog('查找是否存在 浏览\\d+个商品')
    let widget = widgetUtils.widgetGetOne('浏览\\d个商品.*')
    if (widget) {
      let content = widget.text()
      logUtils.debugInfo(['浏览得豆控件信息：{}', content])
      // 浏览7个商品得京豆 6/7
      let regex = /浏览(\d+)个商品得京豆( (\d)\/\d)?/
      let res = regex.exec(content)
      let total = 7, executed = 0
      if (res) {
        total = res[1]
        executed = res[3] || 0
      }
      YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '有每日任务', 'jingdong_sign_browser', config.save_yolo_jingdong)
      this.doBrowserGoods(executed, total)
    } else {
      this.pushLog('未找到浏览赚豆控件信息, 直接执行逛一逛')
      this.doBrowserGoods(0, 7)
    }
    this.checkBrowserResult(true)
  }

  this.checkBrowserResult = function (recheck) {
    if (this.dailyTaskStorage.getValue().executed) {
      return
    }
    // 回到最上面
    recheck && automator.scrollUp()
    if (widgetUtils.widgetCheck('已领取奖励', 1000)) {
      YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '每日浏览已完成', 'jingdong_sign_browser', config.save_yolo_jingdong)
      logUtils.debugInfo(['找到 已领取奖励 控件 今日浏览任务已完成'])
      this.browserGoodsDone = true
      this.dailyTaskStorage.updateStorageValue(value => value.executed = true)
      return
    }

    if (!recheck) {
      this.browserGoods()
    } else {
      this.checkBrowserDone()
    }
  }

  this.checkBrowserDone = function () {
    if (this.dailyTaskStorage.getValue().executed) {
      logUtils.debugInfo('今日已完成逛一逛任务')
      return
    }
    let region = [1133, 2424, 299, 288]
    if (!this.captureAndCheckByOcr('^立即领$', '领取按钮', region, null, true, 2)) {
      logUtils.warnInfo(['未找到立即领按钮'])
      logUtils.debugInfo(['尝试通过控件信息查询+5领取按钮'])
      let target = selector().boundsInside(config.device_width / 2, config.device_height / 2, config.device_width, config.device_height)
        .textMatches('\\+\\d+').findOne(1000)
      if (target) {
        logUtils.debugInfo(['找到 +5 领取按钮: {}', { x: target.bounds().centerX(), y: target.bounds().centerY() }])
        automator.clickCenter(target)
        return true
      }
    } else {
      return true
    }
    return false
  }

  this.doBrowserGoods = function (browsedIdx, total) {
    browsedIdx = browsedIdx || 0
    if (browsedIdx >= (total || 10)) {
      logUtils.debugInfo(['当前已浏览足够商品'])
      return
    }
    let goodsList = null
    let t = threads.start(function () {
      goodsList = selector().className('android.view.View').clickable().depth(16).untilFind()
    })
    t.join(5000)
    if (goodsList && goodsList.length > 0) {
      logUtils.debugInfo(['找到可浏览商品数：{} 当前已浏览：{}', goodsList.length, browsedIdx])
      this.pushLog('找到可浏览商品数' + goodsList.length + '当前浏览数：' + browsedIdx)
      if (browsedIdx < goodsList.length - 1) {
        goodsList[browsedIdx].click()
        sleep(3000)
        automator.back()
        this.doBrowserGoods(browsedIdx + 1, total)
        let widget = widgetUtils.widgetGetOne('浏览\\d个商品.*(\\d/\\d)?')
        if (widget) {
          let content = widget.text()
          logUtils.debugInfo(['浏览得豆控件信息：{}', content])
        }
      } else {
        this.pushLog('可浏览商品数不足')
      }
    }
  }

  /**
   * 执行种豆得豆
   *
   * @returns 
   */
  this.execPlantBean = function (doubleCheck) {
    if (this.isSubTaskExecuted(BEAN)) {
      return
    }
    debugInfo(['种豆得豆子任务信息{}', JSON.stringify(BEAN)])
    if (!doubleCheck) {
      this.pushLog('通过控件查找种豆得豆入口')
      openPlant()
    }

    sleep(1000)
    if (!widgetUtils.widgetWaiting('豆苗成长值')) {
      FloatyInstance.setFloatyInfo({ x: 500, y: 500 }, '查找 豆苗成长值 失败')
      if (doubleCheck) {
        return
      }
      return this.execPlantBean(true)
    }
    this.checkIfWeeklyReward()
    YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '进入种豆得豆成功', 'jingdong_bean', config.save_yolo_jingdong)
    this.collectClickableBall()
    if (!this.hadSetSchedule) {
      let collectCountdown = widgetUtils.widgetGetOne('剩(\\d{2}:?){3}', null, true)
      if (collectCountdown) {
        let countdown = collectCountdown.content
        let result = /(\d+):(\d+):(\d+)/.exec(countdown)
        let remain = parseInt(result[1]) * 60 + parseInt(result[2]) + 1
        FloatyInstance.setFloatyInfo({
          x: collectCountdown.target.bounds().centerX(),
          y: collectCountdown.target.bounds().centerY()
        }, '剩余时间：' + remain + '分')
        this.pushLog('检测到种豆得豆倒计时：' + remain + '分')
        this.pushLog('控件信息：' + countdown)
        sleep(1000)

        if (remain >= jingdongConfig.plant_min_gaps || 120) {
          let settingMinGaps = jingdongConfig.plant_min_gaps || 120
          logUtils.logInfo(['倒计时：{} 超过{}分，设置{}分钟后来检查', remain, settingMinGaps, settingMinGaps])
          remain = settingMinGaps
        }
        this.createNextSchedule(this.taskCode + ':' + BEAN.taskCode, new Date().getTime() + remain * 60000)
        this.hadSetSchedule = true
      }
    }
    // 完成日常任务
    if (this.doDailyTasks()) {
      this.pushLog('执行了日常任务，重新检查收集球')
      automator.back()
      sleep(1000)
      return this.execPlantBean()
    }
    this.setSubTaskExecuted(BEAN)
  }

  // 领取每周京豆奖励
  this.checkIfWeeklyReward = function () {
    let reward = widgetUtils.widgetGetOne('收下京豆', 1000)
    this.displayButtonAndClick(reward, '收下京豆')
  }

  this.doDailyTasks = function (skipDoubleSign) {
    // todo optimize me: 这个方法的代码 又臭又长 需要优化一下
    this.pushLog('查证是否有更多任务')
    let execute = false
    YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '每日任务信息', 'jingdong_bean_task', config.save_yolo_jingdong)
    if (this.displayButtonAndClick(widgetUtils.widgetGetOne('更多任务', 1999), '查看更多任务')) {
      sleep(1000)
      if (!skipDoubleSign && this.isSubTaskExecuted(DOUBLE_SIGN)) {
        // 双签任务完成后再执行 领取双签奖励
        let goSign = widgetUtils.widgetGetOne('去签到', 1000)
        if (this.displayButtonAndClick(goSign, '双签任务')) {
          this.checkDoubleCheckDone()
          return this.doDailyTasks(true)
        }
      }
      let hasNext = false
      // boundsInside: x,y,right,bottom
      let region = [0, 0.4 * config.device_height, config.device_width, config.device_height - 200 * config.scaleRate]
      do {
        hasNext = false
        let hangBtn = widgetUtils.widgetGetOne('去逛逛', 3000, false, false, bounds => bounds.boundsInside(region[0], region[1], region[2], region[3]))
        let isFollowTask = false
        try {
          isFollowTask = hangBtn.parent().child(0).child(1).child(0).text() == '浏览店铺'
        } catch (e) {
          this.pushLog('验证是否为浏览店铺任务失败')
          isFollowTask = false
        }
        if (this.displayButtonAndClick(hangBtn, '去逛逛')) {
          hasNext = true
          if (isFollowTask) {
            this.pushLog('自动浏览并关注店铺 代码不稳定 直接退出')
            break
          } else {
            execute = true
            let count = 10
            do {
              this.replaceLastLog('自动浏览' + count + '秒')
              sleep(1000)
            } while (--count > 0)
          }
          if (commonFunctions.myCurrentPackage() != _package_name) {
            this.pushLog('当前不在京东APP')
            commonFunctions.minimize(commonFunctions.myCurrentPackage())
          } else {
            automator.back()
          }
        }
      } while (hasNext)
    }
    return execute
  }


  this.collectClickableBall = function (tryTime) {
    if (typeof tryTime == 'undefined') {
      tryTime = 3
    }
    if (tryTime <= 0) {
      return
    }
    this.pushLog('查找可点击的球')
    let clickableBalls = widgetUtils.widgetGetAll('x[1-9]+') || []
    // 过滤无效球
    clickableBalls = clickableBalls.filter(v => {
      try {
        let siblingsText = v.parent().parent().parent().child(1).text()
        return siblingsText.indexOf('入口访问') < 0
      } catch (e) {
        return false
      }
    })
    clickableBalls.forEach(clickableBall => {
      this.displayButtonAndClick(clickableBall, '可收集' + (clickableBall ? clickableBall.text() : ''))
      let checkDialog = widgetUtils.widgetGetOne('开心收下', 1000)
      this.displayButtonAndClick(checkDialog, '开心收下')
      sleep(500)
    })
    if (clickableBalls.length > 0) {
      auto.clearCache && auto.clearCache()
      return this.collectClickableBall(--tryTime)
    } else {
      this.pushLog('无可收集内容')
    }
  }

  this.closePopup = function () {
    let okBtn = widgetUtils.widgetGetOne('.*知道了.*', 2000)
    if (okBtn) {
      okBtn.click()
      sleep(1500)
    }
  }

  function getEntries (text) {
    let target = widgetUtils.widgetGetOne(text)
    if (target) {
      if (target.parent().clickable()) {
        return target.parent()
      } else {
        signFailedUtil.recordFailedWidgets(SIGN.taskCode, text)
        if (target.bounds().left > config.device_width) {
          debugInfo(['目标在屏幕外，进行滑动切换'])
          automator.swipe(config.device_width - 5, target.bounds().centerY(), target.bounds().left - config.device_width / 2,
            target.bounds().centerY(), 500)
        }
        target = widgetUtils.widgetGetOne(text)
        warnInfo(['{} 父控件无法点击，使用坐标模拟点击：{},{}', text, target.bounds().left + 5, target.bounds().centerY()])
        return {
          click: () => {
            automator.click(target.bounds().left + 5, target.bounds().centerY())
          }
        }
      }
    }
  }

  this.doubleSign = function (doubleCheck) {
    if (this.isSubTaskExecuted(DOUBLE_SIGN)) {
      return
    }
    if (openPlant()) {
      let doubleSignEntry = widgetUtils.widgetGetOne('双签领豆')
      if (this.displayButtonAndClick(doubleSignEntry, '双签领豆')) {
        if (this.checkDoubleCheckDone()) {
          this.setSubTaskExecuted(DOUBLE_SIGN)
          back()
          back()
          back()
          return
        }
        this.pushLog('等待自动打开京东金融签到界面')
        sleep(5000)
        this.pushLog('等待领金贴界面')
        if (widgetUtils.widgetCheck('签到领金贴')) {
          this.pushLog('进入领金贴界面')
          sleep(1000)
          this.pushLog('清除空间缓存')
          auto.clearCache && auto.clearCache()
          sleep(1000)
          // todo 双签逻辑
          let signBtn = widgetUtils.widgetGetOne('签到领金贴')
          this.displayButtonAndClick(signBtn, '签到领金贴')
        }
        if (this.checkDoubleCheckDone()) {
          this.setSubTaskExecuted(DOUBLE_SIGN)
        }
        sleep(1000)
        this.pushLog('准备回到我的界面')
        back()
        back()
        back()
      } else {
        let moreTasks = widgetUtils.widgetGetOne('更多任务')
        if (this.displayButtonAndClick(moreTasks)) {
          sleep(1000)
          doubleSignEntry = widgetUtils.widgetGetOne('双签领豆')
          if (doubleSignEntry) {
            makeSureInScreen(doubleSignEntry)
            doubleSignEntry = widgetUtils.widgetGetOne('双签领豆')
            this.displayButtonAndClick(doubleSignEntry)
            sleep(1000)
            if (this.checkDoubleCheckDone()) {
              this.setSubTaskExecuted(DOUBLE_SIGN)
            }
            back()
            back()
            back()
          }
        }
      }
    }
  }

  function makeSureInScreen (target) {
    _this.pushLog('底部坐标:' + target.bounds().bottom)
    automator.gestureDown()
    automator.gestureDown()
  }

  this.checkDoubleCheckDone = function () {
    this.pushLog('查找是否存在 点击领奖|查看奖励')
    let reward = widgetUtils.widgetGetOne('点击领奖|查看奖励', 3000)
    return this.displayButtonAndClick(reward)
  }

  function backToSignPage () {
    let limit = 5
    do {
      automator.back()
    } while (!verifySignOpened(1000) && limit-- > 0)
    if (!verifySignOpened()) {
      openSignPage()
    }
    sleep(1000)
  }

  this.exec = function () {
    let failed = false
    // 京豆签到
    this.execDailySign()
    // 双签领豆
    this.doubleSign()
    // 种豆得豆
    this.execPlantBean()

    this.setExecuted()
    if (failed) {
      if (this.retryTime++ >= 3) {
        this.pushLog('重试次数过多，签到失败')
        commonFunctions.minimize(_package_name)
        return
      }
      this.pushLog('关闭并重新打开京东APP，只支持MIUI手势')
      commonFunctions.killCurrentApp()
      sleep(3000)
      this.exec()
      return
    }
    commonFunctions.minimize(_package_name)
  }
}
BeanCollector.prototype = Object.create(BaseSignRunner.prototype)
BeanCollector.prototype.constructor = BeanCollector

module.exports = new BeanCollector()
