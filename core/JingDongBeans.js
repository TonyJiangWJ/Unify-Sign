
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)

let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')

let BaseSignRunner = require('./BaseSignRunner.js')
function BeanCollector () {
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

  function verifySignOpened(timeout) {
    let verifyWidget = widgetUtils.widgetCheck('京东秒杀', timeout || 2000)
    if (verifyWidget) {
      return true
    }
    return false
  }
  /**
   * 执行签到
   * @returns 
   */
  this.execCollectBean = function () {
    if (this.isSubTaskExecuted(SIGN)) {
      return
    }
    FloatyInstance.setFloatyText('检查是否有签到按钮或已完成签到')
    this.pushLog('校验是否有签到按钮或已完成签到')
    let checking = widgetUtils.alternativeWidget('.*签到\\D+', '连签\\d+天', null, true)
    let clicked = false
    if (checking.value == 1) {
      this.displayButtonAndClick(checking.target, '点击签到')
      this.pushLog('找到签到按钮：' + checking.content)
      clicked = true
    } else if (checking.value == 2) {
      this.displayButton(checking.target, '今日已完成签到：' + checking.content)
      this.pushLog('今日已完成签到：' + checking.content)
      this.setSubTaskExecuted(SIGN)
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
      checking = widgetUtils.widgetCheck('连签\\d+天', 1000)
      if (checking) {
        this.setSubTaskExecuted(SIGN)
        this.pushLog('二次校验，签到完成')
      } else {
        this.pushLog('二次校验失败，签到未完成')
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
      let countDown = new java.util.concurrent.CountDownLatch(1)
      let entryIcon = null
      this.pushLog('通过控件查找种豆得豆入口')
      threads.start(function () {
        entryIcon = selector().className('android.widget.Image').clickable().untilFind()
        countDown.countDown()
      })
      countDown.await(5, java.util.concurrent.TimeUnit.SECONDS)
      if (entryIcon && entryIcon.length >= 1 && (entryIcon = entryIcon[0])) {
        this.pushLog('通过控件方式找到了种豆得豆入口')
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
    // TODO 完成日常任务
    this.setSubTaskExecuted(BEAN)
  }

  this.collectClickableBall = function (tryTime) {
    if (typeof tryTime == 'undefined') {
      tryTime = 3
    }
    if (tryTime <= 0) {
      return
    }
    let clickableBall = widgetUtils.widgetGetOne('x[1-9]+')
    if (this.displayButtonAndClick(clickableBall, '可收集' + (clickableBall ? clickableBall.text() : ''))) {
      sleep(500)
      auto.clearCache && auto.clearCache()
      this.collectClickableBall(--tryTime)
    } else {
      FloatyInstance.setFloatyText('无可收集内容')
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
    let entryPoint = {
      x: jingdongConfig.double_sign_posi_x || this.cvt(1230), y: jingdongConfig.double_sign_posi_x || this.cvt(620)
    }
    if (!doubleCheck) {
      let countDown = new java.util.concurrent.CountDownLatch(1)
      let entryIcon = null
      this.pushLog('通过控件查找双签领豆入口')
      threads.start(function () {
        entryIcon = selector().className('android.widget.Image').clickable().untilFind()
        countDown.countDown()
      })
      countDown.await(5, java.util.concurrent.TimeUnit.SECONDS)
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

  function backToSignPage() {
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
        FloatyInstance.setFloatyText('重试次数过多，签到失败')
        commonFunctions.minimize(_package_name)
        return
      }
      FloatyInstance.setFloatyText('关闭并重新打开京东APP，只支持MIUI手势')
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
