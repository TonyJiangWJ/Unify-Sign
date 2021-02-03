/*
 * @Author: TonyJiangWJ
 * @Date: 2020-11-29 11:28:15
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-12-26 11:13:46
 * @Description: 
 */
"ui";

const prepareWebView = require('../../lib/PrepareWebView.js')
importClass(android.view.View)
importClass(android.view.WindowManager)

// ---修改状态栏颜色 start--
// clear FLAG_TRANSLUCENT_STATUS flag:
activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
// add FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS flag to the window
activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
activity.getWindow().setStatusBarColor(android.R.color.white)
activity.getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR)
// ---修改状态栏颜色 end--

let singletonRequire = require('../../lib/SingletonRequirer.js')(runtime, this)
let FileUtils = singletonRequire('FileUtils')
let { config } = require('../../config.js')(runtime, this)
config.develop_mode = true
config.async_save_log_file = false
let commonFunctions = singletonRequire('CommonFunction')
let resourceMonitor = require('../../lib/ResourceMonitor.js')(runtime, this)
let OpenCvUtil = require('../../lib/OpenCvUtil.js')
config.hasRootPermission = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
if (config.device_width < 10 || config.device_height < 10) {
  if (commonFunctions.requestScreenCaptureOrRestart(true)) {
    commonFunctions.ensureDeviceSizeValid()
  } else {
    toastLog('获取截图权限失败，且设备分辨率信息不正确，可能无法正常运行脚本')
  }
}
ui.layout(
  <vertical>
    <webview id="webview" margin="0 10" />
  </vertical>
)

let mainScriptPath = FileUtils.getRealMainScriptPath(true)
let indexFilePath = "file://" + mainScriptPath + "/test/visual_test/index.html"
let postMessageToWebView = () => { console.error('function not ready') }

// 图片数据
let testImagePath = FileUtils.getCurrentWorkPath() + '/test/visual_test/测试用图片.png'

let bridgeHandler = {
  toast: data => {
    toast(data.message)
  },
  toastLog: data => {
    toastLog(data.message)
  },
  // 测试回调
  callback: (data, callbackId) => {
    log('callback param:' + JSON.stringify(data))
    postMessageToWebView({ callbackId: callbackId, data: { message: 'hello,' + callbackId } })
  },
  loadImageInfo: (data, callbackId) => {
    threads.start(function () {
      if (files.exists(testImagePath)) {
        let countdown = new Countdown()
        let imageInfo = images.read(testImagePath)
        let grayImageInfo = images.grayscale(imageInfo)
        let intervalImageInfo = images.inRange(data.intervalByGray ? grayImageInfo : imageInfo
          , data.lowerRange || '#000000', data.higherRange || '#FFFFFF')
        countdown.summary('图片灰度二值化处理等')
        countdown.restart()
        let image = {
          intervalImageData: 'data:image/png;base64,' + images.toBase64(intervalImageInfo)
        }
        if (!data.intervalBase64Only) {
          image.originImageData = 'data:image/png;base64,' + images.toBase64(imageInfo)
          image.grayImageData = 'data:image/png;base64,' + images.toBase64(grayImageInfo)
        }
        countdown.summary('图片数据转Base64')
        postMessageToWebView({ callbackId: callbackId, data: { success: true, image: image } })
      } else {
        toastLog('图片数据不存在，无法执行')
        postMessageToWebView({ callbackId: callbackId, data: { success: false } })
      }
    })
  }
}

postMessageToWebView = prepareWebView(ui.webview, {
  indexFilePath: indexFilePath,
  mainScriptPath: mainScriptPath,
  bridgeHandler: bridgeHandler
})
// ---------------------

let timeout = null
ui.emitter.on('back_pressed', (e) => {
  if (ui.webview.canGoBack()) {
    ui.webview.goBack()
    e.consumed = true
    return
  }
  // toastLog('触发了返回')
  if (timeout == null || timeout < new Date().getTime()) {
    e.consumed = true
    toastLog('再按一次退出')
    // 一秒内再按一次
    timeout = new Date().getTime() + 1000
  } else {
    toastLog('再见~')
  }
})

function Countdown () {
  this.start = new Date().getTime()
  this.getCost = function () {
    return new Date().getTime() - this.start
  }

  this.summary = function (content) {
    console.verbose(content + ' 耗时' + this.getCost() + 'ms')
  }

  this.restart = function () {
    this.start = new Date().getTime()
  }

}