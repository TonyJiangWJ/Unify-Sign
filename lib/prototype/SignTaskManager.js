let { config } = require('../../config.js')(runtime, global)
let formatDate = require('../DateUtil.js')
let singletonRequire = require('../SingletonRequirer.js')(runtime, global)
let fileUtils = singletonRequire('FileUtils')
let logUtils = singletonRequire('LogUtils')
let commonFunctions = singletonRequire('CommonFunction')
let signTaskService = singletonRequire('SignTaskService')
let NotificationHelper = singletonRequire('Notification')
let rootPath = fileUtils.getCurrentWorkPath()
function SignTaskManager () {
  const SCHEDULE_TYPE = {
    SPECIFY: '1',
    RANDOM: '2',
    GROUPED: '3',
  }
  this.init = function () {
    let taskCodeList = []
    config.supported_signs.forEach(taskInfo => {
      taskCodeList.push(taskInfo.taskCode)
      if (!signTaskService.queryTaskExists(taskInfo.taskCode)) {
        let dbTaskInfo = {
          taskName: taskInfo.name,
          taskCode: taskInfo.taskCode,
          source: rootPath + '/core/' + taskInfo.source,
          enabled: taskInfo.enabled ? '1' : '0',
        }
        let id = signTaskService.insertTaskInfo(dbTaskInfo)
        logUtils.debugInfo(['创建任务信息：{} {} taskId: {}', dbTaskInfo.taskCode, dbTaskInfo.taskName, id])
      }
      if (taskInfo.subTasks && taskInfo.subTasks.length > 0) {
        taskInfo.subTasks.forEach(subTaskInfo => {
          taskCodeList.push(taskInfo.taskCode + ':' + subTaskInfo.taskCode)
          if (signTaskService.queryTaskExists(taskInfo.taskCode + ':' + subTaskInfo.taskCode)) {
            return
          }
          let dbSubTaskInfo = {
            taskName: subTaskInfo.taskName,
            taskCode: taskInfo.taskCode + ':' + subTaskInfo.taskCode,
            parentTaskCode: taskInfo.taskCode,
            enabled: subTaskInfo.enabled ? '1' : '0',
          }
          let id = signTaskService.insertTaskInfo(dbSubTaskInfo)
          logUtils.debugInfo(['创建子任务信息：{} {} taskId: {}', dbSubTaskInfo.taskCode, dbSubTaskInfo.taskName, id])
        })
      }
    })
    signTaskService.listTaskInfos().forEach(taskInfo => {
      if (taskCodeList.indexOf(taskInfo.taskCode) < 0) {
        logUtils.warnInfo(['任务[{} - {}]已不复存在，删除任务信息', taskInfo.taskCode, taskInfo.taskName])
        signTaskService.deleteTaskInfoByCode(taskInfo.taskCode)
      }
    })
    return this
  }

  this.generateDefaultScheduleConfig = function () {
    // 创建默认分组
    if (!signTaskService.queryGroupExists('DEFAULT')) {
      let groupScheduleConfig = {
        groupName: '默认分组',
        groupCode: 'DEFAULT',
        executeType: SCHEDULE_TYPE.RANDOM,
        start: 8 * 3600000,
        end: 18 * 3600000,
      }
      let id = signTaskService.insertGroupScheduleConfig(groupScheduleConfig)
      logUtils.debugInfo(['生成默认分组执行计划配置：{} configId: {}', groupScheduleConfig.groupCode, id])
    }
    let taskList = signTaskService.listTaskInfos()
    if (taskList && taskList.length > 0) {
      taskList.forEach(taskInfo => {
        let subTasks = signTaskService.listSubTasks(taskInfo.taskCode)
        if (subTasks && subTasks.length > 0) {
          logUtils.debugInfo(['[{}-{}]有{}个子任务 不创建主任务的执行计划', taskInfo.taskCode, taskInfo.taskName, subTasks.length])
          // 对于历史配置，检查并删除主任务的配置数据
          let scheduleConfigList = signTaskService.listTaskScheduleConfigByCode(taskInfo.taskCode)
          if (scheduleConfigList && scheduleConfigList.length > 0) {
            scheduleConfigList.forEach(scheduleConfig => {
              logUtils.debugInfo(['删除任务配置信息，id: {} 结果：{}', scheduleConfig.id, signTaskService.deleteScheduleConfigById(scheduleConfig.id)])
            })
          }
          return
        }
        if (!signTaskService.queryTaskScheduleConfigExists(taskInfo.taskCode)) {
          let scheduleConfig = {
            taskCode: taskInfo.taskCode,
            executeType: taskInfo.parentTaskCode ? SCHEDULE_TYPE.RANDOM : SCHEDULE_TYPE.GROUPED,
            start: 8 * 3600000,
            end: 18 * 3600000,
            sort: 1,
          }
          let id = signTaskService.insertScheduleConfig(scheduleConfig)
          logUtils.debugInfo(['生成默认执行计划配置：{} {}, configId: {}', taskInfo.taskCode, taskInfo.taskName, id])
          // 将主任务和默认分组绑定
          if (!taskInfo.parentTaskCode) {
            signTaskService.bindTaskConfigWithGroup(taskInfo.taskCode, 'DEFAULT')
          }
        }
      })
    }

    return this
  }

  this.generateTaskSchedules = function () {
    let executeDate = formatDate(new Date(), 'yyyy-MM-dd')
    signTaskService.generateGroupSchedules(executeDate)
    let taskList = signTaskService.listTaskInfos()
    // 提取现在支持的任务列表
    let taskCodeList = []
    config.supported_signs.forEach(task => {
      if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach(subTask => {
          taskCodeList.push(task.taskCode + ':' + subTask.taskCode)
        })
      } else {
        taskCodeList.push(task.taskCode)
      }
    })
    logUtils.debugInfo(['当前支持的任务编号列表：{}', JSON.stringify(taskCodeList)])
    if (taskList && taskList.length > 0) {
      taskList.forEach(taskInfo => {
        if (!taskInfo.enabled) {
          logUtils.debugInfo(['任务[{}-{}]未启用 跳过生成执行计划', taskInfo.taskCode, taskInfo.taskName])
          return
        }
        if (taskCodeList.indexOf(taskInfo.taskCode) < 0) {
          logUtils.debugInfo(['任务[{}-{}]不存在 跳过生成执行计划', taskInfo.taskCode, taskInfo.taskName])
          return
        }
        let taskScheduleConfigs = signTaskService.listTaskScheduleConfigByCode(taskInfo.taskCode)
        if (!taskScheduleConfigs || taskScheduleConfigs.length < 1) {
          return
        }
        taskScheduleConfigs.forEach(config => {
          signTaskService.generateTaskSchedule(config, executeDate)
        })
      })
    }

    return this
  }

  this.removeAllSchedules = function () {
    let executeDate = formatDate(new Date(), 'yyyy-MM-dd')
    // 删除分组的执行计划
    let groupSchedules = signTaskService.listGroupScheduleByDate(executeDate)
    if (groupSchedules && groupSchedules.length > 0) {
      logUtils.debugInfo(['当前日期：「{}」已存在的的分组执行计划总数：「{}」', executeDate, groupSchedules.length])
      groupSchedules.forEach(schedule => signTaskService.deleteGroupScheduleById(schedule.id))
    }
    // 删除任务的执行计划
    let taskSchedules = signTaskService.listTaskScheduleByDate(executeDate)
    if (taskSchedules && taskSchedules.length > 0) {
      logUtils.debugInfo(['当前日期：「{}」已存在的的任务执行计划总数：「{}」', executeDate, taskSchedules.length])
      taskSchedules.forEach(schedule => signTaskService.deleteTaskScheduleById(schedule.id))
    }
    return this
  }

  this.removeSchedulesNotExecuted = function () {
    let executeDate = formatDate(new Date(), 'yyyy-MM-dd')
    // 删除分组的执行计划
    let groupSchedules = signTaskService.listGroupScheduleByDate(executeDate)
    if (groupSchedules && groupSchedules.length > 0) {
      logUtils.debugInfo(['当前日期：「{}」已存在的的分组执行计划总数：「{}」', executeDate, groupSchedules.length])
      groupSchedules.forEach(schedule => signTaskService.deleteGroupScheduleById(schedule.id))
    }
    // 删除任务的执行计划
    let taskSchedules = signTaskService.listTaskScheduleByDate(executeDate)
    if (taskSchedules && taskSchedules.length > 0) {
      logUtils.debugInfo(['当前日期：「{}」已存在的的任务执行计划总数：「{}」', executeDate, taskSchedules.length])
      taskSchedules = taskSchedules.filter(schedule => ['A', 'P', 'D'].indexOf(schedule.executeStatus) > -1)
      logUtils.debugInfo(['未执行的执行计划总数：「{}」', taskSchedules.length])
      taskSchedules.forEach(schedule => signTaskService.deleteTaskScheduleById(schedule.id))
    }
    return this
  }

  this.regenerateNextStartUp = function () {
    let scheduleList = getAllPendingScheduleList()
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

  this.exitIfNoTaskToExecute = function () {
    let scheduleList = getAllPendingScheduleList()
    if (scheduleList.length > 0) {
      if (scheduleList[0].executeTime > new Date().getTime() + 5 * 60000) {
        commonFunctions.setUpAutoStart((scheduleList[0].executeTime - new Date().getTime()) / 60000)
        logUtils.logInfo(['无任务到达执行时间，等待调度执行'], true)
        NotificationHelper.createNotification('无任务到达执行时间，等待调度执行', '任务信息：' + scheduleList[0].taskCode + ' 执行时间：' + formatDate(new Date(scheduleList[0].executeTime), 'yyyy-MM-dd HH:mm:ss'))
        exit()
      }
    } else {
      logUtils.logInfo(['今日所有任务执行完毕退出执行'], true)
      exit()
    }
    return this
  }

  /**
   * 将任务标记为已禁用
   *
   * @param {String} taskCode 
   */
  this.markScheduleDisabled = function (taskCode) {
    let now = new Date()
    let date = formatDate(now, 'yyyy-MM-dd')
    let scheduleList = signTaskService.listTaskScheduleByDate(date, taskCode)
    // 过滤当天 未执行的
    scheduleList.filter(schedule => schedule.executeStatus === 'A' || schedule.executeStatus === 'P')
      .forEach(schedule => {
        let forUpdate = {
          executeStatus: 'D',
          executeEndTime: now.getTime(),
          modifyTime: new Date(),
        }
        signTaskService.updateTaskScheduleById(schedule.id, forUpdate)
      })
  }


  function getEnabledTasks () {
    let enabledTasks = {}
    config.supported_signs.filter(target => target.enabled)
      .forEach(taskInfo => {
        enabledTasks[taskInfo.taskCode] = taskInfo
        if (taskInfo.subTasks && taskInfo.subTasks.length > 0) {
          taskInfo.subTasks.forEach(subTask => {
            if (subTask.enabled) {
              enabledTasks[taskInfo.taskCode + ':' + subTask.taskCode] = taskInfo
            }
          })
        }
      })
    logUtils.debugInfo(['当前已启用的任务列表：{}', JSON.stringify(Object.keys(enabledTasks))])
    return enabledTasks
  }
  /**
   * 获取未执行的列表
   * @returns 
   */
  function getAllPendingScheduleList () {
    let now = new Date()
    let date = formatDate(now, 'yyyy-MM-dd')
    let scheduleList = signTaskService.listTaskScheduleByDate(date)
    let enabledTasks = getEnabledTasks()
    scheduleList = scheduleList.filter(schedule => {
      // 如果有子任务 以子任务的状态为准 
      let subTaskSchedules = signTaskService.listSubTaskScheduleByDate(date, schedule.taskCode)
      if (subTaskSchedules.length > 0) {
        logUtils.debugInfo(['「{}」的子任务执行计划列表：{}', schedule.taskCode, JSON.stringify(subTaskSchedules)])
        // 子任务状态非终态（成功、禁用、失败）且已启用
        subTaskSchedules = (subTaskSchedules || []).filter(v => ['S', 'D', 'F'].indexOf(v.executeStatus) < 0 && !!enabledTasks[v.taskCode])
        return subTaskSchedules.length > 0
      }
      // 任务状态非终态（成功、禁用、失败）且已启用
      return ['S', 'D', 'F'].indexOf(schedule.executeStatus) < 0 && !!enabledTasks[schedule.taskCode]
    })
    logUtils.debugInfo(['待执行的任务计划：{}', JSON.stringify(scheduleList.map(v => {
      const TRIGGER_TYPE = {
        1: '计划执行',
        2: '单次执行'
      }
      const EXECUTE_STATUS = {
        'A': '等待执行',
        'S': '执行成功',
        'F': '执行失败',
        'P': '执行中',
        'D': '已禁用',
      }
      return {
        '执行状态': EXECUTE_STATUS[v.executeStatus],
        '目标执行时间': formatDate(new Date(v.executeTime)),
        '执行日期': v.executeDate,
        'taskCode': v.taskCode,
        '触发类型': TRIGGER_TYPE[parseInt(v.triggerType)],
      }
    }), null, 2)])
    return scheduleList
  }

  this.getAllPendingScheduleList = getAllPendingScheduleList

}

module.exports = new SignTaskManager()