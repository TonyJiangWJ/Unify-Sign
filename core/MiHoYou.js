let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  let _package_name = 'com.mihoyo.hyperion'
  let _icon_img = 'data:image/jpeg;base64,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'

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
        FloatyInstance.setFloatyText('进入签到页面成功，准备截图查询是否有可签到内容')
        sleep(1000)
        let screen = commonFunctions.checkCaptureScreenPermission()
        if (screen) {
          screen = images.cvtColor(images.grayscale(screen), 'GRAY2BGRA')
          let point = images.findImage(screen, images.fromBase64(_icon_img))
          if (point) {
            FloatyInstance.setFloatyInfo({
              x: point.x,
              y: point.y
            }, '准备签到')
            sleep(1000)
            automator.click(point.x, point.y)
          } else {
            FloatyInstance.setFloatyText('未找到签到按钮，可能已经签到了')
            sleep(1000)
          }
          FloatyInstance.setFloatyText('签到执行完毕')
          sleep(1000)
          this.setExecuted()
        } else {
          FloatyInstance.setFloatyText('获取截图失败 无法签到')
          sleep(1000)
        }
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
