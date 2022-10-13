
module.exports = function (binder) {
  // 扩展配置
  /**
   * param1: 指定自定义配置的前缀 需要保持唯一
   * param2: 指定自定义配置的初始化值 仅仅保存图片信息时传递空对象即可
   * param3: 指定自定义图像配置的字段列表
   */
  binder.bindCustomSignConfig('bb_farm', {}, [
    'collect_btn_alipay', 'entry_check_alipay', 'task_btn_alipay',
    'collect_btn_taobao', 'entry_check_taobao', 'task_btn_taobao'
  ])
}
