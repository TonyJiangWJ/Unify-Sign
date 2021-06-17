let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let FloatyInstance = singletonRequire('FloatyUtil')
let runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let automator = singletonRequire('Automator')

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
   * 等待跳过按钮并点击
   */
  this.awaitAndSkip = function () {
    let checkingList = ['.*跳过.*', '.*下次再说.*']
    checkingList.forEach(checkContent => {
      let skip = WidgetUtils.widgetGetOne(checkContent, 3000)
      if (skip !== null) {
        automator.clickCenter(skip)
        sleep(1000)
      }
    })
  }

  this.displayButtonAndClick = function (button, desc, delay) {
    if (button) {
      FloatyInstance.setFloatyInfo(
        {
          x: button.bounds().centerX(),
          y: button.bounds().centerY()
        },
        desc)
      sleep(delay || 1000)
      automator.clickCenter(button)
    }
  }

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
  }

  /**
   * abstract funcs
   */
  this.exec = () => { }
}

module.exports = BaseSignRunner