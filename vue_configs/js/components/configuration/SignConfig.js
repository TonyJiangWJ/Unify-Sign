/**
 * 签到配置
 */
const SignConfig = {
  name: 'SignConfig',
  mixins: [mixin_common],
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
      this.checked = this.configs.supported_signs.filter(v => v.enabled).map(v => v.name)
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
    }
  },
  watch: {
    checked: function (v) {
      console.log('before change', JSON.stringify(v))
      this.configs.supported_signs.forEach(s => s.enabled = false)
      if (v && v.length > 0) {
        this.configs.supported_signs.filter(s => v.indexOf(s.name) > -1).forEach(s => s.enabled = true)
      }
      console.log(JSON.stringify(this.checked))
    }
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
        <van-swipe-cell v-for="(supportedSign,index) in configs.supported_signs" :key="supportedSign.name" stop-propagation>
          <template #left>
            <div style="display:flex;height: 100%;">
              <van-button square type="primary" text="设置执行时间" @click="toScheduleConfig(supportedSign.taskCode)"/>
            </div>
          </template>
          <van-cell clickable :title="supportedSign.name" @click="toggle(index)" >
            <template #right-icon>
              <van-checkbox :name="supportedSign.name" ref="checkboxes" />
            </template>
          </van-cell>
          <template #right>
            <div style="display:flex;height: 100%;">
              <van-button square type="primary" text="更多设置" @click="doSetting(supportedSign.taskCode)" v-if="hasSetting(supportedSign.taskCode)" style="height: 100%"/>
            </div>
          </template>
        </van-swipe-cell>
      </van-cell-group>
    </van-checkbox-group>
  </div>`
}
