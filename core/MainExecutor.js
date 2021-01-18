let { config } = require('../config.js')(runtime, this)

let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
function MainExecutor () {

  this.exec = function () {
    let enabledSigns = config.supported_signs.filter(target => target.enabled)
    if (enabledSigns && enabledSigns.length > 0) {
      let restart = false
      enabledSigns.forEach(target => {
        debugInfo(['准备执行：{}', target.name])
        FloatyInstance.setFloatyInfo({ x: config.device_width * 0.4, y: config.device_height / 2 }, '准备执行：' + target.name)
        sleep(1000)
        try {
          if (!require('./' + target.script).setName(target.name).executeIfNeeded()) {
            restart = true
          }
        } catch (e) {
          FloatyInstance.setFloatyInfo({ x: config.device_width * 0.4, y: config.device_height / 2 }, target.name + ' 执行异常，请检查代码')
          sleep(1000)
          commonFunctions.printExceptionStack(e)
        }
      })
      FloatyInstance.setFloatyPosition(config.device_width * 0.4, config.device_height / 2)
      if (restart) {
        // 有任务执行失败，延迟五分钟再试一遍
        commonFunctions.setUpAutoStart(5)
        FloatyInstance.setFloatyText('有任务执行失败，设置五分钟后再试')
      } else {
        FloatyInstance.setFloatyText('所有签到任务完成')
      }
      sleep(2000)
    }
  }
}
module.exports = new MainExecutor()