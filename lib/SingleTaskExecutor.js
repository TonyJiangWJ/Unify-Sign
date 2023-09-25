let { config } = require('../config.js')(runtime, global)
let singletonRequire = require('./SingletonRequirer.js')(runtime, global)
let logUtils = singletonRequire('LogUtils')
let FloatyInstance = singletonRequire('FloatyUtil')
let commonFunctions = singletonRequire('CommonFunction')
let runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
// 部分代码可能直接使用了，懒得排查，顶层导入一下日志方法
let { logInfo, errorInfo, warnInfo, debugInfo, infoLog, debugForDev, flushAllLogs } = logUtils

let executeArguments = engines.myEngine().execArgv
let taskInfo = executeArguments.taskInfo
logUtils.debugInfo(['准备执行任务：{}', taskInfo.taskCode + ':' + taskInfo.taskName])
let path = files.path('../core/' + taskInfo.script)
logUtils.debugInfo(['路径：{}', path])
if (!files.exists(path)) {
  toastLog('目标任务不存在' + path)
  exit()
}
runningQueueDispatcher.addRunningTask()
FloatyInstance.setFloatyInfo({ x: config.device_width * 0.4, y: config.device_height / 2 }, '准备执行 ' + taskInfo.taskName)

if (!commonFunctions.ensureAccessibilityEnabled()) {
  logUtils.errorInfo('获取无障碍权限失败')
  exit()
}

logUtils.logInfo('======初始化SQLite=======')
let signTaskService = singletonRequire('SignTaskService')
// 初始化数据库连接
signTaskService.init()

// 请求截图权限
commonFunctions.requestScreenCaptureOrRestart(true)



try {
  require(path).setName(taskInfo.name)
    .setTaskCode(taskInfo.taskCode)
    .setSubTasks(taskInfo.subTasks).exec()
} catch (e) {
  logUtils.errorInfo('执行异常，' + e)
  FloatyInstance.setFloatyInfo({ x: config.device_width * 0.4, y: config.device_height / 2 }, taskInfo.name + ' 执行异常，请检查代码')
  commonFunctions.minimize()
  sleep(1000)
  commonFunctions.printExceptionStack(e)
}
runningQueueDispatcher.removeRunningTask()