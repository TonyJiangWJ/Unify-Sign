let { convertDefaultData, getCurrentWorkPath, readImgDataIfExists } = require('./lib/configUtil.js')
let extendCustomSignConfig = files.exists(getCurrentWorkPath() + '/extends/CustomSignConfig.js') ? require('./extends/CustomSignConfig.js') : null

module.exports = function (default_config, config, CONFIG_STORAGE_NAME) {

  // 扩展配置
  let workpath = getCurrentWorkPath()
  let configDataPath = workpath + '/config_data/'
  let binder = new CustomSignConfigBinder(default_config, config, CONFIG_STORAGE_NAME)
  // 叮咚识图配置
  binder.bindCustomSignConfig('dingdong', {}, [
    'mine_base64', 'fishpond_entry', 'fishpond_check', 'fishpond_can_collect',
    'fishpond_daily_collect', 'fishpond_normal_collect', 'fishpond_continuous_sign', 'fishpond_do_continuous_sign',
    'fishpond_close_continuous_sign', 'fishpond_close', 'orchard_entry', 'orchard_can_collect', 'orchard_daily_collect',
    'orchard_normal_collect', 'orchard_check', 'sign_and_get_points'
  ])

  // 微博
  binder.bindCustomSignConfig('weibo', {}, ['sign_btn', 'mine_btn', 'mine_checked_btn', 'signed_icon'])

  // 芭芭农场
  binder.bindCustomSignConfig('bb_farm', {}, [
    'collect_btn_alipay', 'entry_check_alipay', 'task_btn_alipay',
    'collect_btn_taobao', 'entry_check_taobao', 'task_btn_taobao'
  ])

  // 米哈游签到
  binder.bindCustomSignConfig('mihoyo', {}, ['reward_icon'])

  // 执行扩展配置
  extendCustomSignConfig && extendCustomSignConfig(binder)


  function CustomSignConfigBinder (default_config, config, CONFIG_STORAGE_NAME) {
    /**
     * 编写图像配置的读取和覆盖代码
     *
     * @param {string} custom_config_key 指定strage中的存储KEY 需要保持唯一
     * @param {Object} custom_sign_config 初始化的配置对象 如自定义配置字段
     * @param {Array} custom_img_keys 图片字段列表
     */
    this.bindCustomSignConfig = function (custom_config_key, custom_sign_config, custom_img_keys) {
      config.custom_config_keys = config.custom_config_keys || []
      config.custom_config_keys.push(custom_config_key)
      // 指定本地.data文件存储路径
      let config_path = custom_config_key + '/'
      custom_sign_config = custom_sign_config || {}
      custom_img_keys.forEach(imageKey => {
        // console.verbose('加载路径：', configDataPath + config_path + imageKey + '.data')
        custom_sign_config[imageKey] = readImgDataIfExists(configDataPath + config_path + imageKey + '.data')
        // console.verbose('内容：', custom_sign_config[imageKey]?custom_sign_config[imageKey].substring(0, 20) : '')
      })
      // 将自定义配置挂载到default_config和config
      default_config[custom_config_key + '_config'] = custom_sign_config
      config[custom_config_key + '_config'] = convertDefaultData(custom_sign_config, CONFIG_STORAGE_NAME + '_' + custom_config_key)
    }
  }
}

