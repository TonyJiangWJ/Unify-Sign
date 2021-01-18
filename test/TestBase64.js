/*
 * @Author: TonyJiangWJ
 * @Date: 2020-09-18 13:51:52
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-09-18 13:59:33
 * @Description: 
 */
require('../modules/init_if_needed.js')(runtime, this)
let originString = '原始字符串, original string'
let encodeString = $base64.encode(originString)
log('原始字符串：' + originString)
log('encode字符串：' + encodeString)
log('decode字符串：' + $base64.decode(encodeString))