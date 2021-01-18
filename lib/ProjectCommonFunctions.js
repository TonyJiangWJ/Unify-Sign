/**
 * 每个项目里面新增或者修改的方法集合
 */
let singletonRequire = require('./SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
let SIGN_IN_SUCCEED = "signInSucceed"
let BaseCommonFunction = require('./BaseCommonFunctions.js')  

const ProjectCommonFunction = function () {
  BaseCommonFunction.call(this)

  this.keyList = [SIGN_IN_SUCCEED]


  this.checkIsSignExecutedToday = function (name) {
    let signInSucceed = storageFactory.getValueByKey(SIGN_IN_SUCCEED)
    let success = signInSucceed.succeed[name]
    if (success) {
      if (isNaN(parseInt(success))) {
        return true
      } else {
        return new Date().getTime() < success
      }
    }
    return false
  }

  this.setExecutedToday = function (name, timeout) {
    let signInSucceed = storageFactory.getValueByKey(SIGN_IN_SUCCEED)
    if (typeof timeout !== 'undefined' && timeout > 0) {
      signInSucceed.succeed[name] = new Date().getTime() + timeout
    } else {
      signInSucceed.succeed[name] = true
    }
    storageFactory.updateValueByKey(SIGN_IN_SUCCEED, signInSucceed)
  }
}

ProjectCommonFunction.prototype.initStorageFactory = function () {
  storageFactory.initFactoryByKey(SIGN_IN_SUCCEED, { succeed: {} })
}

ProjectCommonFunction.prototype = Object.create(BaseCommonFunction.prototype)
ProjectCommonFunction.prototype.constructor = ProjectCommonFunction

module.exports = ProjectCommonFunction