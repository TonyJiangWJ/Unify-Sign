
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)

let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')

let BaseSignRunner = require('./BaseSignRunner.js')
function BeanCollector () {
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
  function openSignPage () {
    let url = 'openapp.jdmobile://virtual?params=' + encodeURIComponent(buildParams())
    // console.log('url:', url)
    app.startActivity({
      action: 'android.intent.action.VIEW',
      data: url,
      packageName: 'com.jingdong.app.mall'
    })
  }

  function buildUrlParams () {
    let params = [
      'commontitle=no',
      'transparent=1',
      'has_native=0',
      '_ts=' + new Date().getTime(),
      'utm_user=plusmember',
      'gx=RnAoFNvDvpxGHheQeSnihXDdWirjP_lfCFEYixY',
      'gxd=RnAoy2FdYDaPyM5EqI1xXgjvwH1850Q',
      'ad_od=share',
      'utm_source=androidapp',
      'utm_medium=appshare',
      'utm_campaign=t_335139774',
      'utm_term=Wxfriends'
    ]
    // console.log('url params:', JSON.stringify(params))
    return params.join('&')
  }


  function buildParams () {
    let params = {
      "category": "jump",
      "des": "m",
      "sourceValue": "babel-act",
      "sourceType": "babel",
      "url": "https://pro.m.jd.com/mall/active/Md9FMi1pJXg2q7qc8CmE9FNYDS4/index.html?" + buildUrlParams(),
      "M_sourceFrom": "H5",
      "msf_type": "click",
      "m_param": {
        "usc": "androidapp",
        "ucp": "t_335139774",
        "umd": "appshare",
        "utr": "Wxfriends",
        "psn": "16958841235771574046910|1",
        "psq": 1,
        "mba_muid": "16958841235771574046910",
        "mba_sid": "16958841235902758310971131663",
        "std": "MO-J2011-1",
        "event_id": "Babel_LeavepageExpo",
      },
    }
    return JSON.stringify(params)
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
  this.execCollectBean = function () {
    this.checkBrowserResult()
    if (this.isSubTaskExecuted(SIGN)) {
      return
    }
    this.pushLog('检查是否有签到按钮或已完成签到')
    let signBtn = widgetUtils.widgetGetById('homeSignButton')
    if (signBtn) {
      if (/\+\d+/.test(signBtn.text())) {
        this.displayButtonAndClick(signBtn, '签到按钮')
        logUtils.debugInfo(['点击了签到按钮'])
      } else {
        logUtils.debugInfo(['当前已完成签到'])
      }
      clicked = true
    } else {
      let region = [0, 0, config.device_width, config.device_height * 0.3]
      if (this.captureAndCheckByOcr('签到领豆', '领取按钮', region, null, true, 3)) {
        this.pushLog('OCR找到签到按钮：签到领豆')
        clicked = true
      } else {
        this.pushLog('未找到签到按钮 使用坐标点击')
        automator.click(jingdongConfig.sign_posi_x, jingdongConfig.sign_posi_y)
        clicked = true
      }
    }

    if (clicked) {
      // 二次校验是否正确签到
      checking = widgetUtils.widgetCheck('.*连签\\d+天', 1000)
      if (checking) {
        this.setSubTaskExecuted(SIGN)
        this.pushLog('二次校验，签到完成')
      } else {
        this.pushLog('二次校验失败，签到未完成')
      }
    }

    // 浏览商品
    this.browserGoods()
  }

  this.browserGoods = function () {
    let widget = widgetUtils.widgetGetOne('浏览\\d个商品.*(\\d/\\d)?')
    if (widget) {
      let content = widget.text()
      logUtils.debugInfo(['浏览得豆控件信息：{}', content])
      this.doBrowserGoods()
    } else {
      this.pushLog('未找到浏览赚豆控件信息')
    }
    this.checkBrowserResult()
  }

  this.checkBrowserResult = function () {
    if (this.dailyTaskStorage.getValue().executed) {
      return
    }
    if (widgetUtils.widgetCheck('已领取奖励', 1000)) {
      logUtils.debugInfo(['找到 已领取奖励 控件 今日浏览任务已完成'])
      this.browserGoodsDone = true
      this.dailyTaskStorage.updateStorageValue(value => value.executed = true)
      return
    }
    let region = [0, config.device_height * 0.5, config.device_width, config.device_height * 0.5]
    if (!this.captureAndCheckByOcr('^立即领$', '领取按钮', region, null, true, 3)) {
      logUtils.warnInfo(['未找到立即领按钮'])
      logUtils.debugInfo(['尝试通过控件信息查询+5领取按钮'])
      let target = selector().boundsInside(config.device_width/2, config.device_height/2, config.device_width, config.device_height).textMatches('\\+\\d+').findOne(1000)
      if (target) {
        logUtils.debugInfo(['找到 +5 领取按钮: {}', { x: target.bounds().centerX(), y: target.bounds().centerY()}])
        automator.clickCenter(target)
      }
    }
    
  }

  this.doBrowserGoods = function (browsedIdx) {
    browsedIdx = browsedIdx || 0
    if (browsedIdx >= 7) {
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
      this.pushLog('找到可浏览商品数'+goodsList.length+'当前浏览数：'+browsedIdx)
      if (browsedIdx < goodsList.length - 1) {
        goodsList[browsedIdx].click()
        sleep(3000)
        automator.back()
        this.doBrowserGoods(browsedIdx + 1)
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
    let entryPoint = {
      x: jingdongConfig.plant_bean_enter_x || this.cvt(1230), y: jingdongConfig.plant_bean_enter_y || this.cvt(440)
    }
    if (!doubleCheck) {
      this.pushLog('通过控件查找种豆得豆入口')
      let entryIcon = getEntries()
      if (entryIcon && entryIcon.length >= 1) {
        this.pushLog('通过控件方式找到了种豆得豆入口')
        debugInfo(['find entries: {} {}', entryIcon.length, (entryIcon.map(entry => { let b = entry.bounds(); return [b.left, b.top, b.right, b.bottom] }))])
        entryIcon = entryIcon[0]
        this.displayButtonAndClick(entryIcon, '种豆得豆入口')
      } else {
        this.pushLog('未能通过坐标方式找到种豆得豆入口，使用坐标点击')
        FloatyInstance.setFloatyInfo(entryPoint, '种豆得豆入口')
        automator.click(entryPoint.x, entryPoint.y)
      }
    }

    sleep(1000)
    if (!widgetUtils.widgetWaiting('豆苗成长值')) {
      FloatyInstance.setFloatyInfo({ x: 500, y: 500 }, '查找 豆苗成长值 失败')
      if (doubleCheck) {
        return
      }
      return this.execPlantBean(true)
    }
    this.collectClickableBall()
    let collectCountdown = widgetUtils.widgetGetOne('剩(\\d{2}:?){3}', null, true)
    if (collectCountdown) {
      let countdown = collectCountdown.content
      let result = /(\d+):(\d+):(\d+)/.exec(countdown)
      let remain = parseInt(result[1]) * 60 + parseInt(result[2]) + 1
      FloatyInstance.setFloatyInfo({
        x: collectCountdown.target.bounds().centerX(),
        y: collectCountdown.target.bounds().centerY()
      }, '剩余时间：' + remain + '分')
      sleep(1000)

      if (remain >= jingdongConfig.plant_min_gaps || 120) {
        let settingMinGaps = jingdongConfig.plant_min_gaps || 120
        logUtils.logInfo(['倒计时：{} 超过{}分，设置{}分钟后来检查', remain, settingMinGaps, settingMinGaps])
        remain = settingMinGaps
      }
      this.createNextSchedule(this.taskCode + ':' + BEAN.taskCode, new Date().getTime() + remain * 60000)
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

  this.doDailyTasks = function () {
    this.pushLog('查证是否有更多任务')
    let execute = false
    if (this.displayButtonAndClick(widgetUtils.widgetGetOne('更多任务', 1999), '查看更多任务')) {
      sleep(1000)
      let hangBtn = widgetUtils.widgetGetOne('去逛逛', 1000)
      let isFollowTask = false
      try {
        isFollowTask = hangBtn.parent().child(0).child(1).child(0).text() == '浏览店铺'
      } catch (e) {
        this.pushLog('验证是否为浏览店铺任务失败')
        isFollowTask = false
      }
      while (this.displayButtonAndClick(hangBtn, '去逛逛')) {
        execute = true
        if (isFollowTask) {
          this.pushLog('自动浏览并关注店铺 代码不稳定 直接退出')
          break
          // this.pushLog('自动关注任务')
          // let limit = 6
          // while(limit--> 0 && this.displayButtonAndClick(widgetUtils.widgetGetOne('进店并关注', 1000), '关注')) {
          //   this.pushLog('自动关注')
          //   sleep(1000)
          //   this.pushLog('查找取消关注')
          //   sleep(1000)
          //   this.displayButtonAndClick(widgetUtils.widgetGetOne('已关注', 3000), '取消关注')
          //   automator.back()
          // }
        } else {
          this.pushLog('自动浏览10秒')
          sleep(10000)
        }
        if (commonFunctions.myCurrentPackage() != _package_name) {
          this.pushLog('当前不在京东APP')
          commonFunctions.minimize(commonFunctions.myCurrentPackage())
        } else {
          automator.back()
        }
        this.pushLog('查找去逛逛')
        hangBtn = widgetUtils.widgetGetOne('去逛逛', 1000)
        try {
          isFollowTask = hangBtn.parent().child(0).child(1).child(0).text() == '浏览店铺'
        } catch (e) {
          this.pushLog('验证是否为浏览店铺任务失败')
          isFollowTask = false
        }
      }
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

  function getEntries () {
    let countDown = new java.util.concurrent.CountDownLatch(1)
    let entryIcon = null
    threads.start(function () {
      entryIcon = selector().className('android.widget.Image').clickable().boundsInside(config.device_width / 2, 0, config.device_width, config.device_height * 0.5).untilFind()
      countDown.countDown()
    })
    countDown.await(5, java.util.concurrent.TimeUnit.SECONDS)
    return entryIcon
  }

  this.doubleSign = function (doubleCheck) {
    if (this.isSubTaskExecuted(DOUBLE_SIGN)) {
      return
    }
    let entryPoint = {
      x: jingdongConfig.double_sign_posi_x || this.cvt(1230), y: jingdongConfig.double_sign_posi_x || this.cvt(620)
    }
    if (!doubleCheck) {
      let entryIcon = getEntries()
      if (entryIcon && entryIcon.length > 1 && (entryIcon = entryIcon[1])) {
        this.pushLog('通过控件方式找到了双签领豆入口')
        this.displayButtonAndClick(entryIcon, '双签领豆入口')
      } else {
        this.pushLog('未能通过坐标方式找到双签领豆入口，使用坐标点击')
        FloatyInstance.setFloatyInfo(entryPoint, '双签领豆入口')
        automator.click(entryPoint.x, entryPoint.y)
      }

      if (this.checkDoubleCheckDone()) {
        this.setSubTaskExecuted(DOUBLE_SIGN)
        backToSignPage()
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
      this.pushLog('准备回到签到界面')
      backToSignPage()
    }
  }

  this.checkDoubleCheckDone = function () {
    let reward = widgetUtils.widgetGetOne('点击领奖|查看奖励', 1000)
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
    openSignPage()
    this.awaitAndSkip()
    if (verifySignOpened()) {
      // 等待加载动画
      sleep(1000)
      this.closePopup()
      // 京豆签到
      this.execCollectBean()
      // 双签领豆
      this.doubleSign()
      // 种豆得豆
      this.execPlantBean()

      this.setExecuted()
    } else {
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
