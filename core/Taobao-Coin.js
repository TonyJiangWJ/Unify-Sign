let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')
let logUtils = singletonRequire('LogUtils')

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
    let coinButton = widgetUtils.widgetGetOne('领淘金币')
    if (coinButton) {
      this.displayButtonAndClick(coinButton, '准备进入领淘金币')
      // 比较坑爹的 要等好久才会出现控件
      sleep(5000)
      FloatyInstance.setFloatyText('准备查找签到领金币按钮')

      let result = widgetUtils.alternativeWidget(/\s*今日签到\s*/, '.*明早7点可领|明日签到.*', null, true)
      if (result.value === 1) {
        let signButton = result.target
        if (signButton) {
          this.displayButtonAndClick(signButton, '找到了签到按钮 ' + result.content)
          sleep(2000)
          if (widgetUtils.widgetWaiting(/\s*明日签到\s*/)) {
            this.setExecuted()
          } else {
            logUtils.warnInfo(['未找到明日签到按钮，可能未成功签到'])
          }
        }
      } else if (result.value === 2) {
        this.displayButton(result.target, '明日签到 ' + result.content)
        this.setExecuted()
      } else {
        FloatyInstance.setFloatyText('未找到有效信息，签到失败')
        sleep(1000)
      }
      FloatyInstance.setFloatyText('准备查找是否有购物返')
      let rewordByPurchase = widgetUtils.widgetGetOne('购物返')
      if (rewordByPurchase) {
        this.displayButtonAndClick(rewordByPurchase, '找到了购物返')
      } else {
        FloatyInstance.setFloatyText('未找到有购物返')
      }
    }
  }

  this.launchTown = function () {
    app.startActivity({
      action: 'android.intent.action.VIEW',
      data: 'taobao://pages.tmall.com/wow/z/tmtjb/town/task',
      packageName: _package_name
    })
    sleep(500)
  }

  /**
   * deprecated 
   */
  this.checkAndCollectTown = function () {
    let getReword = widgetUtils.widgetGetOne('领取奖励')
    while (getReword) {
      this.displayButtonAndClick(getReword, '领取奖励')
      sleep(500)
      getReword = widgetUtils.widgetGetOne('领取奖励')
    }
    sleep(1000)
    let countdown = widgetUtils.widgetGetOne(/\d{2}:\d{2}:\d{2}/, 2000, true)
    if (countdown) {
      this.displayButton(countdown.target, '倒计时:' + countdown.content)
      let leftCheck = /(\d{2}):(\d{2}):(\d{2})/.exec(countdown.content)
      let leftTime = parseInt(leftCheck[1]) * 60 + parseInt(leftCheck[2])
      this.setExecuted(this.name + '_town', leftTime)
      // 增加十分钟
      commonFunctions.setUpAutoStart(leftTime + 10)
    } else {
      this.setExecuted(this.name + '_town')
    }
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