
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
storageFactory.updateValueByKey("signInSucceed", { succeed: {} })