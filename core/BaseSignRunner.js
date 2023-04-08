let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let WidgetUtils = singletonRequire('WidgetUtils')
let FloatyInstance = singletonRequire('FloatyUtil')
let runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let automator = singletonRequire('Automator')
let logUtils = singletonRequire('LogUtils')
let signTaskService = singletonRequire('SignTaskService')
let OpenCvUtil = require('../lib/OpenCvUtil.js')
let formatDate = require('../lib/DateUtil.js')
let localOcrUtil = require('../lib/LocalOcrUtil.js')
let storageFactory = singletonRequire('StorageFactory')

function BaseSignRunner () {
  this.name = ''
  this.taskCode = ''
  this.subTasks = []
  this.executedSuccess = false

  this.setName = function (name) {
    this.name = name
    return this
  }

  this.setTaskCode = function (taskCode) {
    this.taskCode = taskCode
    return this
  }

  this.setSubTasks = function (subTasks) {
    this.subTasks = subTasks
    return this
  }

  this.initDailyStorage = function (key, defaultValue) {
    storageFactory.initFactoryByKey(key, defaultValue)
  }

  this.getDailyStorage = function (key) {
    return storageFactory.getValueByKey(key)
  }

  this.setDailyStorage = function (key, value) {
    return storageFactory.updateValueByKey(key, value)
  }

  /**
   * 判断今天是否已经执行过，没有的话执行签到任务
   */
  this.executeIfNeeded = function () {
    if (checkIsSignExecutedByDb(this.taskCode, this.subTasks)) {
      FloatyInstance.setFloatyText(this.name + '已经执行过或未到达执行时间，跳过执行')
      sleep(500)
      return true
    } else {
      FloatyInstance.setFloatyInfo({ x: config.device_width * 0.4, y: config.device_height / 2 }, '准备执行：' + this.name)
      sleep(1000)
      // 自动延期
      runningQueueDispatcher.renewalRunningTask()
      markExecuteStart(this.taskCode)
      this.exec()
      return this.executedSuccess
    }
  }

  /**
   * 标记今天已经执行过
   */
  this.setExecuted = function () {
    setExecutedInDb(this.taskCode)
    this.executedSuccess = true
  }

  /**
   * 创建执行计划
   * 当前整体框架设计是 会自动合并五分钟内的签到任务 因此任务间最短间隔为5分钟 小于五分钟的将自动延迟到五分钟后执行
   *
   * @param {string} taskCode 
   * @param {timestamp|number} targetTime 目标执行时间 
   */
  this.createNextSchedule = function (taskCode, targetTime) {
    if (!targetTime || targetTime < new Date() + 5 * 60000) {
      logUtils.warnInfo('任务执行间隔不能小于五分钟 重置为五分钟后执行')
      targetTime = new Date().getTime() + 5 * 60000
    }
    let date = formatDate(new Date(), 'yyyy-MM-dd')
    let newSchedule = {
      taskCode: taskCode,
      triggerType: 2,
      executeStatus: 'A',
      executeTime: targetTime,
      executeDate: date,
    }
    let scheduleList = signTaskService.listTaskScheduleByDate(date, taskCode)
    let exists = scheduleList.filter(schedule => schedule.executeStatus === 'A' && Math.abs(schedule.executeTime - targetTime) < 5 * 60000)
    if (exists && exists.length >= 1) {
      logUtils.warnInfo(['任务[{}]已存在五分钟内的执行计划{}个 跳过创建', taskCode, exists.length])
      return
    }
    let id = signTaskService.insertTaskSchedule(newSchedule)
    logUtils.debugInfo(['创建任务[{}]执行计划成功 id：{}', taskCode, id])
  }

  /**
   * 判断今天子任务是否已经执行过
   */
  this.isSubTaskExecuted = function (subTaskInfo, checkOnly) {
    logUtils.debugInfo(['sub task info: {}', JSON.stringify(subTaskInfo)])
    let subTaskCode = subTaskInfo.taskCode, taskName = subTaskInfo.taskName
    if (!subTaskInfo.enabled) {
      FloatyInstance.setFloatyText(this.name + ':' + taskName + '未启用，跳过执行')
      return true
    }
    if (checkIsSignExecutedByDb(this.taskCode + ':' + subTaskCode)) {
      if (checkOnly) {
        return true
      }
      FloatyInstance.setFloatyText(this.name + ':' + taskName + '今日已经执行过，跳过执行')
      sleep(1000)
      return true
    } else {
      markExecuteStart(this.taskCode + ':' + subTaskCode)
      // 自动延期
      runningQueueDispatcher.renewalRunningTask()
      return false
    }
  }

  /**
   * 标记子任务已完成
   * 
   * @param {string} subTaskInfo 子任务信息
   */
  this.setSubTaskExecuted = function (subTaskInfo) {
    setExecutedInDb(this.taskCode + ':' + subTaskInfo.taskCode)
  }

  /**
   * 等待跳过按钮并点击
   */
  this.awaitAndSkip = function (checkingList) {
    checkingList = checkingList || ['\\s*允许\\s*', '\\s*跳过\\s*', '\\s*下次再说\\s*']
    checkingList.forEach(checkContent => {
      FloatyInstance.setFloatyText('准备查找是否存在' + checkContent)
      let skip = WidgetUtils.widgetGetOne(checkContent, 3000)
      if (skip !== null) {
        automator.clickCenter(skip)
        sleep(1000)
      }
    })
  }

  /**
   * 展示按钮位置并点击
   * 
   * @param {UiObject} button 
   * @param {string} desc 
   * @param {number} delay 
   */
  this.displayButtonAndClick = function (button, desc, delay) {
    this.displayButton(button, desc, delay)
    if (button) {
      if (automator.checkCenterClickable(button)) {
        automator.clickCenter(button)
      } else {
        logUtils.errorInfo(['按钮位置不正确无法点击，请检查代码'], true)
        return false
      }
    }
    return button
  }

  /**
   * 展示按钮位置但不点击
   * 
   * @param {UiObject} button 
   * @param {string} desc 
   * @param {number} delay 
   */
  this.displayButton = function (button, desc, delay) {
    if (button) {
      FloatyInstance.setFloatyInfo(
        {
          x: button.bounds().centerX(),
          y: button.bounds().centerY()
        },
        desc)
      sleep(delay || 1000)
    }
    return button
  }

  /**
   * 通过图片base64查找目标 并展示位置 默认为灰度找图 速度快一些
   * 
   * @param {string} base64 灰度目标图片base64
   * @param {string} content 
   * @param {number} delay 展示时间
   * @param {boolean} clickIt 找到后点击目标
   * @param {number} loop 循环查找次数 默认查找三次 间隔500ms
   * @returns 
   */
  this.captureAndCheckByImg = function (base64, content, delay, clickIt, loop) {
    delay = delay || 800
    if (typeof loop === 'undefined') {
      loop = 3
    }
    let screen = commonFunctions.captureScreen()
    logUtils.debugInfo('准备截图查找目标：' + content)
    if (screen) {
      let collect = OpenCvUtil.findByImageSimple(images.cvtColor(images.grayscale(screen), 'GRAY2BGRA'), images.fromBase64(base64))
      if (collect) {
        logUtils.debugInfo('截图找到了目标：' + content)
        FloatyInstance.setFloatyInfo({
          x: collect.centerX(),
          y: collect.centerY()
        }, '找到了 ' + content)
        sleep(delay)
        if (clickIt) {
          automator.click(collect.centerX(), collect.centerY())
          sleep(delay)
        }
        return this.wrapImgPointWithBounds(collect)
      } else if (loop-- > 1) {
        sleep(500)
        logUtils.debugInfo(['未找到目标「{}」进行下一次查找，剩余尝试次数：{}', content, loop])
        return this.captureAndCheckByImg(base64, content, delay, clickIt, loop)
      }
    }
    FloatyInstance.setFloatyText('未找到 ' + content)
    sleep(delay)
    return null
  }

  this.captureAndCheckByOcr = function (regex, content, region, delay, clickIt, loop) {
    if (!localOcrUtil.enabled) {
      logUtils.warnInfo('当前AutoJS不支持OCR')
      return null
    }
    delay = delay || 800
    if (typeof loop === 'undefined') {
      loop = 3
    }
    let screen = commonFunctions.captureScreen()
    logUtils.debugInfo('准备OCR查找目标：' + content)
    if (screen) {
      let findText = localOcrUtil.recognizeWithBounds(screen, region, regex)
      if (findText && findText.length > 0) {
        let collect = findText[0].bounds
        logUtils.debugInfo(['OCR找到了目标 [{}]: {}', content, findText[0].label])
        FloatyInstance.setFloatyInfo({
          x: collect.centerX(),
          y: collect.centerY()
        }, '找到了 ' + content)
        sleep(delay)
        if (clickIt) {
          automator.click(collect.centerX(), collect.centerY())
          sleep(delay)
        }
        return this.wrapOcrPointWithBounds(collect)
      } else if (loop-- > 1) {
        sleep(delay)
        logUtils.debugInfo(['未找到目标「{}」进行下一次查找，剩余尝试次数：{}', content, loop])
        logUtils.debugForDev(['图片数据：[data:image/png;base64,{}]', images.toBase64(images.clip(screen, config.device_width / 2, config.device_height * 0.7, config.device_width - config.device_width / 2, config.device_height - config.device_height * 0.7))])
        return this.captureAndCheckByOcr(regex, content, region, delay, clickIt, loop)
      }
    } else {
      logUtils.errorInfo('截图失败')
    }
    FloatyInstance.setFloatyText('未找到 ' + content)
    sleep(delay)
    return null
  }


  this.captureAndGetOcrText = function (desc, region) {
    if (!localOcrUtil.enabled) {
      logUtils.warnInfo('当前AutoJS不支持OCR')
      return null
    }
    let screen = commonFunctions.captureScreen()
    logUtils.debugInfo('准备OCR获取文本：' + desc)
    if (screen) {
      let findText = localOcrUtil.recognizeWithBounds(screen, region)
      if (findText && findText.length > 0) {
        return findText.map(v => v.label).join('')
      }
    } else {
      logUtils.errorInfo('截图失败')
    }
    FloatyInstance.setFloatyText('未找到文本内容')
    sleep(1000)
    return null
  }

  /**
   * 循环截图等待目标图片出现
   * 
   * @param {string} base64 查找目标图片的base64
   * @param {string} content 说明
   * @param {number} limit 等待时间 单位秒
   * @returns 
   */
  this.checkForTargetImg = function (base64, content, limit) {
    limit = limit || 5
    let find = this.captureAndCheckByImg(base64, content, null, false, 1)
    while (!find && limit-- > 0) {
      FloatyInstance.setFloatyText('暂未找到' + content + ' 继续等待')
      sleep(1000)
      find = this.captureAndCheckByImg(base64, content, null, false, 1)
    }
    return !!find
  }

  /**
   * 通过图片base64使用SIFT方式查找目标 并展示位置 SIFT找灰度有问题 容易匹配相似度高但非目标的对象
   * 
   * @param {string} base64 灰度目标图片base64
   * @param {string} content 
   * @param {number} delay 展示时间
   * @returns 
   */
  this.captureAndCheckBySIFT = function (base64, content, delay) {
    delay = delay || 800
    let screen = commonFunctions.captureScreen()
    if (screen) {
      let collect = OpenCvUtil.findBySIFT(images.grayscale(screen), images.fromBase64(base64))
      if (collect) {
        FloatyInstance.setFloatyInfo({
          x: collect.centerX(),
          y: collect.centerY()
        }, '找到了 ' + content)
        sleep(delay)
        return this.wrapImgPointWithBounds(collect)
      }
    }
    FloatyInstance.setFloatyText('未找到 ' + content)
    sleep(delay)
    return null
  }

  /**
   * 给图片识别点增加bounds方法 主要用于获取centerX 和 centerY
   * @param {object} imagePoint 
   */
  this.wrapImgPointWithBounds = function (imagePoint) {
    if (imagePoint && !imagePoint.bounds) {
      imagePoint.bounds = () => {
        return imagePoint
      }
    }
    return imagePoint
  }

  /**
   * 给OCR识别点增加bounds方法 主要用于获取centerX 和 centerY
   * @param {Rect} ocrPoint 
   */
  this.wrapOcrPointWithBounds = function (ocrPoint) {
    if (!ocrPoint) {
      return null
    }
    if (!ocrPoint.bounds) {
      let newPoint = Object.create(ocrPoint)
      newPoint.bounds = () => ocrPoint
      return newPoint
    }
    return ocrPoint
  }

  this.boundsToPosition = function (bounds) {
    return { x: bounds.centerX(), y: bounds.centerY() }
  }

  /**
   * abstract funcs
   */
  this.exec = () => { }

  function checkIsSignExecutedByDb (taskCode, subTasks) {
    if (subTasks && subTasks.length > 0) {
      for (let i = 0; i < subTasks.length; i++) {
        let subTask = subTasks[i]
        if (!checkIsSignExecutedByDb(taskCode + ':' + subTask.taskCode)) {
          return false
        }
      }
      return true
    } else {
      let now = new Date()
      let date = formatDate(now, 'yyyy-MM-dd')
      let scheduleList = signTaskService.listTaskScheduleByDate(date, taskCode)
      // 过滤当天 未执行且到达时间的
      scheduleList = scheduleList.filter(schedule =>
        (schedule.executeStatus === 'A' || schedule.executeStatus === 'P')
        // 五分钟内的直接执行
        && schedule.executeTime <= now.getTime() + 5 * 60000)
      return !scheduleList || scheduleList.length == 0
    }
  }

  function markExecuteStart (taskCode) {
    let now = new Date()
    let date = formatDate(now, 'yyyy-MM-dd')
    let scheduleList = signTaskService.listTaskScheduleByDate(date, taskCode)
    // 过滤当天 未执行且到达时间的 五分钟内的也计算为已启动用于合并短时间内的任务避免重复启动
    scheduleList.filter(schedule => schedule.executeStatus === 'A' && schedule.executeTime <= now.getTime() + 5 * 60000)
      .forEach(schedule => {
        let forUpdate = {
          executeStatus: 'P',
          realExecuteTime: now.getTime(),
          modifyTime: new Date(),
        }
        signTaskService.updateTaskScheduleById(schedule.id, forUpdate)
      })
  }

  function setExecutedInDb (taskCode) {
    let now = new Date()
    let date = formatDate(now, 'yyyy-MM-dd')
    let scheduleList = signTaskService.listTaskScheduleByDate(date, taskCode)
    // 过滤当天 未执行且到达时间的
    scheduleList.filter(schedule => {
      // 已经标记执行中，且执行时间小于当前时间 或者 等待执行 但是执行时间小于当前时间的（将所有短时间内重复的标记为已完成）
      return schedule.executeStatus === 'P' && schedule.realExecuteTime <= now.getTime()
        || schedule.executeStatus === 'A' && schedule.executeTime <= now.getTime()
    })
      .forEach(schedule => {
        let forUpdate = {
          executeStatus: 'S',
          executeEndTime: now.getTime(),
          executeCost: now.getTime() - schedule.realExecuteTime,
          modifyTime: new Date(),
        }
        if (forUpdate.executeCost > ~(1<<31)) {
          logUtils.warnInfo(['当前任务起始时间不正确：{}-{}', schedule.id, schedule.taskCode])
          forUpdate.executeCost = now.getTime() - schedule.executeTime
        }
        signTaskService.updateTaskScheduleById(schedule.id, forUpdate)
      })

  }

  this.createStoreOperator = function (storeKey, initValue) {
    return new StoreOperator(this, storeKey, initValue)
  }

  // 初始化存储
  this.initStorages()

  function StoreOperator (_this, storeKey, initValue) {
    this.storeKey = storeKey
    _this.initDailyStorage(storeKey, initValue)
  
    this.updateStorageValue = function (update) {
      let value = _this.getDailyStorage(this.storeKey)
      update(value)
      _this.setDailyStorage(this.storeKey, value)
    }
  
    this.getValue = function () {
      return _this.getDailyStorage(this.storeKey)
    }
  }

  this.cvt = function (position) {
    return parseInt(config.scaleRate * position)
  }
}
/**
 * 初始化自定义存储，用于每日数据缓存
 */
BaseSignRunner.prototype.initStorages = () => { }
module.exports = BaseSignRunner
