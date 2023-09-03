const SubTaskComponent = {
  name: 'SubTaskComponent',
  data() {
    return {
      subTaskChecked: []
    }
  },
  props: {
    subTasks: Array,
  },
  watch: {
    subTaskChecked: {
      deep:true,
      immediate: false,
      handler: function (v) {
        this.subTasks.forEach(s => s.enabled = false)
        if (v && v.length > 0) {
          this.subTasks.filter(s => v.indexOf(s.taskCode) > -1).forEach(s => s.enabled = true)
        }
        console.log('sub task changed to:', JSON.stringify(this.subTasks))
      }
    },
    subTasks: {
      deep: true,
      immediate: true,
      handler: function (v) {
        let newSubTaskChecked = this.subTasks.filter(v => v.enabled).map(v => v.taskCode)
        if (JSON.stringify(newSubTaskChecked) != JSON.stringify(this.subTaskChecked)) {
          console.log('触发更新', JSON.stringify(newSubTaskChecked), JSON.stringify(this.subTaskChecked))
          this.subTaskChecked = newSubTaskChecked
        }
      }
    }
  },
  methods: {
    toggleSubTask (index) {
      console.log('变更子任务索引：', index)
      this.$refs.subTaskCheckboxes[index].toggle()
    },
  },
  mounted() {
    this.subTaskChecked = this.subTasks.filter(v => v.enabled).map(v => v.taskCode)
  },
  template: `
  <van-checkbox-group v-model="subTaskChecked">
    <van-cell-group style="padding-left: 0.45rem; font-size: 10px;">
      <van-cell v-for="(subTask,index) in subTasks" :key="subTask.taskCode" :title="subTask.taskName" clickable @click="toggleSubTask(index)" stop-propagation>
        <template #icon>
          <van-checkbox :name="subTask.taskCode" ref="subTaskCheckboxes" style="margin-right: 1rem" />
        </template>
      </van-cell>
    </van-cell-group>
  </van-checkbox-group>
  `
}

/**
 * 签到配置
 */
const SignConfig = {
  name: 'SignConfig',
  mixins: [mixin_common],
  components: { SubTaskComponent },
  data () {
    return {
      checked: [],
      configs: {
        supported_signs: [
          {
            name: '蚂蚁积分签到',
            taskCode: 'AntCredits',
            script: 'AntCredits.js',
            enabled: true
          },
          {
            name: '全家签到',
            taskCode: 'Fami',
            script: 'Fami.js',
            enabled: true
          },
          {
            name: '京东签到',
            taskCode: 'JingDong',
            script: 'JingDongBeans.js',
            enabled: true,
            subTasks: [
              {
                taskCode: 'plantBean',
                taskName: '种豆得豆',
                enabled: true,
              }
            ]
          },
          {
            name: '米游社-原神签到',
            taskCode: 'MiHoYo',
            script: 'MiHoYou.js',
            enabled: true
          },
          {
            name: '淘金币签到',
            taskCode: 'Taobao',
            script: 'Taobao-Coin.js',
            enabled: true
          },
          {
            name: '叮咚签到',
            taskCode: 'DingDong',
            script: 'DingDong.js',
            enabled: true,
            subTasks: [
              {
                taskCode: 'creditSign',
                taskName: '积分签到',
                enabled: true,
              },
              {
                taskCode: 'fishpond',
                taskName: '鱼塘签到',
                enabled: true,
              },
              {
                taskCode: 'orchard',
                taskName: '叮咚果园',
                enabled: true,
              }
            ]
          },
          {
            name: '微博积分签到',
            taskCode: 'Weibo',
            script: 'Weibo.js',
            enabled: true
          },
          {
            name: '支付宝商家积分签到',
            taskCode: 'AlipayMerchant',
            script: 'AlipayMerchantCredits.js',
            enabled: true
          }
        ]
      },
      settingPage: {
        'DingDong': '/basic/sign/dingdong',
        'Weibo': '/basic/sign/weibo',
        'BBFarm': '/basic/sign/bbFarm',
        'MiHoYo': '/basic/sign/mihoyo',
        'JingDong': '/basic/sign/jingdong',
      }
    }
  },
  methods: {
    onConfigLoad: function (config) {
      console.log('加载完毕：current supported signs:', JSON.stringify(this.configs.supported_signs))
      this.checked = this.configs.supported_signs.filter(v => v.enabled).map(v => v.taskCode)
      console.log('checked:', JSON.stringify(this.checked))
    },
    toggle (index) {
      console.log('变更索引：', index)
      this.$refs.checkboxes[index].toggle()
    },
    doSetting (taskCode) {
      this.$router.push(this.settingPage[taskCode])
    },
    hasSetting (taskCode) {
      return !!this.settingPage[taskCode]
    },
    toScheduleList: function () {
      this.$router.push('/basic/sign/scheduleList')
    },
    toScheduleConfig: function (taskCode) {
      this.$router.push({ path: '/basic/sign/schedule', query: { taskCode: taskCode }})
    },
    manageGroup: function () {
      this.$router.push('/basic/sign/groupList')
    },
    executeTask: function (taskInfo) {
      $app.invoke('executeTask', { taskInfo: taskInfo })
    }
  },
  watch: {
    checked: function (v) {
      console.log('before change', JSON.stringify(v))
      this.configs.supported_signs.forEach(s => s.enabled = false)
      if (v && v.length > 0) {
        this.configs.supported_signs.filter(s => v.indexOf(s.taskCode) > -1).forEach(s => s.enabled = true)
      }
      console.log(JSON.stringify(this.checked))
    }
  },
  mounted() {
    this.checked = this.configs.supported_signs.filter(v => v.enabled).map(v => v.taskCode)
  },
  beforeDestroy() {
    console.log('组件销毁，当前配置信息：', JSON.stringify(this.configs))
  },
  template: `<div>
    <van-divider content-position="left">
      设置启用的签到
    </van-divider>
    <tip-block style="margin-bottom: 1rem;">
      <span>左右滑动可以进行设置</span>
      <van-button plain hairline type="primary" size="mini" style="margin: 0 0.3rem;"  @click="toScheduleList">查看执行计划</van-button>
      <van-button plain hairline type="warning" size="mini" style="margin: 0 0.3rem;"  @click="manageGroup">管理执行分组</van-button>
    </tip-block>
    <van-checkbox-group v-model="checked">
      <van-cell-group>
        <template v-for="(supportedSign,index) in configs.supported_signs" :key="supportedSign.taskCode">
        <van-swipe-cell stop-propagation>
          <template #left>
            <div style="display:flex;height: 100%;">
              <van-button square type="primary" text="设置执行时间" @click="toScheduleConfig(supportedSign.taskCode)"/>
            </div>
          </template>
          <van-cell clickable :title="supportedSign.name" @click="toggle(index)" >
            <template #right-icon>
              <van-checkbox :name="supportedSign.taskCode" ref="checkboxes" v-show="!supportedSign.subTasks || supportedSign.subTasks.length == 0" />
            </template>
          </van-cell>
          <template #right>
            <div style="display:flex;height: 100%;">
              <van-button square type="primary" text="更多设置" @click="doSetting(supportedSign.taskCode)" v-if="hasSetting(supportedSign.taskCode)" style="height: 100%"/>
              <van-button square type="warning" text="单次执行" @click="executeTask(supportedSign)" style="height: 100%"/>
            </div>
          </template>
        </van-swipe-cell>
        <template v-if="supportedSign.subTasks && supportedSign.subTasks.length > 0">
          <sub-task-component :sub-tasks="supportedSign.subTasks" />
        </template>
        </template>
      </van-cell-group>
    </van-checkbox-group>
  </div>`
}
