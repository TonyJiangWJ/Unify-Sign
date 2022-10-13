let { config } = require('../config.js')(runtime, global)
config.save_log_file = false
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, global)
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let signTaskService = singletonRequire('SignTaskService')
let signTaskManager = singletonRequire('SignTaskManager')
let logUtils = singletonRequire('LogUtils')
let formatDate = require('../lib/DateUtil.js')
FloatyInstance.enableLog()
let testTaskCodes = ['TaobaoSign'].reduce((a, b) => { a[b] = 1; return a; }, {})
console.log('测试任务：', JSON.stringify(testTaskCodes))
// let enabledSigns = config.supported_signs.filter(target => target.enabled)
if (config.supported_signs && config.supported_signs.length > 0) {
  let restart = false
  let failedList = []
  config.supported_signs.forEach(target => {
    if (!testTaskCodes[target.taskCode]) {
      return
    }

    logUtils.debugInfo(['准备执行：{}', target.name])
    try {
      let executor = require('../core/' + target.script)
        .setName(target.name)
        .setTaskCode(target.taskCode)
        .setSubTasks(target.subTasks)
      executor.exec()
      if (!executor.executedSuccess) {
        failedList.push(target.name)
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
    FloatyInstance.setFloatyText('有任务执行失败，设置五分钟后再试')
    logUtils.errorInfo(['执行失败的任务：{}', JSON.stringify(failedList)])
  } else {
    FloatyInstance.setFloatyText('所有签到任务完成')
  }
  sleep(2000)
}
