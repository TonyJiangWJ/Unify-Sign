
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

  /***********************
   * 综合操作
   ***********************/

  // 进入京东app
  const startApp = function () {
    logInfo('启动京东应用')
    launch(_package_name)
    sleep(1000)
  }

  const waitingAndGet = function (val, t, containType) {
    WidgetUtils.widgetWaiting(val, null, t)
    return WidgetUtils.widgetGetOne(val, t, containType)
  }

  /**
   * 尝试进入
   * 
   * @param {object} preAction 前一个点击的操作目标
   * @param {string} targetContent 校验需要等待的文本
   */
  const tryEnter = function (preAction, targetContent) {
    let retry = 0
    let target = waitingAndGet(targetContent)
    while (target === null && preAction !== null && retry++ <= 5) {
      automator.clickCenter(preAction)
      sleep(500)
      target = waitingAndGet(targetContent)
    }
    if (target === null) {
      errorInfo(['查找「{}」失败', targetContent], true)
      FloatyInstance.setFloatyInfo({
        x: 500, y: 500
      }, '查找' + targetContent + '失败')
      sleep(1000)
      if (preAction === null) {
        errorInfo('前置操作失败！！！')
        FloatyInstance.setFloatyInfo({
          x: 500, y: 500
        }, '前置操作失败！！！')
        sleep(1000)
      }
    } else {
      infoLog(['查找「{}」成功', targetContent], true)
      FloatyInstance.setFloatyInfo({
        x: target.bounds().centerX(),
        y: target.bounds().centerY()
      }, '查找' + targetContent + '成功')
      sleep(1000)
      automator.clickCenter(target)
    }
    return target
  }

  this.execCollectBean = function () {
    let homePageCollectWidget = WidgetUtils.widgetGetOne('领京豆')
    let beans = null
    if (homePageCollectWidget) {
      FloatyInstance.setFloatyInfo({
        x: homePageCollectWidget.bounds().centerX(),
        y: homePageCollectWidget.bounds().centerY()
      }, '查找领京豆成功')
      sleep(1000)
      automator.clickCenter(homePageCollectWidget)
      beans = homePageCollectWidget
    } else {
      FloatyInstance.setFloatyInfo({
        x: 500,
        y: 500
      }, '查找领京豆失败，准备点击 我的')
      sleep(1000)
      let mine = WidgetUtils.widgetGetOne('我的')
      if (mine) {
        automator.clickCenter(mine)
        sleep(2000)
      }
      let toCollect = tryEnter(mine, '京豆')
      if (toCollect) {
        beans = tryEnter(toCollect, '去签到领京豆|(已签到|已连签.*|明天签到.*)')
        if (!beans) {
          return false
        }
        let content = beans.desc() || beans.text()
        if (/已连签.*|明天签到.*/.test(content)) {
          this.setExecuted()
          FloatyInstance.setFloatyInfo({
            x: beans.bounds().centerX(),
            y: beans.bounds().centerY()
          }, '今日已完成签到')
          sleep(1000)
          return true
        }
      }
    }
    if (beans) {
      let doCollect = tryEnter(beans, '签到领.*豆|(已签到|已连签.*|明天签到.*)')
      if (!doCollect) {
        return false
      }
      let content = doCollect.desc() || doCollect.text()
      if (/已连签.*|明天签到.*/.test(content)) {
        this.setExecuted()
        FloatyInstance.setFloatyInfo({
          x: doCollect.bounds().centerX(),
          y: doCollect.bounds().centerY()
        }, '今日已完成签到')
        sleep(1000)
        return true
      }
      FloatyInstance.setFloatyInfo({
        x: doCollect.bounds().centerX(),
        y: doCollect.bounds().centerY()
      }, '完成签到')
      sleep(1000)
      automator.clickCenter(doCollect)
      this.setExecuted()
      return true
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
