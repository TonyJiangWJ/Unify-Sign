/**
 * 微博签到
 */
let { config } = require('../config.js')(runtime, global)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let FloatyInstance = singletonRequire('FloatyUtil')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let commonFunctions = singletonRequire('CommonFunction')
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')

function SignRunner () {
  let signImg = config.weibo_config.sign_btn
  let mineBtn = config.weibo_config.mine_btn
  let mineCheckedBtn = config.weibo_config.mine_checked_btn
  let signedIcon = config.weibo_config.signed_icon
  BaseSignRunner.call(this)
  let _package_name = 'com.sina.weibo'

  this.exec = function () {
    launch(_package_name)
    sleep(1000)
    this.awaitAndSkip(['\\s*允许\\s*', '\\s*取消\\s*'])
    FloatyInstance.setFloatyText('准备查找 我')
    let clickMine = null
    if (localOcrUtil.enabled) {
      FloatyInstance.setFloatyText('准备用OCR方式查找')
      sleep(1000)
      clickMine = this.captureAndCheckByOcr('^我$', '我', [config.device_width / 2, config.device_height * 0.7])
    }
    if (!clickMine) {
      clickMine = this.captureAndCheckByImg(mineBtn, '我')
      if (!clickMine) {
        clickMine = this.captureAndCheckByImg(mineCheckedBtn, '我')
      }
    }
    if (clickMine) {
      automator.click(clickMine.centerX(), clickMine.centerY())
      sleep(1000)
      if (this.captureAndCheckByImg(signImg, '签到', null, true)) {
        this.setExecuted()
      } else {
        FloatyInstance.setFloatyText('未找到 签到按钮')
        if (this.captureAndCheckByImg(signedIcon, '已完成签到')) {
          this.setExecuted()
        }
      }
    } else {
      FloatyInstance.setFloatyText('未找到 我')
      if (this.restartLimit-- >= 0) {
        FloatyInstance.setFloatyText('未找到 我 准备重开应用')
        commonFunctions.killCurrentApp()
        sleep(2000)
        this.exec()
      }
    }
    sleep(3000)
    !config._debugging && commonFunctions.minimize(_package_name)
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()