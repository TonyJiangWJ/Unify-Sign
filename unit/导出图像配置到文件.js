
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let FileUtils = singletonRequire('FileUtils')
let currentWorkPath = FileUtils.getCurrentWorkPath()
let configPath = currentWorkPath + '/config_data/'

let dingdong_config = config.dingdong_config
let dingdongPath = configPath + 'dingdong/'
console.show()
Object.keys(dingdong_config).forEach(key => {
  let filePath = dingdongPath + key + '.data'
  if (files.exists(filePath)) {
    console.verbose('导出配置：', key)
    files.write(filePath, dingdong_config[key])
  } else {
    console.warn('配置文件不存在 跳过导出：', key)
  }
})
