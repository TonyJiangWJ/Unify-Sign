
let { config: _config, storage_name: _storage_name, project_name } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
const VALUE1 = 'value_one'
const VALUE2 = 'value_two'
const VALUE3 = 'value_three'

let storage = storages.create(_storage_name + "_runtime")
log(JSON.stringify(storage.get(VALUE1)))
storageFactory.initFactoryByKey(VALUE1, { key: 'value1' })
storageFactory.initFactoryByKey(VALUE2, { success: false })
storageFactory.initFactoryByKey(VALUE3, { sss: '' })

log(JSON.stringify(storageFactory.getValueByKey(VALUE1)))
log(JSON.stringify(storageFactory.getValueByKey(VALUE2)))
log(JSON.stringify(storageFactory.getValueByKey(VALUE3)))

storageFactory.updateValueByKey(VALUE1, { key: 'changed2' })
storageFactory.updateValueByKey(VALUE2, { success: false, hhh: '2' })
storageFactory.updateValueByKey(VALUE3, { sss: 'changed2' })

log(JSON.stringify(storageFactory.getValueByKey(VALUE1)))
log(JSON.stringify(storageFactory.getValueByKey(VALUE2)))
log(JSON.stringify(storageFactory.getValueByKey(VALUE3)))
log(JSON.stringify(storage.get(VALUE1)))
