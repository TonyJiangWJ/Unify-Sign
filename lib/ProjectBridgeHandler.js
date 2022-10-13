let singletonRequire = require('./SingletonRequirer.js')(runtime, global)
let signTaskService = singletonRequire('SignTaskService')
let signTaskManager = singletonRequire('SignTaskManager')

module.exports = function (BaseHandler) {
  const ExtendHandler = {
    loadTaskInfo: (data, callbackId) => {
      let task = signTaskService.selectTaskByCode(data.taskCode)
      postMessageToWebView({ callbackId: callbackId, data: task })
    },
    listTaskInfos: (data, callbackId) => {
      let taskList = signTaskService.listTaskInfos()
      postMessageToWebView({ callbackId: callbackId, data: taskList })
    },
    listSubTasks: (data, callbackId) => {
      let taskList = signTaskService.listSubTasks(data.taskCode)
      postMessageToWebView({ callbackId: callbackId, data: taskList })
    },
    queryScheduleConfig: (data, callbackId) => {
      let scheduleConfigs = signTaskService.listTaskScheduleConfigByCode(data.taskCode)
      postMessageToWebView({ callbackId: callbackId, data: scheduleConfigs })
    },
    insertScheduleConfig: (data, callbackId) => {
      let id = signTaskService.insertScheduleConfig(data)
      postMessageToWebView({ callbackId: callbackId, data: { id: id } })
    },
    updateScheduleConfig: (data, callbackId) => {
      let updates = signTaskService.updateTaskScheduleConfigById(data.id, data)
      if (data.executeType === '3') {
        signTaskService.insertTaskGroupRef({ groupCode: data.groupCode, configId: data.id })
      } else {
        let dbConfig = signTaskService.selectTaskScheduleConfigById(data.id)
        if (dbConfig.executeType === '3') {
          signTaskService.removeTaskGroupRef(dbConfig.groupCode, dbConfig.id)
        }
      }
      postMessageToWebView({ callbackId: callbackId, data: { success: updates > 0 } })
    },
    deleteScheduleConfig: (data, callbackId) => {
      let deletes = signTaskService.deleteScheduleConfigById(data.id)
      postMessageToWebView({ callbackId: callbackId, data: { success: deletes > 0 } })
    },
    queryScheduleList: (data, callbackId) => {
      let scheduleList = signTaskService.listTaskScheduleByDate(data.date)
      postMessageToWebView({ callbackId: callbackId, data: scheduleList })
    },
    insertSchedule: (data, callbackId) => {
      let id = signTaskService.insertTaskSchedule(data)
      postMessageToWebView({ callbackId: callbackId, data: { id: id } })
    },
    updateSchedule: (data, callbackId) => {
      let updates = signTaskService.updateTaskScheduleById(data.id, data)
      postMessageToWebView({ callbackId: callbackId, data: { success: updates > 0 } })
    },
    deleteSchedule: (data, callbackId) => {
      let deletes = signTaskService.deleteTaskScheduleById(data.id)
      postMessageToWebView({ callbackId: callbackId, data: { success: deletes > 0 } })
    },
    listGroupConfig: (data, callbackId) => {
      let groups = signTaskService.listGroupScheduleConfig()
      postMessageToWebView({ callbackId: callbackId, data: groups })
    },
    insertGroupConfig: (data, callbackId) => {
      let id = signTaskService.insertGroupScheduleConfig(data)
      postMessageToWebView({ callbackId: callbackId, data: { id: id } })
    },
    updateGroupConfig: (data, callbackId) => {
      let updated = signTaskService.updateGroupScheduleConfigByCode(data)
      postMessageToWebView({ callbackId: callbackId, data: { success: updated > 0 } })
    },
    deleteGroupConfig: (data, callbackId) => {
      let deleted = signTaskService.deleteGroupScheduleConfigById(data.id)
      postMessageToWebView({ callbackId: callbackId, data: { success: deleted > 0 } })
    },
    checkGroupRefExists: (data, callbackId) => {
      let refCount = signTaskService.countGroupRefsByGroupCode(data.groupCode)
      postMessageToWebView({ callbackId: callbackId, data: { count: refCount } })
    },
    checkGroupCodeExists: (data, callbackId) => {
      let groupInfo = signTaskService.queryGroupExists(data.groupCode, data.id)
      postMessageToWebView({ callbackId: callbackId, data: { exists: !!groupInfo } })
    },
    generateTaskSchedules: (data, callbackId) => {
      signTaskManager.init()
        .generateDefaultScheduleConfig()
        .generateTaskSchedules()
      postMessageToWebView({ callbackId: callbackId, data: { success: true } })
    },
    regenerateTaskSchedules: (data, callbackId) => {
      signTaskManager.removeAllSchedules()
        .init()
        .generateDefaultScheduleConfig()
        .generateTaskSchedules()
      postMessageToWebView({ callbackId: callbackId, data: { success: true } })
    },
    regenerateTaskSchedulesNotExecuted: (data, callbackId) => {
      signTaskManager.removeSchedulesNotExecuted()
        .init()
        .generateDefaultScheduleConfig()
        .generateTaskSchedules()
      postMessageToWebView({ callbackId: callbackId, data: { success: true } })
    },
  }
  Object.assign(BaseHandler, ExtendHandler)
  return BaseHandler
}