
let { storage_name: _storage_name } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
let RUNTIME_STORAGE = _storage_name + "_runtime"

let SIGN_IN_SUCCEED = "signInSucceed"
let DISMISS_AWAIT_DIALOG = 'dismissAwaitDialog'
let TIMER_AUTO_START = "timerAutoStart"
let READY = 'ready_engine'

let storageNames = [
  SIGN_IN_SUCCEED,
  DISMISS_AWAIT_DIALOG,
  TIMER_AUTO_START,
  READY
]

let storage = storages.create(RUNTIME_STORAGE)
storageNames.forEach(key => {
  console.log(key + ': ' + storage.get(key))
  console.log('storageFactory: ' + JSON.stringify(storageFactory.getValueByKey(key, true)))
  // 清空数据
  // storage.put(key, null)
})

let restartList = []
if (restartList.length > 0) {
  let succeedStorage = storageFactory.getValueByKey(SIGN_IN_SUCCEED) || { succeed: {} }
  restartList.forEach(key => {
    succeedStorage.succeed[key] = false
  })
  storageFactory.updateValueByKey(SIGN_IN_SUCCEED, succeedStorage)
}