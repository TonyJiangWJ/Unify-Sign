let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
let SIGN_IN_SUCCEED = "signInSucceed"

storageFactory.initFactoryByKey(SIGN_IN_SUCCEED, { succeed: {}, succeed_time: {} })
log("缓存数据：" + JSON.stringify(storageFactory.getValueByKey(SIGN_IN_SUCCEED)))