
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
        subTasks: {
          CREDIT_SIGN: '积分签到',
          FISHPOND: '鱼塘签到',
          ORCHARD: '叮咚果园'
        }
      },
      subTasks: [],
      signName: '叮咚签到',
    }
  },
  methods: {
    generateSubTasks: function () {
      return Object.keys(this.configs.subTasks).map(key => {
        let name = this.configs.subTasks[key]
        return {
          name: name,
          executedInfo: ''
        }
      })
    },
    onConfigLoad (config) {
      let dingDongConfig = config.dingdong_config
      Object.keys(this.configs).forEach(key => {
        this.$set(this.configs, key, dingDongConfig[key])
      })
      this.subTasks = this.generateSubTasks()
      console.log('子任务数据：', JSON.stringify(this.subTasks))
      this.subTasks.forEach((subTask, idx) => this.checkExecutedInfo(subTask, idx))
    },
    doSaveConfigs () {
      let newConfigs = this.filterErrorFields(this.configs)
      $app.invoke('saveExtendConfigs', { configs: newConfigs, prepend: 'dingdong' })
    },
    openGrayDetector: function () {
      $app.invoke('openGrayDetector', {})
    },
    toggleExecuted: function (name) {
      let self = this
      let idx = this.subTasks.map(task => task.name).indexOf(name)
      if (idx > -1) {
        let task = this.subTasks[idx]
        let targetExecutedStatus = false
        if (!task.executedInfo || task.executedInfo === '未执行') {
          targetExecutedStatus = true
        }
        this.$dialog.confirm({
          message: `确定要将${name}标记为${targetExecutedStatus ? '已执行' : '未执行'}吗？`
        }).then(() => {
          let resolver = resp => {
            task.executedInfo = resp.success ? '今日已执行 ' + resp.executedTime : '未执行'
            self.$set(self.subTasks, idx, task)
          }
          if (targetExecutedStatus) {
            task.executedInfo = '今日已执行'
            $nativeApi.request('setExecuted', { name: self.signName + ':' + name }).then(resolver)
          } else {
            task.executedInfo = '未执行'
            $nativeApi.request('markNotExecuted', { name: self.signName + ':' + name }).then(resolver)
          }
        })
      }
    },
    checkExecutedInfo: function (subTask, idx) {
      let self = this
      $nativeApi.request('checkExecuted', { name: this.signName + ':' + subTask.name }).then(resp => {
        let executedInfo = resp.success ? '今日已执行 ' + resp.executedTime : '未执行'
        console.log(subTask.name + ' 执行状态：' + executedInfo)
        subTask.executedInfo = executedInfo
        self.$set(self.subTasks, idx, subTask)
      })
    },
  },
  mounted() {
    this.subTasks = this.generateSubTasks()
    console.log('子任务数据：', JSON.stringify(this.subTasks))
  },
  template: `
  <div>
    <van-divider content-position="left">\
      子任务管理\
    </van-divider>\
    <van-cell-group>
      <van-checkbox-group>\
        <van-cell-group>\
          <van-swipe-cell v-for="(subTask,index) in subTasks" :key="subTask.name" stop-propagation>\
            <van-cell :title="subTask.name" :label="subTask.executedInfo">\
            </van-cell>\
            <template #right>\
              <div style="display:flex;height: 100%;">
                <van-button square type="danger" text="切换执行状态" @click="toggleExecuted(subTask.name)" style="height: 100%"/>\
              </div>
            </template>\
          </van-swipe-cell>\
        </van-cell-group>\
      </van-checkbox-group>\
    </van-cell-group>
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
  </div>`
}
