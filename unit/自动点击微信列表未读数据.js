let sRequire = require('../lib/SingletonRequirer')(runtime, this)
let automator = sRequire('Automator')
let widgetUtils = sRequire('WidgetUtils')
let logUtils = sRequire('LogUtils')

let bottomWidget = widgetUtils.widgetGetById('com.tencent.mm:id/czl')
let bottomHeight = device.height - 160
if (bottomWidget) {
  bottomHeight = bottomWidget.bounds().top
}

function checkAndClick() {
  let target = widgetUtils.widgetGetById('com.tencent.mm:id/ga3')
  if (target && target.bounds().top < bottomHeight) {
    automator.clickCenter(target)
    sleep(1000)
    automator.back()
    return true
  } else {
    return false
  }
}

function getUnreadInfo() {
  let target = widgetUtils.widgetGetById('android:id/text1')
  if (target) {
    let content  = target.desc() || target.text()
    let regex = /微信.*(\d+)/
    if (regex.test(content)) {
      let unreadCount = parseInt(regex.exec(content)[1])
      logUtils.debugInfo(['未读数据: {}', unreadCount])
      return unreadCount
    } else {
      logUtils.warnInfo(['未匹配到未读数据: {}', content])
    }
  }
  logUtils.debugInfo(['未找到未读数据'])
  return 0
}

while (getUnreadInfo() > 0)  {
  while(checkAndClick()) {
    sleep(500)
  }
  automator.scrollDown()
}
