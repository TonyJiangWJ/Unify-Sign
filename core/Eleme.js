/**
 * 签到代码模板
 */

// 配置信息
let { config } = require('../config.js')(runtime, global)
// 单例require 必须引用
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, global)
// 悬浮窗组件 按需引用
let FloatyInstance = singletonRequire('FloatyUtil')
// 找控件专用 按需引用
let widgetUtils = singletonRequire('WidgetUtils')
// 自动执行专用 如点击等 按需引用
let automator = singletonRequire('Automator')
// 大部分的公共方法 按需引用
let commonFunctions = singletonRequire('CommonFunction')
// 本地OCR工具 按需引用
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)
  let _package_name = 'me.ele'

  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    let mine = this.openEleme()
    if (mine) {
      FloatyInstance.setFloatyText('找到了我的按钮')
      automator.clickCenter(mine)
      sleep(1000)
      FloatyInstance.setFloatyText('尝试通过类名获取赚吃货豆控件')
      let rewardButton = selector().className('android.view.ViewGroup').clickable()
        .drawingOrder(1).depth(22)
        .boundsInside(0, 0.35 * config.device_height, 0.3 * config.device_width, 0.7 * config.device_height)
        .findOne(config.timeout_findOne)
      if (rewardButton) {
        let boundsInfo = rewardButton.bounds()
        FloatyInstance.setFloatyInfo({x: boundsInfo.centerX(), y: boundsInfo.centerY()}, '成功获取赚吃货豆控件')
        sleep(500)
        automator.clickCenter(rewardButton)
        sleep(1000)
        let signBtn = widgetUtils.widgetGetOne('立即签到')
        if(signBtn) {
          boundsInfo = signBtn.bounds()
          FloatyInstance.setFloatyInfo({x: boundsInfo.centerX(), y: boundsInfo.centerY()}, '立即签到')
          sleep(500)
          automator.clickCenter(signBtn)
          this.setExecuted()
        } else {
          FloatyInstance.setFloatyText('未找到立即签到按钮')
          let signed = widgetUtils.widgetGetOne('今日已签到.*')
          if (signed) {
            FloatyInstance.setFloatyText('今日已签到')
            this.setExecuted()
          }
        }
      } else {
        FloatyInstance.setFloatyText('未找到赚吃货豆按钮')
      }
    } else {
      FloatyInstance.setFloatyText('未找到我的按钮')
    }
    sleep(1000)
    commonFunctions.minimize()
  }

  this.openEleme = function () {
    commonFunctions.launchPackage(_package_name)
    sleep(500)
    FloatyInstance.setFloatyText('校验是否有打开确认弹框')
    let confirm = widgetUtils.widgetGetOne(/^打开$/, 3000)
    if (confirm) {
      this.displayButtonAndClick(confirm, '找到了打开按钮')
    } else {
      FloatyInstance.setFloatyText('没有打开确认弹框')
    }
    return widgetUtils.widgetGetOne('我的')
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
