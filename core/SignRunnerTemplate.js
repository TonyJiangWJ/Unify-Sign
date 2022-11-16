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

  /**
   *  扩展exec代码 实现具体的签到逻辑
   */
  this.exec = function () {
    // ...
    // 在这里写签到执行的代码
    // ...

    // 执行成功后触发 标记当前任务已完成 失败了请勿调用
    this.setExecuted()
  }
  
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype)
SignRunner.prototype.constructor = SignRunner
module.exports = new SignRunner()
