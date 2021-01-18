/*
 * @Author: TonyJiangWJ
 * @Date: 2020-09-18 13:51:52
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-09-21 10:05:43
 * @Description: 
 */
require('../modules/init_if_needed.js')(runtime, this)
let originString = '原始字符串, original string'
let aesKey = new $crypto.Key('_aeskey__aeskey_')
// 计算字符串abc的md5
log('md5: ' + $crypto.digest(originString, "MD5"))
// 计算字符串abc的sha-256
log('SHA256: ' + $crypto.digest(originString, "SHA-256"))

let encryptStr = $crypto.encrypt(originString, aesKey, 'AES', { output: 'hex' })
log('原始字符串：' + originString)
log('encrypt字符串：' + encryptStr)
log('decrypt字符串：' + $crypto.decrypt(encryptStr, aesKey, 'AES', { input: 'hex', output: 'string' }))
