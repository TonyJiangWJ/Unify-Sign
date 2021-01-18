let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)
let commonFunctions = singletonRequire('CommonFunction')
let widgetUtils = singletonRequire('WidgetUtils')
let automator = singletonRequire('Automator')
let FloatyInstance = singletonRequire('FloatyUtil')

let BaseSignRunner = require('./BaseSignRunner.js')
function SignRunner () {
  BaseSignRunner.call(this)
  const _package_name = 'com.taobao.taobao'

  this.exec = function () {
    launch(_package_name)
    sleep(1000)
    
    commonFunctions.minimize(_package_name)
  }
}

SignRunner.prototype = Object.create(BaseSignRunner.prototype) 
SignRunner.prototype.constructor = SignRunner

module.exports = new SignRunner()