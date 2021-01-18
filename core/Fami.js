let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let FloatyInstance = singletonRequire('FloatyUtil')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let commonFunctions = singletonRequire('CommonFunction')

let BaseSignRunner = require('./BaseSignRunner.js')

function SignRunner () {
  BaseSignRunner.call(this)
  let _package_name = 'com.x2era.xcloud.app'
  this.exec = function () {
    launch(_package_name)
    sleep(1000)
    this.awaitAndSkip()
    let closeButton = widgetUtils.widgetGetById('com.x2era.xcloud.app:id/iv_close', 4000)
    if (closeButton) {
      FloatyInstance.setFloatyInfo({
        x: closeButton.bounds().centerX(),
        y: closeButton.bounds().centerY()
      }, '找到了关闭按钮')
      sleep(500)
      FloatyInstance.setFloatyText('点击关闭')
      automator.clickCenter(closeButton)
    } else {
      FloatyInstance.setFloatyInfo({
        x: 500,
        y: 1000
      }, '未找到关闭按钮')
      sleep(500)
    }
    let signButton = widgetUtils.widgetGetOne('签到')
    if (signButton) {
      FloatyInstance.setFloatyInfo({
        x: signButton.bounds().centerX(),
        y: signButton.bounds().centerY()
      }, '签到')
      sleep(500)
      FloatyInstance.setFloatyText('点击进入')
      automator.clickCenter(signButton)
      sleep(500)
      if (widgetUtils.widgetWaiting('已连续签到')) {
        if (widgetUtils.widgetCheck('明日再来', 1000)) {
          FloatyInstance.setFloatyInfo({
            x: 500,
            y: 1000
          }, '今日已签到，退出执行')
          sleep(2000)
          this.setExecuted()
          return
        }
        let doSignButton = widgetUtils.widgetGetById('com.x2era.xcloud.app:id/tv_sign_confirm')
        if (doSignButton) {
          FloatyInstance.setFloatyInfo({
            x: doSignButton.bounds().centerX(),
            y: doSignButton.bounds().centerY()
          }, '找到了签到按钮，点击')
          sleep(500)
          automator.clickCenter(doSignButton)
          let regex = /恭喜您获得(\d+)个发米粒/
          let success = widgetUtils.widgetGetOne(regex)
          if (success) {
            let result = regex.exec(success.text())
            infoLog(['签到成功，共获得{}个米粒', result[1]])
            FloatyInstance.setFloatyText('签到成功')
          } else {
            FloatyInstance.setFloatyText('未获取到签到成功信息，可能已经签到过了')
          }
          this.setExecuted()
        } else {
          FloatyInstance.setFloatyText('未找到签到按钮')  
        }
      } else {
        FloatyInstance.setFloatyText('点击签到页面失败')
      }
    } else {
      FloatyInstance.setFloatyInfo({
        x: 500,
        y: 1000
      }, '未找到签到按钮')
    }
    sleep(3000)
    commonFunctions.minimize(_package_name)
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype) 
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()