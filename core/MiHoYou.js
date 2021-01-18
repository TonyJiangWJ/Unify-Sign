let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  let _package_name = 'com.mihoyo.hyperion'

  this.openMiHoYouPage = function () {
    commonFunctions.launchPackage(_package_name, false)
    this.awaitAndSkip()
    sleep(500)
    let yuanshen = widgetUtils.widgetGetOne('原神')
    if (yuanshen) {
      FloatyInstance.setFloatyInfo({
        x: yuanshen.bounds().centerX(),
        y: yuanshen.bounds().centerY()
      }, '找到了原神按钮')
    } else {
      FloatyInstance.setFloatyText('未找到原神按钮，尝试获取签到福利按钮')
    }
    sleep(1000)
  }

  this.checkAndCollect = function () {
    let signWidget = widgetUtils.widgetGetOne('签到福利')
    if (!signWidget) {
      FloatyInstance.setFloatyText('未找到签到福利，尝试获取并点击原神按钮')
      sleep(1000)
      let yuanshen = widgetUtils.widgetGetOne('原神')
      FloatyInstance.setFloatyInfo({
        x: yuanshen.bounds().centerX(),
        y: yuanshen.bounds().centerY()
      }, '找到了原神按钮')
      automator.clickCenter(yuanshen)
      sleep(1000)
      signWidget = widgetUtils.widgetGetOne('签到福利')
    }
    if (signWidget) {
      FloatyInstance.setFloatyInfo({
        x: signWidget.bounds().centerX(),
        y: signWidget.bounds().centerY()
      }, '找到了签到福利按钮')
      automator.clickCenter(signWidget)
      sleep(3000)
      let regex = /[xX]\d+第\s*(\d+)\s*天/
      let waitingForSigns = widgetUtils.widgetGetAll(regex, null, true)
      if (waitingForSigns) {
        let targets = waitingForSigns.target
        let isDesc = waitingForSigns.isDesc
        let targetSign = targets.map(t => {
          let content = isDesc ? t.desc() : t.text()
          let day = parseInt(regex.exec(content)[1])
          debugInfo(['签到日期：{} {}', content, day])
          return {
            day: day,
            content: content,
            bounds: () => t.bounds()
          }
        }).sort((a, b) => a.day - b.day)[0]
        sleep(1000)

        FloatyInstance.setFloatyInfo({
          x: targetSign.bounds().centerX(),
          y: targetSign.bounds().centerY()
        }, '准备第' + targetSign.day + '天签到')
        automator.clickCenter(targetSign)
        sleep(1000)
        FloatyInstance.setFloatyText('签到执行完毕')
        sleep(1000)
        this.setExecuted()
      }
    } else {
      FloatyInstance.setFloatyText('未找到签到福利按钮 结束执行')
      sleep(1000)
    }
  }

  this.exec = function () {
    FloatyInstance.setFloatyPosition(400, 400)
    FloatyInstance.setFloatyText('准备打开米游社')
    this.openMiHoYouPage()
    FloatyInstance.setFloatyText('准备签到')
    this.checkAndCollect()
    FloatyInstance.setFloatyText('领取完毕')
    commonFunctions.minimize(_package_name)
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype) 
SignRunner.prototype.constructor = SignRunner

module.exports = new SignRunner()
