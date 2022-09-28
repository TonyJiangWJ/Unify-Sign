
let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let FileUtils = singletonRequire('FileUtils')
let currentWorkPath = FileUtils.getCurrentWorkPath()
let configPath = currentWorkPath + '/config_data/'

console.show()

exportConfigs(config.dingdong_config, 'dingdong/')
exportConfigs(config.weibo_config, 'weibo/')
exportConfigs(config.bb_farm_config, 'bbfarm/')

function exportConfigs(imageConfig, path) {
  path = configPath + path
  Object.keys(imageConfig).forEach(key => {
    let filePath = path + key + '.data'
    if (files.exists(filePath)) {
      console.verbose('导出配置：', key)
      files.write(filePath, imageConfig[key])
    } else {
      console.warn('配置文件不存在 跳过导出：', key)
    }
  })
}