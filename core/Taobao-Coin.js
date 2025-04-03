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

  this.checkAndCollect = function (doNotRetry) {
    let mineBtn = this.captureAndCheckByOcr('我的淘宝', '我的淘宝', [config.device_width / 2, config.device_height * 0.8, config.device_width / 2, config.device_height * 0.2], 1000, true, 3)
    let coinButton = widgetUtils.widgetGetOne('淘金币')
    if (coinButton) {
      this.displayButtonAndClick(coinButton, '准备进入领淘金币')
      // 比较坑爹的 要等好久才会出现控件
      sleep(5000)
      FloatyInstance.setFloatyText('准备查找签到领金币按钮')
      let getByWidget = widgetUtils.widgetGetOne('点击签到', 2000)
      if (this.displayButtonAndClick(getByWidget, '点击签到')) {
        this.setExecuted()
        this.pushLog('今日已完成签到 by widget')
        return
      } else {
        if (this.displayButton(widgetUtils.widgetGetOne('明天可领', 1000))) {
          this.pushLog('今日已完成签到')
          this.setExecuted()
          return
        }
      }
      if (this.captureAndCheckByOcr('(今日|点击)签到', '今日签到', null, null, true)) {
        sleep(1000)
        if (this.captureAndCheckByOcr('.*(明早7点可领|明日签到).*', '校验是否完成签到')) {
          this.setExecuted()
          this.pushLog('今日已完成签到')
          return
        }
      }
      let result = widgetUtils.alternativeWidget(/\s*今日签到\s*/, '.*明早7点可领|\\d+.*明日签到.*', null, true)
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
      let rewordByPurchase = widgetUtils.widgetGetOne('.*收货奖励.*')
      if (rewordByPurchase) {
        this.displayButtonAndClick(rewordByPurchase, '找到了购物返')
      } else {
        FloatyInstance.setFloatyText('未找到有购物返')
      }
    } else if (!doNotRetry) {
      this.launchTaobao(_package_name)
      this.checkAndCollect(true)
    }
  }

  this.sign88Vip = function () {
    this.pushLog('进行88VIP每日积分签到')
    if (this.displayButtonAndClick(widgetUtils.widgetGetOne('88VIP'))) {
      this.pushLog('查找每日签到')
      sleep(1000)
      let result = widgetUtils.alternativeWidget(/每日签到/, /签到成功/, null, true)
      if (result.value === 1) {
        if (this.displayButtonAndClick(result.target)) {
          this.pushLog('进入每日签到页面')
          sleep(1000)
          automator.back()
        }
      } else {
        if (result.value == 2) {
          this.pushLog('今日签到已成功')
        } else {
          this.pushLog('未能找到 每日签到')
          this.pushLog('可能已经签到成功，回到淘宝首页')
        }
      }
      sleep(1000)
      automator.back()
      this.pushLog('回到淘宝首页')
    } else {
      this.pushLog('未能进入88VIP页面')
    }
  }

  this.exec = function () {
    this.launchTaobao(_package_name)
    sleep(1000)
    this.sign88Vip()
    sleep(1000)
    this.checkAndCollect()
    sleep(1000)
    commonFunctions.minimize(_package_name)
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner

module.exports = new SignRunner()