/**
 * 每个项目里面新增或者修改的方法集合
 */
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('./SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
let _logUtils = singletonRequire('LogUtils')
let formatDate = require('./DateUtil.js')
let SIGN_IN_SUCCEED = "signInSucceed"
let RANDOM_START = "randomStart"
let BaseCommonFunction = require('./BaseCommonFunctions.js')

const ProjectCommonFunction = function () {
  BaseCommonFunction.call(this)

  this.keyList = [SIGN_IN_SUCCEED]


  this.checkIsSignExecutedToday = function (name) {
    if (config.develop_mode) {
      // 开发模式直接返回false
      return false
    }
    let signInSucceed = storageFactory.getValueByKey(SIGN_IN_SUCCEED)
    let success = signInSucceed.succeed[name]
    if (success) {
      if (isNaN(parseInt(success))) {
        // 非数字直接返回true 执行过
        return true
      } else {
        return new Date().getTime() < success
      }
    }
    return false
  }

  /**
   * 获取执行时间
   * @param {*} name 
   * @returns 
   */
  this.getExecutedInfo = function (name) {
    let signInSucceed = storageFactory.getValueByKey(SIGN_IN_SUCCEED)
    let success = this.checkIsSignExecutedToday(name)
    let executedTime = ''
    if (success && signInSucceed.succeed_time) {
      executedTime = signInSucceed.succeed_time[name] || ''
    }
    return {
      success: success,
      executedTime: executedTime
    }
  }

  this.setExecutedToday = function (name, timeout) {
    let signInSucceed = storageFactory.getValueByKey(SIGN_IN_SUCCEED)
    if (typeof timeout !== 'undefined' && timeout > 0) {
      signInSucceed.succeed[name] = new Date().getTime() + timeout
    } else {
      signInSucceed.succeed[name] = true
    }
    if (Object.prototype.toString.call(signInSucceed.succeed_time) !== '[object Object]') {
      // 兼容老数据
      signInSucceed.succeed_time = {}
    }
    signInSucceed.succeed_time[name] = formatDate(new Date())
    storageFactory.updateValueByKey(SIGN_IN_SUCCEED, signInSucceed)
  }

  this.markNotExecuted = function (name) {
    let signInSucceed = storageFactory.getValueByKey(SIGN_IN_SUCCEED)
    signInSucceed.succeed[name] = false
    storageFactory.updateValueByKey(SIGN_IN_SUCCEED, signInSucceed)
  }

  this.setRandomStartedIfNeeded = function () {
    let executedInfo = storageFactory.getValueByKey(RANDOM_START)
    if (executedInfo.executed) {
      return true
    } else {
      let randomMinutes = parseInt(480 + (Math.random() * 1000 % 720))
      executedInfo.executed = true
      executedInfo.randomMinutes = randomMinutes
      storageFactory.updateValueByKey(RANDOM_START, executedInfo)
      _logUtils.debugInfo(['随机延迟{}分钟后启动', randomMinutes])
      this.setUpAutoStart(randomMinutes)
      exit()
    }
  }
}

ProjectCommonFunction.prototype = Object.create(BaseCommonFunction.prototype)
ProjectCommonFunction.prototype.constructor = ProjectCommonFunction

ProjectCommonFunction.prototype.initStorageFactory = function () {
  storageFactory.initFactoryByKey(SIGN_IN_SUCCEED, { succeed: {}, succeed_time: {} })
  storageFactory.initFactoryByKey(RANDOM_START, { executed: false })
}


module.exports = ProjectCommonFunction