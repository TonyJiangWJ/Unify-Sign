let { config } = require('../config.js')(runtime, this)

let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let signTaskService = singletonRequire('SignTaskService')
let signTaskManager = singletonRequire('SignTaskManager')
let logUtils = singletonRequire('LogUtils')
let formatDate = require('../lib/DateUtil.js')
function MainExecutor () {

  this.exec = function () {
    // let enabledSigns = config.supported_signs.filter(target => target.enabled)
    if (config.supported_signs && config.supported_signs.length > 0) {
      let restart = false
      let failedList = []
      config.supported_signs.forEach(target => {
        debugInfo(['准备执行：{} enabled: {}', target.name, target.enabled])
        if (target.enabled == false || target.enabled == 'false') {
          debugInfo(['任务已禁用 标记为已禁用 {}', target.name])
          signTaskManager.markScheduleDisabled(target.taskCode)
          return
        }
        try { 
          if (!require('./' + target.script).setName(target.name).setTaskCode(target.taskCode).setSubTasks(target.subTasks).executeIfNeeded()) {
            failedList.push(target.name)
            restart = true
          }
        } catch (e) {
          logUtils.errorInfo('执行异常，' + e)
          FloatyInstance.setFloatyInfo({ x: config.device_width * 0.4, y: config.device_height / 2 }, target.name + ' 执行异常，请检查代码')
          commonFunctions.minimize()
          sleep(1000)
          commonFunctions.printExceptionStack(e)
        }
      })
      FloatyInstance.setFloatyPosition(config.device_width * 0.4, config.device_height / 2)
      if (restart) {
        // 有任务执行失败，延迟五分钟再试一遍
        commonFunctions.setUpAutoStart(5)
        FloatyInstance.setFloatyText('有任务执行失败，设置五分钟后再试')
        logUtils.errorInfo(['执行失败的任务：{}', JSON.stringify(failedList)])
      } else {
        FloatyInstance.setFloatyText('所有签到任务完成')
        regenerateNextStartUp()
      }
      sleep(2000)
    }
  }

  function getEnabledTasks() {
    let enabledTasks = {}
    config.supported_signs.filter(target => target.enabled)
    .forEach(taskInfo => {
      enabledTasks[taskInfo.taskCode] = taskInfo
      if (taskInfo.subTasks && taskInfo.subTasks.length > 0) {
        taskInfo.subTasks.forEach(subTask => {
          enabledTasks[taskInfo.taskCode+':'+subTask.taskCode] = taskInfo
        })
      }
    })
    return enabledTasks
  }

  function regenerateNextStartUp () {
    let now = new Date()
    let date = formatDate(now, 'yyyy-MM-dd')
    let scheduleList = signTaskService.listTaskScheduleByDate(date)
    let enabledTasks = getEnabledTasks()
    scheduleList = scheduleList.filter(schedule => {
      let statusFlag = schedule.executeStatus != 'S' && schedule.executeStatus != 'F' && !!enabledTasks[schedule.taskCode]
      if (statusFlag) {
        // 如果有子任务 以子任务的状态为准
        let subTaskSchedules = signTaskService.listSubTaskScheduleByDate(date, schedule.taskCode)
        return !subTaskSchedules || subTaskSchedules.length <= 0
      }
      return statusFlag
    })
    if (scheduleList.length > 0) {
      let nextExecuteTime = scheduleList[0].executeTime
      if (nextExecuteTime <= now.getTime() + 5 * 60000) {
        logUtils.infoLog(['距离下一次运行时间【{}】小于五分钟，设置五分钟后执行', formatDate(new Date(nextExecuteTime))])
        commonFunctions.setUpAutoStart(5)
      } else {
        logUtils.infoLog(['下一次运行时间【{}】', formatDate(new Date(nextExecuteTime))])
        commonFunctions.setUpAutoStart((nextExecuteTime - now.getTime()) / 60000)
      }
    } else {
      logUtils.infoLog('今日所有签到任务完成')
    }
  }
}
module.exports = new MainExecutor()