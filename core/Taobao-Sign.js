let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)
  const _package_name = 'com.taobao.taobao'

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
      this.setExecuted()
    } else {
      logUtils.warnInfo(['未找到签到按钮'])
    }
  }

  this.checkDailySign = function () {
    sleep(1000)
    let screen = commonFunctions.captureScreen()
    if (screen && localOcrUtil.enabled) {
      let find = localOcrUtil.recognizeWithBounds(screen, null, '.*立即签到.*')
      if (find && find.length > 0) {
        let bounds = find[0].bounds
        FloatyInstance.setFloatyInfo({ x: bounds.centerX(), y: bounds.centerY() }, '立即签到')
        sleep(1000)
        automator.click(bounds.centerX(), bounds.centerY())
        sleep(1000)
      } else {
        FloatyInstance.setFloatyText('未找到立即签到')
        sleep(1000)
      }
    } else {
      warnInfo(['获取截图失败或不支持OCR 暂未实现 相应签到逻辑'])
    }
  }

  this.checkCountdownBtn = function (waitForNext) {
    sleep(1000)
    let plusOneHundred = widgetUtils.widgetGetOne('\\+100', null, null, null, matcher => matcher.boundsInside(config.device_width / 2, 0, config.device_width, config.device_height * 0.2))
    if (plusOneHundred) {
      let screen = commonFunctions.captureScreen()
      if (screen && localOcrUtil.enabled) {
        let bounds = plusOneHundred.bounds()
        let find = localOcrUtil.recognizeWithBounds(screen, [bounds.left - bounds.width() / 2, bounds.top, bounds.width() * 2, bounds.width() * 2], /\d+后可领/)
        if (find && find.length > 0) {
          let text = find[0].label
          bounds = find[0].bounds
          FloatyInstance.setFloatyInfo({ x: bounds.centerX(), y: bounds.centerY() }, '剩余时间：' + text)
          sleep(1000)
          let regex = /((\d+(:?)){1,3})后可领/
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
            FloatyInstance.setFloatyInfo({ x: bounds.centerX(), y: bounds.centerY() }, '计算倒计时' + totalSeconds + '秒')
            if (waitForNext) {
              if (totalSeconds < 60) {
                commonFunctions.commonDelay(totalSeconds / 60, '等待元宝')
                this.checkCountdownBtn(true)
              } else {
                this.createNextSchedule(this.taskCode, new Date().getTime() + totalSeconds * 1000)
              }
            }
            sleep(1000)
          }
        } else {
          this.displayButton(plusOneHundred, '可以领100')
          automator.clickCenter(plusOneHundred)
          sleep(1000)
          if (this.closeDialogIfPossible()) {
            logUtils.debugInfo(['+100已经通过弹窗浏览广告'])
          }
          this.checkCountdownBtn(waitForNext)
        }
      }
    }
  }

  this.browseAds = function () {
    sleep(1000)
    let moreCoins = widgetUtils.widgetGetOne('\\+[6789]\\d{3}', null, true, null, matcher => matcher.boundsInside(config.device_width / 2, 0, config.device_width, config.device_height * 0.2))
    if (moreCoins && moreCoins.content > '+6000') {
      this.checkCountdownBtn()
      this.displayButtonAndClick(moreCoins.target, moreCoins.content)
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
        let finished = widgetUtils.widgetGetOne('已完成')
        // 点进去 然后返回
        if (this.displayButtonAndClick(finished, '已完成')) {
          noMore = true
          sleep(1000)
          automator.back()
        }
      }
      sleep(1000)
      if (this.closeDialogIfPossible()) {
        logUtils.debugInfo(['已经通过弹窗浏览广告'])
      }
      this.checkCountdownBtn()
      sleep(1000)
      if (!noMore) {
        this.browseAds()
      }
    } else {
      logUtils.debugInfo(['逛一逛任务已完成，查找+100并设置定时任务'])
      this.checkCountdownBtn(true)
    }
  }

  this.doBrowsing = function () {
    let startY = config.device_height - config.device_height * 0.15
    let endY = startY - config.device_height * 0.3
    automator.gestureDown(startY, endY)
    let start = new Date().getTime()
    while (widgetUtils.widgetWaiting('滑动浏览', null, 5000) && new Date().getTime() - start < 40000) {
      sleep(4000)
      automator.gestureDown(startY, endY)
    }
    FloatyInstance.setFloatyText('浏览完成')
  }



  this.closeDialogIfPossible = function () {
    let toUse = widgetUtils.alternativeWidget('去使用', '立即赚元宝', 3000, true)
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