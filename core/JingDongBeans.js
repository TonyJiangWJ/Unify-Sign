
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)

let WidgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')

let BaseSignRunner = require('./BaseSignRunner.js')
function BeanCollector () {
  BaseSignRunner.call(this)
  const _package_name = 'com.jingdong.app.mall'
  this.retryTime = 0

  /***********************
   * 综合操作
   ***********************/

  // 进入京东app
  function startApp () {
    logInfo('启动京东应用')
    launch(_package_name)
    sleep(1000)
  }

  this.execCollectBean = function () {
    let homePageCollectWidget = WidgetUtils.widgetGetOne('领京豆')
    let entered = false
    if (!this.displayButtonAndClick(homePageCollectWidget, '查找领京豆成功')) {
      FloatyInstance.setFloatyInfo({
        x: 500,
        y: 500
      }, '查找领京豆失败，准备点击 我的')
      let mine = WidgetUtils.widgetGetOne('我的')
      if (this.displayButtonAndClick(mine, '我的')) {
        let entry = WidgetUtils.widgetGetOne('京豆')
        entered = !!this.displayButtonAndClick(entry)
      }
    } else {
      entered = true
    }
    if (entered) {
      let doSignBtn = WidgetUtils.widgetGetOne('去签到领京豆|(已签到|已连签.*|明天签到.*)')
      if (doSignBtn) {
        let content = doSignBtn.desc() || doSignBtn.text()
        if (/已连签.*|明天签到.*/.test(content)) {
          this.displayButton(doSignBtn, '今日已完成签到')
        } else {
          this.displayButtonAndClick(doSignBtn, '完成签到')
        }
        this.setExecuted()
        return true
      }
    } else {
      FloatyInstance.setFloatyInfo({
        x: 500, y: 500
      }, '无法找到指定控件，签到失败')
      sleep(2000)
      return false
    }
  }

  this.exec = function () {
    startApp()
    this.awaitAndSkip()
    if (!this.execCollectBean()) {
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
