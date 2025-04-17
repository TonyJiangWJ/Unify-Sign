/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-09 20:42:08
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2025-04-16 15:45:59
 * @Description: 
 */
require('./lib/Runtimes.js')(global)

let extendSignConfig = require('./signConfig.js')
let custom_config = files.exists('./extends/CustomConfig.js') ? require('./extends/CustomConfig.js') : { supported_signs: [] }
custom_config = custom_config || { supported_signs: [] }
let default_config = {
  record_failed_info: false,
  not_lingering_float_window: true,
  github_url: 'https://github.com/TonyJiangWJ/Unify-Sign',
  // github release url 用于检测更新状态
  github_latest_url: 'https://api.github.com/repos/TonyJiangWJ/Unify-Sign/releases/latest',
  history_tag_url: 'https://api.github.com/repos/TonyJiangWJ/Unify-Sign/tags',
  killAppWithGesture: true,
  thread_name_prefix: 'unify_sign_',
  notificationId: 113,
  notificationChannelId: 'unify_sign_channel_id',
  notificationChannel: '聚合签到通知',
  supported_signs: [
    {
      name: '蚂蚁积分签到',
      taskCode: 'AntCredits',
      script: 'AntCredits.js',
      enabled: true
    },
    {
      name: '京东签到',
      taskCode: 'JingDong',
      script: 'JingDongBeans.js',
      enabled: true,
      subTasks: [
        {
          taskCode: 'beanSign',
          taskName: '签到',
          enabled: true,
        },
        {
          taskCode: 'doubleSign',
          taskName: '双签领豆',
          enabled: false,
        },
        {
          taskCode: 'plantBean',
          taskName: '种豆得豆',
          enabled: true,
        },
        {
          taskCode: 'drugSign',
          taskName: '京东买药',
          enabled: true,
        }
      ]
    },
    {
      name: '米游社-原神签到',
      taskCode: 'MiHoYo',
      script: 'MiHoYou.js',
      enabled: true
    },
    {
      name: '淘金币签到',
      taskCode: 'Taobao',
      script: 'Taobao-Coin.js',
      enabled: true
    },
    {
      name: '叮咚签到',
      taskCode: 'DingDong',
      script: 'DingDong.js',
      enabled: true,
      subTasks: [
        {
          taskCode: 'creditSign',
          taskName: '积分签到',
          enabled: true,
        },
        {
          taskCode: 'fishpond',
          taskName: '鱼塘签到',
          enabled: true,
        }
      ]
    },
    {
      name: '微博积分签到',
      taskCode: 'Weibo',
      script: 'Weibo.js',
      enabled: true
    },
    {
      name: '芭芭农场',
      taskCode: 'BBFarm',
      script: 'BBFarm.js',
      enabled: true
    },
    {
      name: '淘宝现金签到',
      taskCode: 'TaobaoSign',
      script: 'Taobao-Sign.js',
      enabled: true
    },
    {
      name: '饿了么吃货豆',
      taskCode: 'Eleme',
      script: 'Eleme.js',
      enabled: true
    },
    {
      name: '什么值得买',
      taskCode: 'Smzdm',
      script: 'Smzdm.js',
      enabled: true
    },
    {
      name: '支付宝商家积分签到',
      taskCode: 'AlipayMerchant',
      script: 'AlipayMerchantCredits.js',
      enabled: true
    },
    {
      name: '小米商城米金',
      taskCode: 'XiaomiShop',
      script: 'XiaomiShop.js',
      enabled: true
    },
    {
      name: '华住会签到',
      taskCode: 'HuaZhu',
      script: 'HuaZhu.js',
      enabled: true
    },
    {
      name: '小米钱包',
      taskCode: 'XiaomiWallet',
      script: 'XiaomiWallet.js',
      enabled: true
    },
    {
      name: '阿里云盘',
      taskCode: 'AliCloudDrive',
      script: 'AliCloudDrive.js',
      enabled: true
    },
    {
      name: '一嗨签到',
      taskCode: 'EHai',
      script: 'Ehai.js',
      enabled: true
    },
    {
      name: '网上国网',
      taskCode: 'wsgw',
      script: 'WangShangGuoWang.js',
      enabled: true
    }
  ].concat(custom_config.supported_signs || [])
}
// 不同项目需要设置不同的storageName，不然会导致配置信息混乱
let CONFIG_STORAGE_NAME = 'unify_sign'
let PROJECT_NAME = '聚合签到'
// 公共扩展
let config = require('./config_ex.js')(default_config, { CONFIG_STORAGE_NAME, PROJECT_NAME })

// 签到任务信息字段需要额外处理
let storageConfig = storages.create(CONFIG_STORAGE_NAME)
let key = 'supported_signs'
// supported_signs是一个对象，需要用对象来解析覆盖
let stored = JSON.parse(JSON.stringify(storageConfig.get(key)))
// 需要考虑default_config有新增和修改情况，因此仅仅提取enabled字段
// TODO enabled 信息可以考虑保存到数据库中
config[key] = default_config[key]
config[key].forEach(sign => {
  let match = stored.filter(s => s.taskCode === sign.taskCode)
  if (match && match.length > 0) {
    let storeSignConfig = match[0]
    sign.enabled = storeSignConfig.enabled
    if (sign.subTasks && sign.subTasks.length > 0) {
      sign.subTasks.forEach(subTask => {
        match = (storeSignConfig.subTasks || []).filter(v => v.taskCode == subTask.taskCode)
        if (match && match.length > 0) {
          subTask.enabled = match[0].enabled
        }
      })
    }
  }
})

config.exportIfNeeded(module, null)

// 扩展配置
extendSignConfig(default_config, config, CONFIG_STORAGE_NAME)
config.code_version = 'v2.4.1'
