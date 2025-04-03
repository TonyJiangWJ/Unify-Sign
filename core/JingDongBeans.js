
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)

let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')
let signFailedUtil = singletonRequire('SignFailedUtil')
let YoloTrainHelper = singletonRequire('YoloTrainHelper')
let warningFloaty = singletonRequire('WarningFloaty')

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
    },
    {
      taskCode: 'drugSign',
      taskName: '京东买药',
      enabled: true,
    }
  ]
  const SIGN = this.subTasks.filter(task => task.taskCode == 'beanSign')[0]
  const BEAN = this.subTasks.filter(task => task.taskCode == 'plantBean')[0]
  const DOUBLE_SIGN = this.subTasks.filter(task => task.taskCode == 'doubleSign')[0]
  const DRUG_SIGN = this.subTasks.filter(task => task.taskCode == 'drugSign')[0]

  /***********************
   * 综合操作
   ***********************/

  /**
   * 通过我的进入签到页面
   */
  function openSignPage (retry) {
    app.launchPackage(_package_name)
    if (openMine()) {
      _this.pushLog('等待页面加载')
      sleep(3000)
      let signEntry = widgetUtils.widgetGetOne('更多')
      if (_this.displayButtonAndClick(signEntry, '更多按钮')) {
        _this.pushLog('等待页面加载')
        sleep(3000)
        return _this.displayButtonAndClick(widgetUtils.widgetGetOne("签到领京豆"))
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

  function openHome () {
    if (commonFunctions.myCurrentPackage() != _package_name) {
      app.launchPackage(_package_name)
      _this.pushLog('打开京东APP')
      sleep(2000)
    }
    if ((descContains('首页').boundsInside(0, config.device_height * 0.8, config.device_width, config.device_height).findOne(1000))) {
      _this.pushLog('点击 首页 控件')
      let myWidget = descContains('首页').boundsInside(0, config.device_height * 0.8, config.device_width, config.device_height).findOne(1000)
      return _this.displayButtonAndClick(myWidget, '首页')
    }
    return false
  }

  function openPlant () {
    if (openHome()) {
      sleep(2000)
      let plantEntry = widgetUtils.widgetGetOne('种豆得豆')
      if (_this.displayButtonAndClick(plantEntry, '种豆得豆')) {
        if (!widgetUtils.widgetWaiting('豆苗成长值')) {
          _this.pushLog('无法找到豆苗成长值，打开失败')
          return false
        }
        _this.checkIfWeeklyReward()
        return true
      }
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

    if (!openSignPage()) {
      if (widgetUtils.widgetCheck("今日已签到", 2000)) {
        this.pushLog('今日已完成签到')
        this.setSubTaskExecuted(SIGN)
        return true
      }
      this.pushErrorLog('进入签到页面失败')
      return false
    }
    this.awaitAndSkip()
    if (verifySignOpened()) {
      // 等待加载动画
      sleep(1000)
      this.closePopup()

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

      back()
    } else {
      this.pushErrorLog('打开签到页面失败')
    }
  }

  this.execDrugSign = function () {
    if (this.isSubTaskExecuted(DRUG_SIGN)) {
      return true
    }
    let drugSigner = new DrugSigner()
    drugSigner.openDrugSignPage()
    drugSigner.checkDailySign()
    drugSigner.checkSimpleTask()
    // 任务完成后执行
    // this.setSubTaskExecuted(DRUG_SIGN)
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

  this.doDailyTasks = function (skipDoubleSign, executedCount) {
    executedCount = executedCount || 1
    if (this.dailyTaskStorage.getValue().executed) {
      logUtils.debugInfo('今日已完成逛一逛任务')
      return false
    }
    // todo optimize me: 这个方法的代码 又臭又长 需要优化一下
    this.pushLog('执行次数:' + executedCount + ' 查证是否有更多任务')
    let execute = false
    YoloTrainHelper.saveImage(commonFunctions.captureScreen(), '每日任务信息', 'jingdong_bean_task', config.save_yolo_jingdong)
    if (this.displayButtonAndClick(widgetUtils.widgetGetOne('更多任务', 1999), '查看更多任务')) {
      sleep(1000)
      if (!skipDoubleSign && this.isSubTaskExecuted(DOUBLE_SIGN)) {
        // 双签任务完成后再执行 领取双签奖励
        let goSign = widgetUtils.widgetGetOne('去签到', 1000)
        if (this.displayButtonAndClick(goSign, '双签任务')) {
          this.checkDoubleCheckDone()
          return this.doDailyTasks(true, executedCount)
        }
      }
      // 滑动触发控件刷新加载，否则可能无法找到目标
      automator.gestureDown(0.8 * config.device_height, 0.6 * config.device_height, 500)
      sleep(500)
      automator.gestureUp(0.8 * config.device_height, 0.6 * config.device_height, 500)
      sleep(500)
      let hasNext = false
      // boundsInside: x,y,right,bottom
      let region = [0, 0.4 * config.device_height, config.device_width, config.device_height - 200 * config.scaleRate]
      do {
        hasNext = false
        // region 去逛逛
        let hangBtn = widgetUtils.widgetGetOne('去逛逛', 3000, false, false, bounds => bounds.boundsInside(region[0], region[1], region[2], region[3]))
        let isFollowTask = false
        try {
          isFollowTask = !!widgetUtils.subWidgetGetOne(hangBtn.parent(), '.*(浏览|关注)店铺.*', 1000)
        } catch (e) {
          this.pushLog('验证是否为浏览店铺任务失败')
          isFollowTask = false
        }
        if (this.displayButtonAndClick(hangBtn, '去逛逛')) {
          hasNext = true
          if (isFollowTask) {
            this.pushLog('自动浏览并关注店铺')
            doBrowseShop.apply(this)
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
            sleep(1000)
            automator.back()
          } else {
            automator.back()
          }
        }
        // endregion 去逛逛

        // region 去关注
        if (!hasNext) {
          hasNext = checkFollowChannel.apply(this)
        }
        // endregion 去关注
        if (hasNext) {
          if (++executedCount > 15) {
            this.pushLog('已执行超过合理次数，可能执行存在问题，退出执行')
            return false
          }
          if (!widgetUtils.widgetGetOne('完成任务越多，瓜分京豆越多哦.*', 1000)) {
            this.pushLog('任务抽屉打开失败，重新进入')
            commonFunctions.minimize()
            if (!openPlant()) {
              this.pushErrorLog('打开种豆页面失败')
              commonFunctions.killCurrentApp()
              sleep(1000)
              if (!openPlant()) {
                this.pushErrorLog('强制关闭当前APP后依旧失败 退出执行')
                return false
              }
            }
            return this.doDailyTasks(skipDoubleSign, executedCount)
          }
        } else {
          debugInfo(['今日任务已全部完成'])
          this.dailyTaskStorage.updateStorageValue(value => value.executed = true)
        }
      } while (hasNext)
    }
    return execute
  }

  function doBrowseShop (limit) {
    limit = limit || 0
    if (limit >= 6) {
      this.pushLog('关注店铺个数过多 返回上级 检查是否已完成')
      return false
    }
    let target = widgetUtils.widgetGetOne('进店并关注', 1000)
    if (this.displayButtonAndClick(target)) {
      this.pushLog('等待进入店铺页面')
      sleep(3000)
      if (this.displayButtonAndClick(widgetUtils.widgetGetOne('已关注'))) {
        this.pushLog('取消关注店铺')
        sleep(1000)
        this.displayButtonAndClick(widgetUtils.widgetGetOne('取消关注'))
        sleep(1000)
      }
      this.pushLog('返回关注店铺页面')
      automator.back()
      sleep(1000)
      return doBrowseShop.apply(this, [limit + 1])
    } else {
      return false
    }
  }

  function checkFollowChannel () {
    let target = widgetUtils.widgetGetOne('去关注', 2000)
    let hasNext = false
    if (this.displayButtonAndClick(target)) {
      widgetUtils.widgetWaiting('进入并关注')
      sleep(1000)
      hasNext = true
      doFollowChannel.apply(this)
    }
    return hasNext
  }

  function doFollowChannel (limit) {
    limit = limit || 0
    if (limit > 3) {
      this.pushLog('关注频道过多 直接返回 重新校验是否有关注频道入口')
      return true
    }
    let target = widgetUtils.widgetGetOne('进入并关注', 1000)
    if (this.displayButtonAndClick(target)) {
      this.pushLog('等待进入频道页面')
      sleep(3000)
      if (this.displayButtonAndClick(widgetUtils.widgetGetOne('已关注'))) {
        this.pushLog('取消关注频道')
        sleep(1000)
      }
      this.pushLog('返回关注频道页面')
      automator.back()
      sleep(1000)
      return doFollowChannel.apply(this, [limit + 1])
    }
    return true
  }

  this.taskDialogOpened = function () {
    let target = widgetUtils.widgetGetOne('完成任务越多，瓜分京豆越多哦.*', 2000)
    if (target && target.bounds().height() > 0) {
      this.pushLog('检测到 任务抽屉已打开，退出重新进入种豆界面')
      commonFunctions.minimize()
      return true
    }
    return false
  }


  this.collectClickableBall = function (tryTime) {
    if (typeof tryTime == 'undefined') {
      tryTime = 6
    }
    if (tryTime <= 0) {
      return
    }
    // 如果弹窗打开状态 退出重新进入
    if (this.taskDialogOpened()) {
      openPlant()
      sleep(1000)
      return this.collectClickableBall(tryTime)
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

  this.doubleSign = function (doubleCheck) {
    if (this.isSubTaskExecuted(DOUBLE_SIGN)) {
      return
    }
    if (openPlant()) {

      let openDoubleSignPage = () => {

        let doubleSignEntry = widgetUtils.widgetGetOne('更多任务')
        if (this.displayButtonAndClick(doubleSignEntry, '更多任务')) {
          sleep(1000)
          // 滑动触发控件刷新加载，否则可能无法找到目标
          automator.gestureDown(0.8 * config.device_height, 0.6 * config.device_height, 500)
          sleep(500)
          automator.gestureUp(0.8 * config.device_height, 0.6 * config.device_height, 500)
          sleep(500)
          sleep(1000)
          return this.displayButtonAndClick(scrollUpUntilFindTarget.apply(this), '双签领奖')
        }
        return false
      }

      if (openDoubleSignPage()) {
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

  function scrollUpUntilFindTarget () {
    auto.clearCache && auto.clearCache()
    // 定义可见范围
    let visibleBounds = [0, config.device_height * 0.4, config.device_width, config.device_height - 200]
    warningFloaty.addRectangle('可见范围：', ((b) => [b[0], b[1], b[2] - b[0], b[3] - b[1]])(visibleBounds), '#00ff00')
    this.pushLog('可见范围：' + JSON.stringify(visibleBounds))
    let vb = visibleBounds
    let findTarget = false, limit = 5
    while (!(findTarget = widgetUtils.widgetGetOne('双签领奖', 2000, null, null,
      matcher => {
        return matcher.boundsInside(vb[0], vb[1], vb[2], vb[3]).indexInParent(0)
      }
    )
    ) && limit-- > 0) {
      automator.gestureDown(config.device_height - 200, config.device_height * 0.6)
      this.pushLog('未找到 双签领奖 向下滑动寻找' + limit)
      sleep(1000)
      auto.clearCache && auto.clearCache()
    }
    findTarget = ensureTargetInVisible(findTarget, visibleBounds, () => widgetUtils.widgetGetOne('双签领奖', 2000))
    sleep(1000)
    warningFloaty.clearAll()
    return findTarget
  }
  function ensureTargetInVisible (target, visibleBounds, reget, limit) {
    limit = limit || 0
    if (limit > 5) {
      debugInfo(['检测次数过多 直接返回控件{}', b])
      return target
    }
    let b = target.bounds()
    debugInfo(['双签控件位置：{} 可见范围：{}', b, visibleBounds])
    if (b.top < visibleBounds[1]) {
      debugInfo(['在顶部 需要向上滑动(手势向下): {} => {}', visibleBounds[1] + 100, visibleBounds[1] + 100 + visibleBounds[1] - b.top])
      automator.gestureUp(visibleBounds[1] + 100, visibleBounds[1] + 100 + visibleBounds[1] - b.top, 500)
    } else if (b.bottom > visibleBounds[3]) {
      debugInfo(['在底部 需要向下滑动(手势向上):{} => {}', visibleBounds[3] - 200, visibleBounds[3] - 200 - (b.bottom - visibleBounds[3])])
      automator.gestureDown(visibleBounds[3] - 200, visibleBounds[3] - 200 - (b.bottom - visibleBounds[3]), 500)
    } else {
      debugInfo(['控件位置在可见范围内：{}', b])
      return target
    }
    auto.clearCache && auto.clearCache()
    sleep(500)
    return ensureTargetInVisible(reget(), visibleBounds, reget, limit + 1)
  }

  function makeSureInScreen (target) {
    _this.pushLog('底部坐标:' + target.bounds().bottom)
    automator.gestureDown()
    automator.gestureDown()
  }

  this.checkDoubleCheckDone = function () {
    sleep(1000)
    this.pushLog('查找是否存在 点击领奖|查看奖励')
    let reward = widgetUtils.widgetGetOne('点击领奖|查看奖励', 3000)
    return this.displayButtonAndClick(reward)
  }

  this.exec = function () {
    let failed = false
    // 京豆签到
    this.execDailySign()
    // 双签领豆
    this.doubleSign()
    // 种豆得豆
    this.execPlantBean()
    // 京东买药
    this.execDrugSign()

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


  function DrugSigner() {
    let parentThis = _this
    this.openDrugSignPage = function () {
      openDrugSignPage()
    }

    this.checkDailySign = function (recheck) {
      sleep(1000)
      if (parentThis.captureAndCheckByOcr('签到奖励', '签到奖励', null, null, true)) {
        parentThis.pushLog('点击了签到奖励')
        sleep(1000)
        let signBtn = widgetUtils.widgetGetOne('签到领奖励')
        let signSuccess = false
        if (parentThis.displayButtonAndClick(signBtn, '签到领奖励')) {
          signSuccess = true
        } else {
          parentThis.pushErrorLog('无法通过控件获取 签到领奖励 尝试OCR获取')
          if (parentThis.captureAndCheckByOcr('签到领奖励', null, null, null, true)) {
            parentThis.pushLog('通过OCR找到了 签到领奖励按钮 直接点击')
            signSuccess = true
          }
        }

        if (!signSuccess) {
          parentThis.pushLog('未能找到签到领奖励，今日签到可能已完成，需要确保当前界面为 签到领奖励界面')
          if (widgetUtils.widgetCheck('您已连续签到.*', 2000)) {
            parentThis.pushLog('找到了关键控件，今日签到已完成')
            signSuccess = true
          } else if (parentThis.captureAndCheckByOcr('您已连续签到.*', null, null, null, false)) {
            parentThis.pushLog('OCR 找到关键信息')
            signSuccess = true
          }
        }
        if (signSuccess) {
          parentThis.pushLog('当前在签到领奖励界面，设置今日签到完成')
          parentThis.setSubTaskExecuted(DRUG_SIGN)
        } else {
          parentThis.pushErrorLog('无法确认当前是否在签到任务页面 等待重试')
          if (!recheck) {
            parentThis.pushWarningLog('重试签到')
            return this.checkDailySign(true)
          }
        }
      }
    }

    this.checkSimpleTask = function () {
      parentThis.captureAndCheckByOcr('领奖励', '领取奖励')
      // TODO 完成每日任务
    }


    function openDrugSignPage () {
      let url = 'openapp.jdmobile://virtual?params=' + encodeURIComponent(buildParams())
      console.log('url:', url)
      app.startActivity({
        action: 'android.intent.action.VIEW',
        data: url,
        packageName: 'com.jingdong.app.mall'
      })
    }
    
    function buildUrlParams () {
      let params = [
        'utm_user=plusmember',
        'gx=RnAoFNvDvpxGHheQeSnihXDdWirjP_lfCFEYixY',
        'gxd=RnAoy2FdYDaPyM5EqI1xXgjvwH1850Q',
        'ad_od=share',
        'utm_source=androidapp',
        'utm_medium=appshare',
        'utm_term=Wxfriends_shareid86482f3fa7963bbd174053140530292934_none_none'
      ]
      console.log('url params:', JSON.stringify(params))
      return params.join('&')
    }
    
    
    function buildParams () {
      let params = {
        "category": "jump",
        "des": "m",
        "sourceValue": "babel-act",
        "sourceType": "babel",
        "url": "https://jdhm.jd.com/jdhhome/?" + buildUrlParams(),
        "M_sourceFrom": "H5",
        "msf_type": "click",
      }
    
      return JSON.stringify(params)
    }
  }
}
BeanCollector.prototype = Object.create(BaseSignRunner.prototype)
BeanCollector.prototype.constructor = BeanCollector

module.exports = new BeanCollector()
