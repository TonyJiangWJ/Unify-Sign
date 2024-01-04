let { config } = require('../../config.js')(runtime, global)
let sRequire = require('../SingletonRequirer.js')(runtime, global)
let fileUtils = sRequire('FileUtils')
let logUtils = sRequire('LogUtils')
let commonFunction = sRequire('CommonFunction')
let formatDate = require('../DateUtil.js')

function SignFailedUtil () {
  let currentPath = fileUtils.getCurrentWorkPath()

  this.recordFailedScreen = function (screen, taskCode, stepName) {
    if (!config.record_failed_info) {
      return
    }
    let base64Str = images.toBase64(screen)
    let fileDirPath = 'logs/signFailedImg/' + formatDate(new Date(), 'yyyyMMdd')
    let timePrepend = formatDate(new Date(), 'HHmmss')
    let fileName = taskCode + '_' + stepName + timePrepend + '.log'
    let savePath = currentPath + '/' + fileDirPath + '/' + fileName
    files.ensureDir(savePath)
    files.write(savePath, base64Str)
    logUtils.debugInfo(['已记录当前截图信息到：{}', savePath])
  }

  this.recordFailedWidgets = function (taskCode, stepName) {
    if (!config.record_failed_info) {
      return
    }
    ui.run(function () {
      engines.execScriptFile(currentPath + "/独立工具/获取当前页面的布局信息.js", {
        path: currentPath + "/独立工具/", arguments: {
          immediate: true,
          capture: true,
          save_data_js: false,
          save_history: true,
          save_img_js: false,
          no_dialog: true,
          record_path: taskCode + "_" + stepName
        }
      })
    })
    commonFunction.commonDelay(1, '截取当前控件信息', false, true)
  }

}

module.exports = new SignFailedUtil()
