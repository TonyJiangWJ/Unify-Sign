/*
 * @Author: TonyJiangWJ
 * @Date: 2020-09-18 13:40:43
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-09-22 19:36:30
 * @Description: 免费版专用
 */
module.exports = function (runtime, scope) {
  if (context.getPackageName() !== 'org.autojs.autojspro') {
    var modules = ["$zip", "$base64", "$crypto", "$power_manager"]
    var len = modules.length
    for (var i = 0; i < len; i++) {
      var m = modules[i]
      if (typeof scope[m] === 'undefined') {
        let module = require('./__' + m + '__')(runtime, scope)
        scope[m] = module
      }
    }
  }
}