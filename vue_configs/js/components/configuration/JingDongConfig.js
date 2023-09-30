
const JingDongConfig = {
  name: 'JingDongConfig',
  mixins: [mixin_common],
  data () {
    return {
      configs: {
        // 签到领豆按钮
        sign_posi_x: 600,
        sign_posi_y: 625,
        // 双签按钮
        double_sign_posi_x: 1230,
        double_sign_posi_y: 620,
        // 种豆得豆入口
        plant_bean_enter_x: 1230,
        plant_bean_enter_y: 440,
        plant_min_gaps: 120
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
    <van-divider content-position="left">
      京东京豆签到控件配置
    </van-divider>
    <tip-block>签到领豆使用OCR识别，请开启PaddleOCR，mlkit不稳定，找不到后使用配置的坐标位置</tip-block>
    <number-field v-model="configs.sign_posi_x" label="签到领豆x坐标" label-width="12em" placeholder="请输入入口横坐标位置" />
    <number-field v-model="configs.sign_posi_y" label="签到领豆y坐标" label-width="12em" placeholder="请输入入口纵坐标位置" />
    <tip-block>种豆和双签入口默认使用控件查找，找不到后使用配置的坐标位置</tip-block>
    <number-field v-model="configs.double_sign_posi_x" label="双签领豆x坐标" label-width="12em" placeholder="请输入入口横坐标位置" />
    <number-field v-model="configs.double_sign_posi_y" label="双签领豆y坐标" label-width="12em" placeholder="请输入入口纵坐标位置" />
    <number-field v-model="configs.plant_bean_enter_x" label="种豆得豆入口X" label-width="12em" placeholder="请输入入口横坐标位置" />
    <number-field v-model="configs.plant_bean_enter_y" label="种豆得豆入口X" label-width="12em" placeholder="请输入入口纵坐标位置" />
    <tip-block>计算种豆得豆倒计时，超过此时间后设置最小间隔时间的倒计时避免被别人收走</tip-block>
    <number-field v-model="configs.plant_min_gaps" label="种豆得豆最小检查间隔" label-width="12em" placeholder="请输入最小间隔" >
      <template #right-icon><span>分</span></template>
    </number-field>
  </div>`
}
