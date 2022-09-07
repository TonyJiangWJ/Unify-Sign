
const WeiboConfig = {
  name: 'WeiboConfig',
  mixins: [mixin_common],
  data () {
    return {
      configs: {
        mine_btn: '',
        mine_checked_btn: '',
        sign_btn: '',
        signed_icon: '',
      },
    }
  },
  methods: {
    onConfigLoad (config) {
      let weiboConfig = config.weibo_config
      Object.keys(this.configs).forEach(key => {
        this.$set(this.configs, key, weiboConfig[key])
      })
    },
    doSaveConfigs () {
      let newConfigs = this.filterErrorFields(this.configs)
      $app.invoke('saveExtendConfigs', { configs: newConfigs, prepend: 'weibo' })
    },
    openGrayDetector: function () {
      $app.invoke('openGrayDetector', {})
    },
  },
  template: `
  <div>
    <van-divider content-position="left">\
      签到识图配置\
    </van-divider>\
    <tip-block style="margin: 0.5rem">区域输入框左滑可以通过滑块输入数值，也可以通过取色工具获取目标区域信息：<van-button style="margin-left: 0.4rem" plain hairline type="primary" size="mini" @click="openGrayDetector">打开取色工具</van-button></tip-block>
    <base64-image-viewer title="校验‘我’按钮" v-model="configs.mine_btn"/>
    <base64-image-viewer title="校验已选中的‘我’按钮" v-model="configs.mine_checked_btn"/>
    <base64-image-viewer title="校验签到按钮" v-model="configs.sign_btn"/>
    <base64-image-viewer title="校验已完成签到图标" v-model="configs.signed_icon"/>
  </div>`
}
