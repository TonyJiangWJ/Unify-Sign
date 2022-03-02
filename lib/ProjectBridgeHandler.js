let singletonRequire = require('./SingletonRequirer.js')(runtime, global)
let commonFunctions = singletonRequire('CommonFunction')
module.exports = function (BaseHandler) {
  // 扩展方法 
  BaseHandler.checkExecuted = (data, callbackId) => {
    let name = data.name
    let executedInfo = commonFunctions.getExecutedInfo(name)
    log(name + " executedInfo: " + JSON.stringify(executedInfo))
    postMessageToWebView({ callbackId: callbackId, data: executedInfo })
  }
  BaseHandler.setExecuted = (data, callbackId) => {
    let name = data.name
    commonFunctions.setExecutedToday(name)
    postMessageToWebView({ callbackId: callbackId, data: commonFunctions.getExecutedInfo(name) })
  }
  BaseHandler.markNotExecuted = (data, callbackId) => {
    let name = data.name
    commonFunctions.markNotExecuted(name)
    postMessageToWebView({ callbackId: callbackId, data: commonFunctions.getExecutedInfo(name) })
    ui.loadingWebview.loadUrl('javascript:setVersion("' + getLocalVersion() + '")')
  }
  return BaseHandler
}