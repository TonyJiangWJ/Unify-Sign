/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-25 16:46:06
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2025-05-31 20:51:46
 * @Description: 
 */

let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let alipayUnlocker = singletonRequire('AlipayUnlocker')
let widgetUtils = singletonRequire('WidgetUtils')
let logUtils = singletonRequire('LogUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')
let BaseSignRunner = require('./BaseSignRunner.js')
let signFailedUtil = singletonRequire('SignFailedUtil')
let warningFloaty = singletonRequire('WarningFloaty')

function CreditRunner () {
  BaseSignRunner.call(this)
  let _package_name = 'com.eg.android.AlipayGphone'
  let _family_regex = /^\+(\d+)$/
  let _this = this
  let sign_page_widget = '会员.*签到赚积分|.*连续签到.*|我要补签|.*你已超过全球.*|做任务赚积分'

  this.collectFamily = false

  this.openCreditPage = function (tryTime) {
    tryTime = tryTime || 1
    commonFunctions.launchPackage(_package_name)
    sleep(500)
    if (config.is_alipay_locked) {
      alipayUnlocker.unlockAlipay()
    }
    app.startActivity({
      action: 'VIEW',
      data: 'alipays://platformapi/startapp?appId=20000160&url=%2Fwww%2FmyPoints.html',
      packageName: _package_name
    })
    sleep(500)
    FloatyInstance.setFloatyText('校验是否有打开确认弹框')
    let confirm = widgetUtils.widgetGetOne(/^打开$/, 3000)
    if (confirm) {
      this.displayButtonAndClick(confirm, '找到了打开按钮')
    } else {
      FloatyInstance.setFloatyText('没有打开确认弹框')
    }
    if (!widgetUtils.widgetWaiting('(我的(积分|等级特权))|每日签到')) {
      if (tryTime >= 5) {
        warnInfo(['检测到未能进入会员积分界面，已尝试多次，放弃重试'])
        return false
      }
      warnInfo(['检测到未能进入会员积分界面，重新进入'])
      commonFunctions.minimize()
      return this.openCreditPage(tryTime++)
    }
    return true
  }


  /**
   * 判断比例 是不是正方形
   * @param {目标控件} bounds 
   */
  this.isCollectableBall = function (bounds) {
    if (bounds) {
      let flag = Math.abs(bounds.width() - bounds.height()) <= 10 && bounds.width() > 30
      logUtils.debugInfo(['校验控件形状是否符合：[{}, {}] result: {}', bounds.width(), bounds.height(), flag])
      return flag
    }
    return false
  }

  this.canCollect = function (val) {
    let bounds = val.bounds()
    return this.isCollectableBall(bounds)
  }

  this.collectCredits = function (position, regex) {
    // 等待稳定
    sleep(1000)
    let widgets = widgetUtils.widgetGetAll(regex, null, true)
    let collected = true
    while (widgets && collected) {
      logUtils.logInfo(['总数：{}', widgets.target.length])
      let targets = widgets.target
      let isDesc = widgets.isDesc
      let totalCollect = 0
      targets.forEach(val => {
        let contentInfo = isDesc ? val.desc() : val.text()
        if (this.canCollect(val)) {
          automator.clickCenter(val)
          logUtils.logInfo([
            'value: {}', contentInfo
          ])
          totalCollect += parseInt(regex.exec(contentInfo)[1])
          sleep(500)
        }
      })
      logUtils.infoLog(['{} 总共领取：「{}」分', position, totalCollect])
      collected = totalCollect > 0
      if (collected) {
        sleep(1000)
        // 再次检测, 缩短检测超时时间为两秒
        widgets = widgetUtils.widgetGetAll(regex, 2000, true)
      }
    }
  }

  this.checkAndCollect = function () {
    sleep(1000)
    FloatyInstance.setFloatyTextColor('#00ff00')
    FloatyInstance.setFloatyText('检测是否有今日支付积分')
    auto.clearCache && auto.clearCache()
    // 今日支付积分
    target = widgetUtils.widgetGetOne('.*全部领取.*')
    if (target) {
      this.displayButtonAndClick(target, '找到了支付积分，准备收取')
    } else {
      if (!this.captureAndCheckByOcr('全部领取', '全部领取', null, null, true, 1)) {
        FloatyInstance.setFloatyTextColor('#ff0000')
        FloatyInstance.setFloatyText('未找到今日支付积分')
        signFailedUtil.recordFailedWidgets(this.taskCode, '支付积分')
        sleep(1000)
      }
    }
    sleep(500)
    FloatyInstance.setFloatyTextColor('#00ff00')
    FloatyInstance.setFloatyText('准备执行每日签到')
    // 直接进入积分签到
    openSignPage()
    commonFunctions.setAliCreditsSigned()
  }



  this.enterCreditsTaskList = function () {
    let target = widgetUtils.widgetGetOne('每日签到')
    if (this.displayButtonAndClick(target, '准备执行签到浏览任务')) {
      sleep(1000)
      return true
    } else {
      FloatyInstance.setFloatyText('未能找到每日签到入口')
      sleep(1000)
    }
    return false
  }

  this.ensureCurrentInTaskPage = function () {
    let tmp
    if ((tmp = currentPackage()) != _package_name) {
      warnInfo(['检测到当前包名{}不正确，重新打开积分签到界面', tmp])
      return openSignPage()
    }
    let opened = false, limit = 5
    while (!(opened = widgetUtils.widgetWaiting(sign_page_widget, null, 1000)) && limit-- > 0) {
      automator.back()
      sleep(1000)
      if (currentPackage() != _package_name) {
        return openSignPage()
      }
    }
    if (opened) {
      return true
    }
    commonFunctions.minimize(_package_name)
    this.pushLog('未能打开积分签到任务界面， 重新打开')
    return openSignPage()
  }

  this.doTask = function (limit) {
    if (limit <= 0) {
      return
    }
    this.ensureCurrentInTaskPage()
    this.pushLog('等待页面完全刷新 等待5秒')
    let wait = 5
    while (wait > 0) {
      this.replaceLastLog('等待页面完全刷新 等待' + wait-- + '秒')
      sleep(1000)
    }
    FloatyInstance.setFloatyText('查找任务')
    sleep(1000)
    let toFinishList = widgetUtils.widgetGetAll('\\s*去完成')
    if (!toFinishList || toFinishList.length <= 0) {
      this.pushLog('无可完成任务')
      signFailedUtil.recordFailedWidgets(this.taskCode, '每日任务')
      let changeTask = widgetUtils.widgetGetOne('换一换', 1000)
      if (changeTask) {
        this.pushLog('没找到可执行的任务，换一换：' + limit)
        changeTask.click()
        return this.doTask(limit - 1)
      }
      return
    }
    let anyFailed = false
    let toFinishBtn = toFinishList.map(v => {
      try {

        function getTitle (container) {
          let textViewContainer = container.child(0).child(0)
          // 找到第一个textView控件
          let textView = textViewContainer.child(1)
          if (textView && textView.className() == 'android.widget.TextView') {
            return { title: textView.text(), boundsInfo: textView.bounds() }
          }
          if (textView.child(0) && textView.child(0).className() == 'android.widget.TextView') {
            return { title: textView.child(0).text(), boundsInfo: textView.child(0).bounds() }
          }
          textView = textViewContainer.child(2)
          if (textView && textView.className() == 'android.widget.TextView') {
            return { title: textView.text(), boundsInfo: textView.bounds() }
          }
          logUtils.warnInfo('无法读取当前任务标题，其结构和预定义解析代码不匹配')
          return { title: '无法提取正确的标题', bounds: textViewContainer.bounds() }
        }
        // TODO 需要优化一下这块控件信息的判断 一旦结构变更就无法正确执行了
        let container = v.parent().parent().parent()
        let boundsInfo = null, title = null
        try {
          let result = getTitle(container)
          title = result.title
          boundsInfo = result.bounds
        } catch (e) {
          commonFunctions.printExceptionStack(e)
          boundsInfo = container.bounds()
          title = '提取标题失败'
        }

        if (title) {
          return {
            title: title,
            btn: v,
            titleBounds: boundsInfo
          }
        }
        return false
      } catch (e) {
        anyFailed = true
        logUtils.errorInfo('读取控件信息失败 可能控件信息又变了' + e)
        return false
      }
    }).filter(v => !!v)
    if (anyFailed) {
      signFailedUtil.recordFailedWidgets(this.taskCode, '任务控件信息')
    }
    // 提取当前可以执行的第一个任务
    let task = findFirstExecutableTask.call(this, toFinishBtn)
    // TODO 确保按钮在可见范围
    if (task && task.executable) {
      this.pushLog('执行任务：' + task.name)
      task.execute.apply(this)
      this.pushLog('当前任务执行完毕，尝试下一个任务')
      return this.doTask(limit)
    } else {
      this.pushLog('未找到可以执行的任务，请手动执行')
      sleep(1000)
      let changeTask = widgetUtils.widgetGetOne('换一换', 1000)
      if (changeTask) {
        this.pushLog('没找到可执行的任务，换一换：' + limit)
        changeTask.click()
        return this.doTask(limit - 1)
      }
    }

  }
  // 定义需要跳过的任务
  const skipTaskList = []
  function findFirstExecutableTask (buttonList) {
    if (!buttonList || buttonList.length == 0) {
      return false
    }


    let taskBuilderList = [
      // 首先构建 非视频\搜索\借呗的浏览任务
      () => buildTask(
        btnInfo => {
          let regex = /视频|搜索|借呗|传奇/
          return !regex.test(btnInfo.title) && btnInfo.title.indexOf('15秒') > -1
        },
        function (btn) {
          widgetUtils.widgetWaiting('点击或滑动')
          let limit = new CountdownChecker(16)
          let startY = config.device_height - config.device_height * 0.15
          let endY = startY - config.device_height * 0.3
          automator.gestureDown(startY, endY)
          this.pushLog('滑动浏览，等待' + limit.getRestTime() + '秒')
          while (!this.captureAndCheckByOcr('返回领积分', '返回领积分', null, null, false, 1)) {
            if (limit.isOvertime()) {
              break
            }
            this.replaceLastLog('滑动浏览，等待' + limit.getRestTime() + '秒')
            automator.gestureDown(startY, endY)
            sleep(1000)
          }
          automator.back()
          sleep(1000)
        }
      ),
      // 搜索任务
      () => buildTask(btnInfo => btnInfo.title.indexOf('搜索') > -1,
        function (btn) {
          let searchDiscover = widgetUtils.widgetGetOne('搜索发现', 2000)
          if (searchDiscover) {
            // 点击第一个关键词
            searchDiscover.parent().child(1).child(0).child(0).click()
            let limit = new CountdownChecker(16)
            let startY = config.device_height - config.device_height * 0.15
            let endY = startY - config.device_height * 0.3
            while (widgetUtils.widgetWaiting('浏览得积分', 1000)) {
              if (limit.isOvertime()) {
                break
              }
              FloatyInstance.setFloatyText('等待' + limit.getRestTime() + '秒')
              automator.gestureDown(startY, endY)
              sleep(1000)
            }
            automator.back()
            sleep(1000)
            automator.back()
            sleep(1000)
          }
        }),
      // 借呗任务
      () => buildTask(
        btnInfo => btnInfo.title.indexOf('借呗') > -1,
        function (btn) {
          this.pushLog('借呗任务等待15秒')
          sleep(1000)
          let limit = 15
          while (limit-- > 0) {
            this.replaceLastLog('借呗任务等待' + limit + '秒')
            sleep(1000)
          }
          if (widgetUtils.widgetGetOne('.*逛一逛.*', 1000)) {
            this.pushLog('检测到目标控件，继续等待5s')
            sleep(5000)
          }
          automator.back()
          sleep(1000)
        }
      ),
      // 简单的小程序任务
      () => buildTask((btnInfo) => {
        let regex = /小程序|饿了么|逛一逛|淘宝特价版/
        return regex.test(btnInfo.title)
      },
        function (btn) {
          this.pushLog('小程序任务 点击进入 等待10秒 然后返回')
          let limit = 10
          while (limit-- > 0) {
            this.replaceLastLog('小程序任务等待' + limit + '秒')
            sleep(1000)
          }
          automator.back()
          sleep(1000)
        }
      ),
    ]

    for (let i = 0; i < taskBuilderList.length; i++) {
      let task = taskBuilderList[i]()
      if (task) {
        return task
      }
    }
    this.pushLog('当前任务列表均未定义无法执行：' + JSON.stringify(buttonList.map(info => info.title)))
    return null

    function buildTask (filter, execute) {
      debugInfo(['跳过的任务列表：{}', skipTaskList])
      let resultList = buttonList.filter(btnInfo => skipTaskList.indexOf(btnInfo.title) < 0 && filter(btnInfo))
      if (resultList.length > 0) {
        return {
          name: resultList[0].title,
          executable: true,
          execute: function () {
            let target = resultList[0]
            // // 移动到任务区域，确保 去完成按钮 正确
            // let btn = this.ensureTargetInVisible(target.btn,
            //   [0, config.device_height * 0.1, config.device_width, config.device_height * 0.8],
            //   () => widgetUtils.widgetGetOne(target.title)
            // )
            // sleep(1000)
            // // 通过控件重新获取标题对应的去完成按钮
            // let titleContainer = widgetUtils.widgetGetOne(target.title, 1000)
            // if (titleContainer) {
            //   let bns = titleContainer.bounds()
            //   warningFloaty.addRectangle('查找去完成按钮', [bns.left, bns.top, config.device_width - bns.left, bns.height() * 3.5])
            //   btn = boundsInside(bns.left, bns.top, config.device_width, bns.bottom + bns.height() * 2.5).textContains('去完成').findOne(1000)
            //   if (btn) {
            //     debugInfo(['重新获取控件{}', JSON.stringify(btn.bounds())])
            //   } else {
            //     skipTaskList.push(target.title)
            //     this.pushWarningLog('无法正确找到 去完成 按钮')
            //     warnInfo(['重新获取去完成控件失败，任务名称：{}', target.title])
            //   }
            // } else {
            //   this.pushWarningLog('无法正确找到任务标题:' + new RegExp(target.title).source)
            //   warnInfo(['未能重新找到标题：' + target.title])
            // }
            // if (this.displayButtonAndClick(btn, '去完成', null, false)) {
            if (target.btn.click()) {
              // 标记当前任务执行完毕，如果失败了 不再重复执行 避免死循环
              skipTaskList.push(target.title)
              sleep(1000)
              warningFloaty.clearAll()
              return execute.apply(this, [target.btn])
            } else {
              this.pushWarningLog('去完成按钮点击失败')
              let bns = resultList[0].btn.bounds()
              warningFloaty.addRectangle('未找到去完成按钮', [bns.left, bns.top, bns.width(), bns.height()])
              sleep(1000)
              warningFloaty.clearAll()
            }
          }
        }
      }
    }
  }

  this.doBrowseTask = function () {
    let startY = config.device_height - config.device_height * 0.15
    let endY = startY - config.device_height * 0.3
    this.pushLog('查找 逛一逛赚积分')
    let browser15 = widgetUtils.widgetGetOne('.*逛一逛赚积分.*')
    if (widgetUtils.widgetCheck('滑动浏览以下内容15秒.*', 3000) && this.displayButtonAndClick(browser15, '15秒任务')) {
      sleep(1000)
      let limit = new CountdownChecker(16)
      while (widgetUtils.widgetCheck('滑动浏览以下内容.*', 3000)) {
        if (limit.isOvertime()) {
          break
        }
        FloatyInstance.setFloatyText('等待' + limit.getRestTime() + '秒')
        automator.gestureDown(startY, endY)
        sleep(1000)
      }
    } else {
      this.pushErrorLog('查找 逛一逛赚积分15秒失败')
    }
    this.displayButtonAndClick(widgetUtils.widgetGetOne('做任务赚积分', 2000))
  }

  this.executeTasks = function () {
    if (!widgetUtils.widgetCheck(sign_page_widget, 2000)) {
      this.pushLog('未打开积分签到任务界面 重新打开')
      openSignPage()
      sleep(1000)
    }
    // 十五秒广告
    this.doBrowseTask()

    // 执行任务
    this.doTask(5)
    automator.back()
  }

  this.doExection = function () {
    FloatyInstance.setFloatyPosition(400, 400)
    FloatyInstance.setFloatyText('准备打开领取积分页面')
    this.openCreditPage()
    FloatyInstance.setFloatyText('准备领取积分')
    this.checkAndCollect()
    FloatyInstance.setFloatyText('准备执行每日任务')
    this.executeTasks()
  }

  this.exec = function () {
    this.doExection()
    FloatyInstance.setFloatyText('领取完毕')
    if (this.sign_success || commonFunctions.checkIsAliCreditsSigned()) {
      this.setExecuted()
    }
    commonFunctions.minimize(_package_name)
  }

  function openSignPage () {
    let url = 'alipays://platformapi/startapp?appId=20000067&url=https%3A%2F%2Frender.alipay.com%2Fp%2Fyuyan%2F180020380000000023%2Fpoint-sign-in.html%3FchInfo%3D&launchKey=3755a1a6-6b02-4508-8714-cd2d393b08e9-1704164626631'
    app.startActivity({
      action: 'android.intent.action.VIEW',
      data: url,
      packageName: 'com.eg.android.AlipayGphone'
    })
    let openResult = widgetUtils.widgetWaiting(sign_page_widget, null, 2000)
    _this.pushLog('打开结果：' + openResult)
    return openResult
  }

  function CountdownChecker (limit) {
    this.start = new Date().getTime()
    this.limit = limit

    this.getPassTime = function () {
      return Math.floor((new Date().getTime() - this.start) / 1000)
    }

    this.isOvertime = function () {
      return this.getPassTime() > this.limit
    }

    this.getRestTime = function () {
      return (this.limit - this.getPassTime()).toFixed(0)
    }
  }

}

CreditRunner.prototype = Object.create(BaseSignRunner.prototype)
CreditRunner.prototype.constructor = CreditRunner

module.exports = new CreditRunner()
