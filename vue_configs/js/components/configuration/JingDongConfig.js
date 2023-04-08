
const JingDongConfig = {
  name: 'JingDongConfig',
  mixins: [mixin_common],
  data () {
    return {
      configs: {
        home_entry: '领京豆',
        mine: '我的',
        mine_entry: '京豆',
        sign_button: '.*(签到领|已签到|已连签|明天签到).*',
        already_signed: '(已签到|已连签|明天签到).*',
        // 种豆得豆入口
        plant_bean_enter_x: 1000,
        plant_bean_enter_y: 1300,
      },
      signName: '京豆签到',
    }
  },
  methods: {
    onConfigLoad (config) {
      let jingDongConfig = config.jingdong_config
      Object.keys(this.configs).forEach(key => {
        this.$set(this.configs, key, jingDongConfig[key])
      })
    },
    doSaveConfigs () {
      let newConfigs = this.filterErrorFields(this.configs)
      $app.invoke('saveExtendConfigs', { configs: newConfigs, prepend: 'jingdong' })
    },
  },
  mounted() {
    
  },
  template: `
  <div>
    <van-divider content-position="left">\
      京东京豆签到控件配置\
    </van-divider>\
    <van-field v-model="configs.home_entry" label="APP首页领京豆入口" label-width="10em" type="text" placeholder="请输入京豆入口文本" input-align="right" />
    <van-field v-model="configs.mine" label="‘我的’按钮" label-width="10em" type="text" placeholder="请输入‘我的’文本" input-align="right" />
    <van-field v-model="configs.mine_entry" label="‘我的’界面‘京豆’按钮" label-width="10em" type="text" placeholder="请输入‘我的’界面‘京豆’按钮文本" input-align="right" />
    <van-field v-model="configs.sign_button" label="签到界面领京豆按钮文本" label-width="12em" type="text" placeholder="请输入签到界面领京豆按钮文本" input-align="right" />
    <van-field v-model="configs.already_signed" label="校验已签到的正则" label-width="12em" type="text" placeholder="请输入校验用正则" input-align="right" />
    <number-field v-model="configs.plant_bean_enter_x" label="种豆得豆入口X" label-width="12em" placeholder="请输入入口横坐标位置" />
    <number-field v-model="configs.plant_bean_enter_y" label="种豆得豆入口X" label-width="12em" placeholder="请输入入口纵坐标位置" />
  </div>`
}
