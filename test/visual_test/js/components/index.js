/*
 * @Author: TonyJiangWJ
 * @Date: 2020-12-25 10:12:37
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-12-26 11:15:11
 * @Description: 
 */
let Index = {
  mixins: [mixin_methods],
  data: function () {
    return {}
  },
  template: '<div>\
    <tip-block>可视化辅助工具</tip-block>\
    <van-row type="flex" justify="center" style="margin: 0.5rem 0;">\
      <router-link to="/common_image_test"><van-button plain hairline type="primary" size="mini">通用图片测试工具</van-button></router-link>\
    </van-row>\
  </div>'
}