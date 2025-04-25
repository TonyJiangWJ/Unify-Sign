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
// 日志打印 按需引用
let logUtils = singletonRequire('LogUtils')
// 本地OCR工具 按需引用
let localOcrUtil = require('../lib/LocalOcrUtil.js')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)

  this.packageName = 'com.sgcc.wsgw.cn'

  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // ...
    // 在这里写签到执行的代码
    // ...
    this.openPackageAndSkipDialog(this.packageName)
    this.pushLog('等待界面打开')
    sleep(1000)
    this.waitIfShowDialog()
    if (widgetUtils.widgetWaiting('签到', 8000)) {
      this.pushLog('打开完成，等待1秒')
      sleep(1000)
    } else {
      this.pushErrorLog('无法找到 签到 控件')
    }
    if (this.displayButtonAndClick(widgetUtils.widgetGetOne('签到'))) {
      sleep(1000)
      let success = false
      this.pushLog('查找签到成功控件')
      if (this.displayButton(widgetUtils.widgetGetOne('签到成功'))) {
        success = true
      } else {
        this.pushLog('未找到 签到成功 控件 可能今天已经签到完成')
        if (this.displayButton(widgetUtils.widgetGetOne('您本月已累计签到.*'))) {
          success = true
        } else {
          let today = widgetUtils.widgetGetOne('今日', 1000)
          if (today) {
            let container = today.parent()
            let imgView = selector().className('android.widget.Image').findOf(container)
            logUtils.debugInfo(['查找Image控件结果: {}', imgView])
            if (!imgView) {
              this.pushLog('今日签到已完成')
              success = true
            }
          }
        }
        if (!success) {
          if (this.captureAndCheckByOcr('您本月已累计签到.*')) {
            this.pushLog('ocr校验签到完成')
            success = true
          }
        }
      }
      // 执行成功后触发 标记当前任务已完成 失败了请勿调用
      success && this.setExecuted()
      commonFunctions.minimize()
    }
  }

  this.waitIfShowDialog = function () {
    let tareget = widgetUtils.widgetGetOne('今日不再出现', 2000)
    if (tareget) {
      this.pushLog('存在弹窗信息')
      target = widgetUtils.widgetGetOne('未选定今日不再出现', 1000)
      this.displayButtonAndClick(target, '不再出现')
      target = widgetUtils.widgetGetOne('关闭', 1000)
      if (!this.displayButtonAndClick(tareget)) {
        this.pushErrorLog('未能找到 关闭 按钮 弹窗无法关闭')
      } else {
        this.pushLog('关闭弹窗')
        target = widgetUtils.widgetGetOne('关闭', 1000)
        if (target) {
          this.pushWarningLog('弹窗关闭失败，尝试无障碍点击')
          target.click()
        }
      }
      sleep(1000)
    }
  }

}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
