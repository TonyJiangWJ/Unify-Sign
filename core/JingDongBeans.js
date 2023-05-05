
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
      taskCode: 'plantBean',
      taskName: '种豆得豆',
      enabled: true,
    }
  ]
  const SIGN = this.subTasks[0]
  const BEAN = this.subTasks[1]

  /***********************
   * 综合操作
   ***********************/

  // 进入京东app
  function startApp () {
    logInfo('启动京东应用')
    launch(_package_name)
    sleep(1000)
  }

  this.openBeanPage = function () {
    let homePageCollectWidget = widgetUtils.widgetGetOne(jingdongConfig.home_entry || '领京豆')
    let entered = false
    if (!this.displayButtonAndClick(homePageCollectWidget, '查找领京豆成功')) {
      FloatyInstance.setFloatyInfo({
        x: 500,
        y: 500
      }, '查找领京豆失败，准备点击 我的')
      let mine = widgetUtils.widgetGetOne(jingdongConfig.mine || '我的')
      if (this.displayButtonAndClick(mine, '我的')) {
        let entry = widgetUtils.widgetGetOne(jingdongConfig.mine_entry || '京豆')
        entered = !!this.displayButtonAndClick(entry)
      }
    } else {
      entered = true
    }
    if (!entered) {
      FloatyInstance.setFloatyInfo({
        x: 500, y: 500
      }, '无法找到指定控件，签到失败')
      sleep(2000)
    }
    sleep(1500)
    return widgetUtils.widgetWaiting('领京豆', 3000)
  }

  /**
   * 执行签到
   * @returns 
   */
  this.execCollectBean = function () {
    if (this.isSubTaskExecuted(SIGN)) {
      return
    }

    let doSignBtn = widgetUtils.widgetGetOne(jingdongConfig.sign_button || '.*(签到领|已签到|已连签|明天签到).*')
    if (doSignBtn) {
      let content = doSignBtn.desc() || doSignBtn.text()
      if (new RegExp(jingdongConfig.already_signed || '(已签到|已连签|明天签到).*').test(content)) {
        this.displayButton(doSignBtn, '今日已完成签到')
      } else {
        this.displayButtonAndClick(doSignBtn, '完成签到')
      }
      FloatyInstance.setFloatyText('验证是否完成签到')
      if (widgetUtils.widgetWaiting(jingdongConfig.already_signed || '(已签到|已连签|明天签到).*')) {
        this.setSubTaskExecuted(SIGN)
      } else {
        FloatyInstance.setFloatyText('无法验证是否正确签到')
      }
    }
  }

  /**
   * 执行种豆得豆
   *
   * @returns 
   */
  this.execPlantBean = function () {
    if (this.isSubTaskExecuted(BEAN)) {
      return
    }
    let entryPoint = {
      x: jingdongConfig.plant_bean_enter_x | this.cvt(1000), y: jingdongConfig.plant_bean_enter_y | this.cvt(1300)
    }
    FloatyInstance.setFloatyInfo(entryPoint, '种豆得豆入口')
    automator.click(entryPoint.x, entryPoint.y)
    sleep(1000)
    if (!widgetUtils.widgetWaiting('豆苗成长值')) {
      FloatyInstance.setFloatyInfo({ x: 500, y: 500 }, '查找 豆苗成长值 失败')
      return
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
      
      if (remain >= 120) {
        logUtils.logInfo(['倒计时：{} 超过两小时，设置两小时后来检查', remain])
        remain = 120
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

  this.exec = function () {
    startApp()
    this.awaitAndSkip()
    if (this.openBeanPage()) {
      // 等待加载动画
      sleep(1000)
      // 京豆签到
      this.execCollectBean()
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
