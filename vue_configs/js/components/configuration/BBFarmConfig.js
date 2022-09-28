
const BBFarmConfig = {
  name: 'BBFarmConfig',
  mixins: [mixin_common],
  data () {
    return {
      configs: {
        entry_check_alipay: '',
        collect_btn_alipay: '',
        task_btn_alipay: '',
        entry_check_taobao: '',
        collect_btn_taobao: '',
        task_btn_taobao: '',
      },
    }
  },
  methods: {
    onConfigLoad (config) {
      let bbFarmConfig = config.bb_farm_config
      Object.keys(this.configs).forEach(key => {
        this.$set(this.configs, key, bbFarmConfig[key])
      })
    },
    doSaveConfigs () {
      let newConfigs = this.filterErrorFields(this.configs)
      $app.invoke('saveExtendConfigs', { configs: newConfigs, prepend: 'bb_farm' })
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
    <van-divider content-position="left">\
      支付宝芭芭农场\
    </van-divider>\
    <base64-image-viewer title="校验是否加载完毕" v-model="configs.entry_check_alipay"/>
    <base64-image-viewer title="校验‘领取’按钮" v-model="configs.collect_btn_alipay"/>
    <base64-image-viewer title="校验任务按钮" v-model="configs.task_btn_alipay"/>
    <van-divider content-position="left">\
      淘宝芭芭农场\
    </van-divider>\
    <base64-image-viewer title="校验是否加载完毕" v-model="configs.entry_check_taobao"/>
    <base64-image-viewer title="校验‘领取’按钮" v-model="configs.collect_btn_taobao"/>
    <base64-image-viewer title="校验任务按钮" v-model="configs.task_btn_taobao"/>
  </div>`
}
