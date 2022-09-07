let { config } = require('../../config.js')(runtime, global)
let formatDate = require('../DateUtil.js')
let singletonRequire = require('../SingletonRequirer.js')(runtime, global)
let sqliteUtil = singletonRequire('SQLiteUtil')
let fileUtils = singletonRequire('FileUtils')
let logUtils = singletonRequire('LogUtils')
let dbFileName = fileUtils.getCurrentWorkPath() + '/config_data/sign-task.db'

const PARSER = {
  String: (fieldName) => {
    return [fieldName, value => value, (cursor, idx) => cursor.getString(idx)]
  },
  Integer: (fieldName) => {
    return [fieldName, value => new java.lang.Integer(value), (cursor, idx) => cursor.getInt(idx)]
  },
  Long: (fieldName) => {
    return [fieldName, value => new java.lang.Long(value), (cursor, idx) => cursor.getLong(idx)]
  },
  Date: (fieldName) => {
    return [fieldName, value => value ? formatDate(value) : null, (cursor, idx) => parseDate(cursor.getString(idx))]
  }
}

function parseDate (dateStr) {
  let regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.(\d{1,3}))?/
  let result = regex.exec(dateStr)
  if (!result || result.length < 7) {
    return null
  }
  return new Date(result[1], parseInt(result[2]) - 1, result[3], result[4], result[5], result[6])
}

/**
 * 定义任务信息
 */
let SignTaskInfo = {
  tableName: 'SIGN_TASK_INFO',
  tableCreate: '\
  create table SIGN_TASK_INFO (\
    ID INTEGER PRIMARY KEY AUTOINCREMENT,\
    TASK_NAME VARCHAR(32) NOT NULL,\
    TASK_CODE VARCHAR(32) NOT NULL,\
    TASK_SOURCE VARCHAR(256) NULL,\
    PARENT_TASK_CODE VARCHAR(32) NULL,\
    ENABLED VARCHAR(1) NOT NULL DEFAULT \'1\',\
    CREATE_TIME VARCHAR(20) NULL,\
    MODIFY_TIME VARCHAR(20) NULL\
  )',
  tableAlters: [
    'create index idx_task_info on SIGN_TASK_INFO(TASK_CODE,TASK_NAME)',
    'create unique index uk_task_info on SIGN_TASK_INFO(TASK_CODE)',
  ],
  columnMapping: {
    ID: PARSER.Integer('id'),
    TASK_NAME: PARSER.String('taskName'),
    TASK_CODE: PARSER.String('taskCode'),
    TASK_SOURCE: PARSER.String('taskSource'),
    PARENT_TASK_CODE: PARSER.String('parentTaskCode'),
    ENABLED: PARSER.String('enabled'),
    CREATE_TIME: PARSER.Date('createTime'),
    MODIFY_TIME: PARSER.Date('modifyTime'),
  },
}

/**
 * 定义任务执行计划
 */
let SignTaskScheduleConfig = {
  tableName: 'SIGN_TASK_SCHEDULE_CONFIG',
  tableCreate: '\
  create table SIGN_TASK_SCHEDULE_CONFIG (\
    ID INTEGER PRIMARY KEY AUTOINCREMENT,\
    TASK_CODE VARCHAR(32) NOT NULL,\
    EXECUTE_TYPE VARCHAR(2) NOT NULL,\
    START Integer NOT NULL,\
    END Integer NULL,\
    SORT INTEGER NOT NULL,\
    CREATE_TIME VARCHAR(20) NULL,\
    MODIFY_TIME VARCHAR(20) NULL\
  )',
  tableAlters: [
    'create index idx_schedule_config on SIGN_TASK_SCHEDULE_CONFIG(TASK_CODE,SORT)'
  ],
  columnMapping: {
    ID: PARSER.Integer('id'),
    TASK_CODE: PARSER.String('taskCode'),
    EXECUTE_TYPE: PARSER.String('executeType'),
    START: PARSER.Integer('start'),
    END: PARSER.Integer('end'),
    SORT: PARSER.Integer('sort'),
    CREATE_TIME: PARSER.Date('createTime'),
    MODIFY_TIME: PARSER.Date('modifyTime'),
  }
}

/**
 * 任务执行计划
 */
let SignTaskSchedule = {
  tableName: 'SIGN_TASK_SCHEDULE',
  tableCreate: '\
  create table SIGN_TASK_SCHEDULE (\
    ID INTEGER PRIMARY KEY AUTOINCREMENT,\
    TASK_CODE VARCHAR(32) NOT NULL,\
    TRIGGER_TYPE VARCHAR(2) NOT NULL,\
    CONFIG_ID INTEGER NULL,\
    EXECUTE_STATUS VARCHAR(2) NOT NULL,\
    EXECUTE_TIME BIGINT NOT NULL,\
    EXECUTE_DATE VARCHAR(10) NOT NULL,\
    REAL_EXECUTE_TIME BIGINT NULL,\
    EXECUTE_END_TIME BIGINT NULL,\
    EXECUTE_COST INTEGER NULL,\
    CREATE_TIME VARCHAR(20) NULL,\
    MODIFY_TIME VARCHAR(20) NULL\
  )',
  tableAlters: [
    'CREATE INDEX idx_sign_task_schedule on SIGN_TASK_SCHEDULE(EXECUTE_DATE,TASK_CODE,CONFIG_ID,EXECUTE_TIME)',
    { sql: 'CREATE UNIQUE INDEX uk_sign_task_config on SIGN_TASK_SCHEDULE(EXECUTE_DATE,CONFIG_ID)', version: 1 },
  ],
  columnMapping: {
    ID: PARSER.Integer('id'),
    TASK_CODE: PARSER.String('taskCode'),
    TRIGGER_TYPE: PARSER.String('triggerType'),
    CONFIG_ID: PARSER.Integer('configId'),
    EXECUTE_STATUS: PARSER.String('executeStatus'),
    EXECUTE_TIME: PARSER.Long('executeTime'),
    EXECUTE_DATE: PARSER.String('executeDate'),
    REAL_EXECUTE_TIME: PARSER.Long('realExecuteTime'),
    EXECUTE_END_TIME: PARSER.Long('executeEndTime'),
    EXECUTE_COST: PARSER.Integer('executeCost'),
    CREATE_TIME: PARSER.Date('createTime'),
    MODIFY_TIME: PARSER.Date('modifyTime'),
  }
}

let GroupScheduleConfig = {
  tableName: 'GROUP_SCHEDULE_CONFIG',
  tableCreate: '\
  CREATE TABLE GROUP_SCHEDULE_CONFIG (\
    ID INTEGER PRIMARY KEY AUTOINCREMENT,\
    GROUP_CODE VARCHAR(32) NOT NULL,\
    GROUP_NAME VARCHAR(256) NOT NULL,\
    EXECUTE_TYPE CHAR(2) NOT NULL,\
    START INTEGER NOT NULL,\
    END INTEGER NULL,\
    CREATE_TIME VARCHAR(20) NOT NULL,\
    MODIFY_TIME VARCHAR(20) NOT NULL\
  )',
  tableAlters: [
    'CREATE UNIQUE INDEX uk_group_schedule_config on GROUP_SCHEDULE_CONFIG(GROUP_CODE)',
  ],
  columnMapping: {
    ID: PARSER.Integer('id'),
    GROUP_CODE: PARSER.String('groupCode'),
    GROUP_NAME: PARSER.String('groupName'),
    EXECUTE_TYPE: PARSER.String('executeType'),
    START: PARSER.Integer('start'),
    END: PARSER.Integer('end'),
    CREATE_TIME: PARSER.Date('createTime'),
    MODIFY_TIME: PARSER.Date('modifyTime'),
  }
}

let GroupSchedule = {
  tableName: 'GROUP_SCHEDULE',
  tableCreate: '\
  CREATE TABLE GROUP_SCHEDULE (\
    ID INTEGER PRIMARY KEY AUTOINCREMENT,\
    GROUP_CODE VARCHAR(32) NOT NULL,\
    EXECUTE_TIME BIGINT NOT NULL,\
    EXECUTE_DATE VARCHAR(10) NOT NULL,\
    CREATE_TIME VARCHAR(20) NOT NULL,\
    MODIFY_TIME VARCHAR(20) NOT NULL\
  )',
  tableAlters: [
    'create unique index uk_group_schedule on GROUP_SCHEDULE(GROUP_CODE, EXECUTE_DATE)'
  ],
  columnMapping: {
    ID: PARSER.Integer('id'),
    GROUP_CODE: PARSER.String('groupCode'),
    EXECUTE_TIME: PARSER.Long('executeTime'),
    EXECUTE_DATE: PARSER.String('executeDate'),
    CREATE_TIME: PARSER.Date('createTime'),
    MODIFY_TIME: PARSER.Date('modifyTime'),
  }
}

let TaskGroupRefs = {
  tableName: 'TASK_GROUP_REFS',
  tableCreate: '\
  CREATE TABLE TASK_GROUP_REFS (\
    ID INTEGER PRIMARY KEY AUTOINCREMENT,\
    GROUP_CODE VARCHAR(32) NOT NULL,\
    CONFIG_ID INTEGER NOT NULL,\
    CREATE_TIME VARCHAR(20),\
    MODIFY_TIME VARCHAR(20)\
  )',
  tableAlters: [
    'create index idx_task_group_refs on TASK_GROUP_REFS(GROUP_CODE,CONFIG_ID)'
  ],
  columnMapping: {
    ID: PARSER.Integer('id'),
    GROUP_CODE: PARSER.String('groupCode'),
    CONFIG_ID: PARSER.Long('configId'),
    CREATE_TIME: PARSER.Date('createTime'),
    MODIFY_TIME: PARSER.Date('modifyTime'),
  }
}

const SCHEDULE_TYPE = {
  SPECIFY: '1',
  RANDOM: '2',
  GROUPED: '3',
}

function SignTaskService () {
  sqliteUtil.initDbTables(dbFileName, [
    SignTaskInfo, SignTaskScheduleConfig, SignTaskSchedule,
    GroupScheduleConfig, GroupSchedule, TaskGroupRefs
  ], 1)
  this.taskInfoDao = new BaseDao(SignTaskInfo.tableName)
  this.taskScheduleConfigDao = new BaseDao(SignTaskScheduleConfig.tableName)
  this.taskScheduleDao = new BaseDao(SignTaskSchedule.tableName)
  this.groupScheduleConfigDao = new BaseDao(GroupScheduleConfig.tableName)
  this.groupScheduleDao = new BaseDao(GroupSchedule.tableName)
  this.taskGroupRefsDao = new BaseDao(TaskGroupRefs.tableName)

  /**
   * 查询所有任务
   *
   * @returns 
   */
  this.listTaskInfos = function () {
    return this.taskInfoDao.list()
  }

  /**
   * 通过任务编号查询是否已存在
   * 
   * @param {String} taskCode 
   * @returns 
   */
  this.queryTaskExists = function (taskCode) {
    return this.taskInfoDao.count('WHERE TASK_CODE=?', [taskCode]) > 0
  }

  /**
   * 通过任务编号查询子任务列表
   * 
   * @param {String} taskCode 
   * @returns 
   */
  this.listSubTasks = function (taskCode) {
    return this.taskInfoDao.query('WHERE PARENT_TASK_CODE=?', [taskCode])
  }

  /**
   * 通过任务编号查询任务信息
   * 
   * @param {String} taskCode 
   * @returns 
   */
  this.selectTaskByCode = function (taskCode) {
    return this.taskInfoDao.selectOne('WHERE TASK_CODE=?', [taskCode])
  }

  /**
   * 通过任务编号更新任务信息
   * 
   * @param {Object} taskInfo 
   * @returns 
   */
  this.updateTaskInfoByTaskCode = function (taskInfo) {
    let dbTaskInfo = this.selectTaskByCode(taskInfo.taskCode)
    if (dbTaskInfo != null) {
      return this.taskInfoDao.updateById(dbTaskInfo.id, taskInfo)
    } else {
      logUtils.errorInfo(['任务信息不存在:{}', taskInfo.taskCode])
      return -1
    }
  }

  /**
   * 插入任务信息
   * 
   * @param {Object} taskInfo 
   * @returns 
   */
  this.insertTaskInfo = function (taskInfo) {
    if (this.queryTaskExists(taskInfo.taskCode)) {
      logUtils.errorInfo(['任务[{}]信息已存在，无法新增', taskInfo.taskCode])
      return -1
    }
    return this.taskInfoDao.insert(taskInfo)
  }

  /**
   * 通过任务编号删除任务信息
   * 
   * @param {String} taskCode 
   * @returns 
   */
  this.deleteTaskInfoByCode = function (taskCode) {
    let dbTaskInfo = this.selectTaskByCode(taskCode)
    if (dbTaskInfo != null) {
      return this.taskInfoDao.deleteById(dbTaskInfo.id)
    } else {
      logUtils.errorInfo(['任务信息不存在:{}', taskInfo.taskCode])
      return -1
    }
  }

  /**
   * 通过任务编号查询对应的任务执行配置是否存在
   *
   * @param {String} taskCode 
   * @returns 
   */
  this.queryTaskScheduleConfigExists = function (taskCode) {
    return this.taskScheduleConfigDao.count('WHERE TASK_CODE=? ORDER BY SORT', [taskCode]) > 0
  }

  /**
   * 通过任务编号查询对应的任务执行配置列表
   * 
   * @param {String} taskCode 
   * @returns 
   */
  this.listTaskScheduleConfigByCode = function (taskCode) {
    let scheduleConfigList = this.taskScheduleConfigDao.query('WHERE TASK_CODE=? ORDER BY SORT', [taskCode])
    if (scheduleConfigList && scheduleConfigList.length > 0) {
      scheduleConfigList.filter(config => config.executeType === SCHEDULE_TYPE.GROUPED)
        .forEach(config => {
          let groupInfos = sqliteUtil.rawQuery('select GR.GROUP_CODE, GC.GROUP_NAME\
        from TASK_GROUP_REFS gr\
                 JOIN GROUP_SCHEDULE_CONFIG GC ON GC.GROUP_CODE = GR.GROUP_CODE\
        where config_id = ?', [config.id], cursor => {
            return {
              groupCode: cursor.getString(0),
              groupName: cursor.getString(1)
            }
          })
          if (groupInfos && groupInfos.length > 0) {
            config.groupName = groupInfos[0].groupName
            config.groupCode = groupInfos[0].groupCode
          }
        })
    }
    return scheduleConfigList
  }

  /**
   * 根据id获取执行配置详情 包括所属分组
   * 
   * @param {number} id 
   * @returns 
   */
  this.selectTaskScheduleConfigById = function (id) {
    let scheduleConfig = this.taskScheduleConfigDao.selectById(id)
    if (scheduleConfig && scheduleConfig.executeType === SCHEDULE_TYPE.GROUPED) {
      let groupInfos = sqliteUtil.rawQuery('select GR.GROUP_CODE, GC.GROUP_NAME\
        from TASK_GROUP_REFS gr\
                 JOIN GROUP_SCHEDULE_CONFIG GC ON GC.GROUP_CODE = GR.GROUP_CODE\
        where config_id = ?', [config.id], cursor => {
        return {
          groupCode: cursor.getString(0),
          groupName: cursor.getString(1)
        }
      })
      if (groupInfos && groupInfos.length > 0) {
        scheduleConfig.groupName = groupInfos[0].groupName
        scheduleConfig.groupCode = groupInfos[0].groupCode
      }
    }
    return scheduleConfig
  }

  /**
   * 插入任务执行配置
   * 
   * @param {Object} scheduleConfig 
   * @returns 
   */
  this.insertScheduleConfig = function (scheduleConfig) {
    return this.taskScheduleConfigDao.insert(scheduleConfig)
  }

  /**
   * 删除任务执行配置
   * 
   * @param {Number} id 
   * @returns 
   */
  this.deleteScheduleConfigById = function (id) {
    return this.taskScheduleConfigDao.deleteById(id)
  }

  /**
   * 更新任务执行配置
   * 
   * @param {Number} id 
   * @param {Object} scheduleConfig 
   * @returns 
   */
  this.updateTaskScheduleConfigById = function (id, scheduleConfig) {
    return this.taskScheduleConfigDao.updateById(id, scheduleConfig)
  }

  /**
   * 根据日期查询任务执行计划
   * 
   * @param {String} date 
   * @param {String} taskCode 
   * @param {Number} configId 
   * @returns 
   */
  this.listTaskScheduleByDate = function (date, taskCode, configId) {
    return this.taskScheduleDao.query('WHERE EXECUTE_DATE=? '
      + (taskCode ? ' AND TASK_CODE=? ' : '') + (configId ? ' AND CONFIG_ID=? ' : '')
      + 'ORDER BY EXECUTE_TIME', [date, taskCode, configId].filter(v => !!v))
  }

  /**
   * 根据日期查询子任务执行计划
   * 
   * @param {String} date 
   * @param {String} taskCode 
   * @param {Number} configId 
   * @returns 
   */
  this.listSubTaskScheduleByDate = function (date, taskCode, configId) {
    return this.taskScheduleDao.query('WHERE EXECUTE_DATE=? '
      + (taskCode ? ' AND TASK_CODE LIKE ?||\':%\'' : '') + (configId ? ' AND CONFIG_ID=? ' : '')
      + 'ORDER BY EXECUTE_TIME', [date, taskCode, configId].filter(v => !!v))
  }

  /**
   * 插入任务执行计划
   * 
   * @param {Object} taskSchedule 
   * @returns 
   */
  this.insertTaskSchedule = function (taskSchedule) {
    return this.taskScheduleDao.insert(taskSchedule)
  }

  /**
   * 根据id删除任务执行计划
   * 
   * @param {Number} id 
   * @returns 
   */
  this.deleteTaskScheduleById = function (id) {
    return this.taskScheduleDao.deleteById(id)
  }

  /**
   * 根据id更新任务执行计划
   * 
   * @param {Number} id 
   * @param {Object} taskSchedule 
   * @returns 
   */
  this.updateTaskScheduleById = function (id, taskSchedule) {
    return this.taskScheduleDao.updateById(id, taskSchedule)
  }

  /**
   * 查询所有的分组配置
   * 
   * @returns 
   */
  this.listGroupScheduleConfig = function () {
    return this.groupScheduleConfigDao.list()
  }

  /**
   * 根据分组编号查询分组配置
   * 
   * @param {String} groupCode 
   * @returns 
   */
  this.selectGroupScheduleConfigByCode = function (groupCode) {
    return this.groupScheduleConfigDao.selectOne('WHERE GROUP_CODE=?', [groupCode])
  }

  /**
   * 通过分组编号更新分组配置
   * 
   * @param {String} scheduleConfig 
   * @returns 
   */
  this.updateGroupScheduleConfigByCode = function (scheduleConfig) {
    let dbGroupConfig = this.selectGroupScheduleConfigByCode(scheduleConfig.groupCode)
    if (dbGroupConfig != null) {
      return this.groupScheduleConfigDao.updateById(dbGroupConfig.id, scheduleConfig)
    } else {
      logUtils.errorInfo(['分组信息不存在:{}', scheduleConfig.groupCode])
      return -1
    }
  }

  /**
   * 通过分组编号查询分组配置是否存在
   * 
   * @param {String} groupCode 
   * @returns 
   */
  this.queryGroupExists = function (groupCode, id) {
    return this.groupScheduleConfigDao.count('WHERE GROUP_CODE=?' + (!!id ? ' AND ID<>?' : ''), [groupCode].concat(!!id ? [id] : [])) > 0
  }

  /**
   * 插入分组配置
   * 
   * @param {Object} scheduleConfig 
   * @returns 
   */
  this.insertGroupScheduleConfig = function (scheduleConfig) {
    if (this.queryGroupExists(scheduleConfig.groupCode)) {
      logUtils.errorInfo(['GROUP_CODE:{} 已存在', scheduleConfig.groupCode])
      return -1
    }
    return this.groupScheduleConfigDao.insert(scheduleConfig)
  }

  /**
   * 根据id删除分组配置
   * 
   * @param {Number} id 
   * @returns 
   */
  this.deleteGroupScheduleConfigById = function (id) {
    return this.groupScheduleConfigDao.deleteById(id)
  }

  /**
   * 查询指定日期的分组执行计划
   * 
   * @param {String} date 
   * @param {String} groupCode 
   * @returns 
   */
  this.listGroupScheduleByDate = function (date, groupCode) {
    return this.groupScheduleDao.query('WHERE EXECUTE_DATE=? '
      + (groupCode ? ' AND GROUP_CODE=? ' : '')
      + 'ORDER BY EXECUTE_TIME', [date, groupCode].filter(v => !!v))
  }

  /**
   * 插入分组执行计划
   * 
   * @param {Object} groupSchedule 
   * @returns 
   */
  this.insertGroupSchedule = function (groupSchedule) {
    return this.groupScheduleDao.insert(groupSchedule)
  }

  /**
   * 创建指定日期的分组执行计划数据
   * 
   * @param {String} executeDate 
   */
  this.generateGroupSchedules = function (executeDate) {
    let groupConfigs = this.groupScheduleConfigDao.query('g WHERE NOT EXISTS(SELECT 1 FROM GROUP_SCHEDULE t WHERE g.GROUP_CODE=t.GROUP_CODE AND t.EXECUTE_DATE=?)', [executeDate])
    if (groupConfigs && groupConfigs.length > 0) {
      groupConfigs.forEach(groupConfig => {
        let groupSchedule = {
          groupCode: groupConfig.groupCode,
          executeDate: executeDate,
          executeTime: this.generateExecuteTime(groupConfig),
        }
        let id = this.insertGroupSchedule(groupSchedule)
        if (id <= 0) {
          logUtils.errorInfo(['创建分组执行计划失败 groupCode: {}', groupConfig.groupCode])
        } else {
          logUtils.debugInfo(['成功创建分组执行计划 groupCode: {} executeDate: {} executeTime: {}', groupConfig.groupCode, groupSchedule.executeDate, groupSchedule.executeTime])
        }
      })
    }
  }

  /**
   * 根据任务执行配置生成指定日期的任务执行计划
   * 
   * @param {Object} taskConfig 
   * @param {String} executeDate 
   * @returns 
   */
  this.generateTaskSchedule = function (taskConfig, executeDate) {
    let schedules = this.listTaskScheduleByDate(executeDate, taskConfig.taskCode, taskConfig.id)
    if (schedules && schedules.length > 0) {
      logUtils.debugInfo(['任务[{}-{}]执行计划已存在 跳过生成', taskConfig.id, taskConfig.taskCode])
      return
    }
    let executeTime = this.generateExecuteTime(taskConfig)
    let taskSchedule = {
      taskCode: taskConfig.taskCode,
      triggerType: '1',
      configId: taskConfig.id,
      executeStatus: 'A',
      executeTime: executeTime,
      executeDate: executeDate,
    }
    let id = this.insertTaskSchedule(taskSchedule)
    logUtils.debugInfo(['创建任务执行计划：{} {} scheduleId: {}', formatDate(new Date(executeTime)), taskConfig.taskCode, id])
    return id
  }

  /**
   * 根据id删除分组执行计划
   * 
   * @param {Number} id 
   * @returns 
   */
  this.deleteGroupScheduleById = function (id) {
    return this.groupScheduleDao.deleteById(id)
  }

  /**
   * 更新分组执行计划
   * 
   * @param {Number} id 
   * @param {Object} groupSchedule 
   * @returns 
   */
  this.updateGroupScheduleById = function (id, groupSchedule) {
    return this.groupScheduleDao.updateById(id, groupSchedule)
  }

  /**
   * 根据任务执行配置id查询某一天的分组执行计划
   * 
   * @param {Number} configId 
   * @param {String} executeDate 
   * @returns 
   */
  this.queryGroupScheduleByConfig = function (configId, executeDate) {
    let taskGroupRef = this.taskGroupRefsDao.selectOne('WHERE CONFIG_ID=?', [configId])
    if (taskGroupRef == null) {
      logUtils.errorInfo(['configId: {} 未关联分组', configId])
      return null
    }
    let groupSchedule = this.groupScheduleDao.selectOne('WHERE GROUP_CODE=? AND EXECUTE_DATE=?', [taskGroupRef.groupCode, executeDate])
    if (groupSchedule != null) {
      logUtils.debugInfo(['查询到匹配的分组执行计划：「{}」', JSON.stringify(groupSchedule)])
      return groupSchedule
    }
    logUtils.warnInfo(['当前分组[{}]指定日期[{}]的执行计划不存在，自动创建', taskGroupRef.groupCode, executeDate])
    let groupScheduleConfig = this.selectGroupScheduleConfigByCode(taskGroupRef.groupCode)
    if (groupScheduleConfig == null) {
      logUtils.errorInfo(['分组[{}]执行配置不存在', taskGroupRef.groupCode])
      return null
    }
    groupSchedule = {
      groupCode: taskGroupRef.groupCode,
      executeDate: executeDate,
      executeTime: this.generateExecuteTime(groupScheduleConfig),
    }
    let id = this.insertGroupSchedule(groupSchedule)
    groupSchedule.id = id
    if (id > 0) {
      return groupSchedule
    } else {
      logUtils.errorInfo(['创建分组执行计划失败 groupCode: {}', taskGroupRef.groupCode])
      return null
    }
  }

  /**
   * 插入任务执行配置和分组的关联关系
   * 
   * @param {Object} ref 
   * @returns 
   */
  this.insertTaskGroupRef = function (ref) {
    if (this.taskGroupRefsDao.count('WHERE GROUP_CODE=? AND CONFIG_ID=?', [ref.groupCode, ref.configId]) > 0) {
      logUtils.errorInfo(['groupCode: {} configId: {} 关联关系已存在', ref.groupCode, ref.configId])
      return -1
    }
    if (this.taskGroupRefsDao.count('WHERE CONFIG_ID=?', [ref.configId]) > 0) {
      logUtils.errorInfo(['configId: {} 已绑定到其他分组', ref.configId])
      return -1
    }
    return this.taskGroupRefsDao.insert(ref)
  }

  /**
   * 解绑任务执行配置和分组
   * 
   * @param {String} groupCode 
   * @param {Number} configId 
   * @returns 
   */
  this.removeTaskGroupRef = function (groupCode, configId) {
    let dbRef = this.taskGroupRefsDao.selectOne('WHERE GROUP_CODE=? AND CONFIG_ID=?', [groupCode, configId])
    if (dbRef) {
      return this.taskGroupRefsDao.deleteById(dbRef.id)
    }
    logUtils.warnInfo(['groupCode: {} configId: {} 关联关系不存在', ref.groupCode, ref.configId])
    return 0
  }

  /**
   * 获取当前分组所关联的配置数
   * 
   * @param {String} groupCode 
   * @returns 
   */
  this.countGroupRefsByGroupCode = function (groupCode) {
    return this.taskGroupRefsDao.count('WHERE GROUP_CODE=?', [groupCode])
  }

  /**
   * 绑定任务执行配置和分组 仅限初始化时使用
   * 
   * @param {String} taskCode 
   * @param {String} groupCode 
   * @returns 
   */
  this.bindTaskConfigWithGroup = function (taskCode, groupCode) {
    let taskConfig = this.taskScheduleConfigDao.selectOne('WHERE TASK_CODE=? AND EXECUTE_TYPE=3', [taskCode])
    if (!taskConfig) {
      logUtils.errorInfo(['taskCode: {} 不存在分组类型的任务配置', taskCode])
      return -1
    }
    if (this.taskGroupRefsDao.count('WHERE GROUP_CODE=? AND CONFIG_ID=?', [groupCode, taskConfig.id]) > 0) {
      logUtils.warnInfo(['taskCode: {} 已经和当前分组: {} 绑定', taskCode, groupCode])
      return 0
    }
    let groupConfig = this.groupScheduleConfigDao.selectOne('WHERE GROUP_CODE=?', [groupCode])
    if (!groupConfig) {
      logUtils.errorInfo(['当前分组: {} 配置不存在', groupCode])
      return -1
    }
    let taskGroupRef = {
      groupCode: groupCode,
      configId: taskConfig.id
    }
    let id = this.taskGroupRefsDao.insert(taskGroupRef)
    logUtils.debugInfo(['创建任务[{}]和分组[{}]关联关系成功：{}', taskCode, groupCode, id])
    return id
  }

  /**
   * 更具任务类型生成下次执行时间
   * 
   * @param {Object} scheduleConfig 
   * @returns 
   */
  this.generateExecuteTime = function (scheduleConfig) {
    if (scheduleConfig.executeType === SCHEDULE_TYPE.SPECIFY) {
      // 直接执行
      let time = org.joda.time.LocalTime.fromMillisOfDay(new java.lang.Long(scheduleConfig.start))
      return time.toDateTimeToday().getMillis()
    } else if (scheduleConfig.executeType === SCHEDULE_TYPE.RANDOM) {
      // 随机范围
      let millis = new java.lang.Long(scheduleConfig.start + Math.ceil(Math.random() * (scheduleConfig.end - scheduleConfig.start)))
      return org.joda.time.LocalTime.fromMillisOfDay(millis).toDateTimeToday().getMillis()
    } else if (scheduleConfig.executeType === SCHEDULE_TYPE.GROUPED) {
      // 按分组
      let groupSchedule = this.queryGroupScheduleByConfig(scheduleConfig.id, formatDate(new Date(), 'yyyy-MM-dd'))
      if (groupSchedule != null) {
        return groupSchedule.executeTime
      } else {
        logUtils.warnInfo(['未匹配到分组执行计划，使用直接执行 configId: {}', scheduleConfig.id])
        let time = org.joda.time.LocalTime.fromMillisOfDay(new java.lang.Long(scheduleConfig.start))
        return time.toDateTimeToday().getMillis()
      }
    } else {
      logUtils.errorInfo(['任务执行类型不存在[{}]', scheduleConfig.executeType])
    }
  }
}

/**
 * 基础数据库操作 包含增删改查
 *
 * @param {String} tableName 
 */
function BaseDao (tableName) {
  /**
   * 列出所有数据
   * 
   * @returns 
   */
  this.list = function () {
    return sqliteUtil.query(tableName, '', [])
  }

  /**
   * 根据条件查询数据
   * 
   * @param {String} whereCaulse 
   * @param {List} params 
   * @returns 
   */
  this.query = function (whereCaulse, params) {
    return sqliteUtil.query(tableName, whereCaulse, params)
  }

  /**
   * 根据条件查询数量
   * 
   * @param {String} whereCaulse 
   * @param {List} params 
   * @returns 
   */
  this.count = function (whereCaulse, params) {
    return sqliteUtil.count(tableName, whereCaulse, params)
  }

  /**
   * 插入数据
   * 
   * @param {Object} data 
   * @returns 
   */
  this.insert = function (data) {
    data.createTime = new Date()
    data.modifyTime = new Date()
    return sqliteUtil.insert(tableName, data)
  }

  /**
   * 根据id更新数据
   * 
   * @param {Number} id 
   * @param {Object} data 
   * @returns 
   */
  this.updateById = function (id, data) {
    delete data.createTime
    data.modifyTime = new Date()
    return sqliteUtil.updateById(tableName, id, data)
  }

  /**
   * 根据id删除数据
   * 
   * @param {Number} id 
   * @returns 
   */
  this.deleteById = function (id) {
    return sqliteUtil.deleteById(tableName, id)
  }

  /**
   * 根据条件查询一条数据
   * 
   * @param {String} whereCaulse 
   * @param {List} params 
   * @returns 
   */
  this.selectOne = function (whereCaulse, params) {
    let list = sqliteUtil.query(tableName, whereCaulse + ' LIMIT 1', params)
    if (list && list.length > 0) {
      return list[0]
    }
    return null
  }

  this.selectById = function (id) {
    return sqliteUtil.selectById(tableName, id)
  }
}

module.exports = new SignTaskService()