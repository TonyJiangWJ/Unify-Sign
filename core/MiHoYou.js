let { config } = require('../config.js')(runtime, global)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  let _package_name = 'com.mihoyo.hyperion'
  let _icon_img = config.mihoyo_config.reward_icon

  this.openMiHoYouPage = function () {
    commonFunctions.launchPackage(_package_name, false)
    this.awaitAndSkip(['\\s*允许\\s*', '\\s*跳过\\s*', '.*知道了.*', '下次再说'])
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
