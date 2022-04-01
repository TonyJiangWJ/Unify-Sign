let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let WidgetUtils = singletonRequire('WidgetUtils')
let FloatyInstance = singletonRequire('FloatyUtil')
let runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let automator = singletonRequire('Automator')
let logUtils = singletonRequire('LogUtils')
let OpenCvUtil = require('../lib/OpenCvUtil.js')

function BaseSignRunner () {
  this.name = ''
  this.executedSuccess = false
  this.setName = function (name) {
    this.name = name
    return this
  }

  /**
   * 判断今天是否已经执行过，没有的话执行签到任务
   */
  this.executeIfNeeded = function () {
    if (commonFunctions.checkIsSignExecutedToday(this.name)) {
      FloatyInstance.setFloatyText(this.name + '今日已经执行过，跳过执行')
      sleep(1000)
      return true
    } else {
      // 自动延期
      runningQueueDispatcher.renewalRunningTask()
      this.exec()
      return this.executedSuccess
    }
  }

  /**
   * 标记今天已经执行过
   * @param {number} timeout 可选参数，设置一个超时时间，超时时间后可以再次执行
   */
  this.setExecuted = function (timeout) {
    commonFunctions.setExecutedToday(this.name, timeout)
    this.executedSuccess = true
  }

  /**
   * 判断今天子任务是否已经执行过
   */
  this.isSubTaskExecuted = function (taskName, checkOnly) {
    if (commonFunctions.checkIsSignExecutedToday(this.name + ':' + taskName)) {
      if (checkOnly) {
        return true
      }
      FloatyInstance.setFloatyText(this.name + ':' + taskName + '今日已经执行过，跳过执行')
      sleep(1000)
      return true
    } else {
      // 自动延期
      runningQueueDispatcher.renewalRunningTask()
      return false
    }
  }

  /**
   * 标记子任务已完成
   * 
   * @param {string} taskName 子任务名称
   * @param {number} timeout 可选参数 设置超时时间，超时后可以再次执行
   */
  this.setSubTaskExecuted = function (taskName, timeout) {
    commonFunctions.setExecutedToday(this.name + ':' + taskName, timeout)
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
      automator.clickCenter(button)
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
   * @returns 
   */
  this.captureAndCheckByImg = function (base64, content, delay, clickIt) {
    delay = delay || 800
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
        return collect
      }
    }
    FloatyInstance.setFloatyText('未找到 ' + content)
    sleep(delay)
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
    let find = this.captureAndCheckByImg(base64, content)
    while (!find && limit-- > 0) {
      FloatyInstance.setFloatyText('暂未找到' + content + ' 继续等待')
      sleep(1000)
      find = this.captureAndCheckByImg(base64, content)
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
        return collect
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
    if (imagePoint) {
      imagePoint.bounds = () => {
        return imagePoint
      }
    }
  }

  /**
   * abstract funcs
   */
  this.exec = () => { }
}

module.exports = BaseSignRunner