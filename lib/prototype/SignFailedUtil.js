let sRequire = require('../SingletonRequirer.js')(runtime, global)
let fileUtils = sRequire('FileUtils')
let logUtils = sRequire('LogUtils')
let formatDate = require('../DateUtil.js')

function SignFailedUtil () {
  let currentPath = fileUtils.getCurrentWorkPath()

  this.recordFailedScreen = function (screen, taskCode, stepName) {
    let base64Str = images.toBase64(screen)
    let fileDirPath = 'logs/signFailedImg/' + formatDate(new Date(), 'yyyyMMdd')
    let timePrepend = formatDate(new Date(), 'HHmmss')
    let fileName = taskCode + '_' + stepName + timePrepend + '.log'
    let savePath = currentPath + '/' + fileDirPath + '/' + fileName
    files.ensureDir(savePath)
    files.write(savePath, base64Str)
    logUtils.debugInfo(['已记录当前截图信息到：{}', savePath])
  }

}

module.exports = new SignFailedUtil()
