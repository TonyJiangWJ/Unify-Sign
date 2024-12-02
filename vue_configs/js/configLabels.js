const CONFIG_LABELS = {
  about: {
    version: '版本',
    qq_group: 'QQ交流群',
  },
}

const PAGES = Object.keys(CONFIG_LABELS)

function getLabelByConfigKey(key) {
  for (let page of PAGES) {
    if (CONFIG_LABELS[page][key]) {
      return CONFIG_LABELS[page][key]
    }
  }
  

  return key
}

/**
 * getLabelByConfigKey 简化写法
 * @param {String} key 
 * @returns 
 */
function $t(key) {
  return getLabelByConfigKey(key)
}