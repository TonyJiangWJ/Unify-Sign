
const DingDongConfig = {
  name: 'DingDongConfig',
  mixins: [mixin_common],
  data () {
    return {
      configs: {
        mine_base64: '',
        fishpond_entry: '',
        fishpond_check: '',
        fishpond_can_collect: '',
        fishpond_daily_collect: '',
        fishpond_normal_collect: '',
        fishpond_continuous_sign: '',
        fishpond_do_continuous_sign: '',
        fishpond_close_continuous_sign: '',
        fishpond_close: '',
        orchard_entry: '',
        orchard_can_collect: '',
        orchard_daily_collect: '',
        orchard_normal_collect: '',
        orchard_check: '',
        sign_and_get_points: '',
      },
      signName: '叮咚签到',
    }
  },
  methods: {
    onConfigLoad (config) {
      let dingDongConfig = config.dingdong_config
      Object.keys(this.configs).forEach(key => {
        this.$set(this.configs, key, dingDongConfig[key])
      })
    },
    doSaveConfigs () {
      let newConfigs = this.filterErrorFields(this.configs)
      $app.invoke('saveExtendConfigs', { configs: newConfigs, prepend: 'dingdong' })
    },
    openGrayDetector: function () {
      $app.invoke('openGrayDetector', {})
    },
  },
  mounted() {
    
  },
  template: `
  <div>
    <van-divider content-position="left">\
      签到识图配置\
    </van-divider>\
    <tip-block style="margin: 0.5rem">区域输入框左滑可以通过滑块输入数值，也可以通过取色工具获取目标区域信息：<van-button style="margin-left: 0.4rem" plain hairline type="primary" size="mini" @click="openGrayDetector">打开取色工具</van-button></tip-block>
    <base64-image-viewer title="校验‘我的’按钮" v-model="configs.mine_base64"/>
    <base64-image-viewer title="校验鱼塘入口" v-model="configs.fishpond_entry"/>
    <base64-image-viewer title="校验是否进入鱼塘" v-model="configs.fishpond_check"/>
    <base64-image-viewer title="校验连续签到" v-model="configs.fishpond_continuous_sign"/>
    <base64-image-viewer title="校验执行连续签到" v-model="configs.fishpond_do_continuous_sign"/>
    <base64-image-viewer title="校验关闭连续签到" v-model="configs.fishpond_close_continuous_sign"/>
    <base64-image-viewer title="校验是否有可领取" v-model="configs.fishpond_can_collect"/>
    <base64-image-viewer title="校验今日领取按钮" v-model="configs.fishpond_daily_collect"/>
    <base64-image-viewer title="校验普通领取按钮" v-model="configs.fishpond_normal_collect"/>
    <base64-image-viewer title="校验鱼塘关闭按钮" v-model="configs.fishpond_close"/>
    <base64-image-viewer title="校验叮咚果园入口" v-model="configs.orchard_entry"/>
    <base64-image-viewer title="校验是否进入了农场" v-model="configs.orchard_check"/>
    <base64-image-viewer title="校验是否有可领取" v-model="configs.orchard_can_collect"/>
    <base64-image-viewer title="校验今日领取按钮" v-model="configs.orchard_daily_collect"/>
    <base64-image-viewer title="校验普通领取按钮" v-model="configs.orchard_normal_collect"/>
    <base64-image-viewer title="积分领取按钮" v-model="configs.sign_and_get_points"/>
  </div>`
}
