/*
 * @Author: TonyJiangWJ
 * @Date: 2020-09-22 21:42:38
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-09-22 21:44:54
 * @Description: 
 */
new java.lang.Thread(new java.lang.Runnable({
  run: function () {
    // 一小时后停止
    let targetStop = new Date().getTime() + 3600000
    while (new Date().getTime() < targetStop) {
      try {
        console.verbose('我是不死的小强')
        sleep(1000)
      } catch (e) {
        console.error('线程执行异常' + e)
      }
    }
  }
})).start()