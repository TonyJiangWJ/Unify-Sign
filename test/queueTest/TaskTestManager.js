let singletonRequire = require('../../lib/SingletonRequirer.js')(runtime, this)
let runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let { clearLogFile } = singletonRequire('LogUtils')

clearLogFile('verbose')
let pwd = files.cwd()
runningQueueDispatcher.showDispatchStatus()
// runningQueueDispatcher.clearAll()
let task1 = pwd + '/Task1.js'
let task2 = pwd + '/Task2.js'
let task3 = pwd + '/Task3.js'

let count = 10
while (count-- > 0) {
  runningQueueDispatcher.executeTargetScript(task1)
  runningQueueDispatcher.executeTargetScript(task2)
  runningQueueDispatcher.executeTargetScript(task3)
}
sleep(1000)
runningQueueDispatcher.showDispatchStatus()
