const TaskConfigEditor = {
  mixins: [mixin_methods],
  name: 'TaskConfigEditor',
  props: {
    scheduleConfig: {
      type: Object,
      default: () => {
        return {
          id: '',
          taskCode: '',
          executeType: '',
          start: 0,
          end: 0,
        }
      }
    },
    groups: Array,
  },
  data () {
    return {
      executeTypeOptions: [
        { value: '1', text: '指定时间' },
        { value: '2', text: '随机时间段' },
        { value: '3', text: '按分组执行' },
      ],
      showTimePicker: false,
      currentTime: null,
      editStart: true,
    }
  },
  methods: {
    executeTypeChanged: function () {
      this.$emit('config-changed', this.scheduleConfig)
    },
    handleChangeTime: function () {
      this.showTimePicker = false
    },
    changeStart: function () {
      this.editStart = true
      this.currentTime = this.startTime
      this.showTimePicker = true
      // this.$emit('config-changed', this.scheduleConfig)
    },
    changeEnd: function () {
      this.editStart = false
      this.currentTime = this.endTime
      this.showTimePicker = true
      // this.$emit('config-changed', this.scheduleConfig)
    },
    groupChanged: function () {
      this.scheduleConfig.groupName = this.groupMap[this.scheduleConfig.groupCode].groupName
      this.$emit('config-changed', this.scheduleConfig)
    }
  },
  computed: {
    startTime: function () {
      return millisToDisplay(this.scheduleConfig.start)
    },
    endTime: function () {
      return millisToDisplay(this.scheduleConfig.end)
    },
    groupOptions: function () {
      if (this.groups && this.groups.length > 0) {
        return this.groups.map(group => ({
          value: group.groupCode,
          text: group.groupName,
        }))
      }
      return []
    },
    groupMap: function () {
      if (this.groups && this.groups.length > 0) {
        return this.groups.reduce((o, group) => {
          o[group.groupCode] = group
          return o
        }, {})
      }
      return {}
    }
  },
  watch: {
    showTimePicker: function (n) {
      if (!n) {
        console.log('currentTime: ', this.currentTime)
        if (this.editStart) {
          this.scheduleConfig.start = new Date('2022-01-01 ' + this.currentTime) - new Date('2022-01-01 00:00:00')
        } else {
          this.scheduleConfig.end = new Date('2022-01-01 ' + this.currentTime) - new Date('2022-01-01 00:00:00')
        }
        if (this.scheduleConfig.start && this.scheduleConfig.end) {
          this.$emit('config-changed', this.scheduleConfig)
        }
      }
    }
  }
  ,
  template: `
  <div>
    <van-cell-group>
      <van-cell title="定时执行方式">
        <template #right-icon>
          <van-dropdown-menu active-color="#1989fa" class="cell-dropdown">
            <van-dropdown-item v-model="scheduleConfig.executeType" :options="executeTypeOptions" @change="executeTypeChanged"/>
          </van-dropdown-menu>
        </template>
      </van-cell>
      <template v-if="scheduleConfig.executeType === '1'">
        <van-field :readonly="true" :value="startTime" label="执行时间" label-width="10em" type="text" input-align="right" @click="changeStart" />
      </template>
      <template v-else-if="scheduleConfig.executeType === '2'">
        <van-field :readonly="true" :value="startTime" label="随机起始时间" label-width="10em" type="text" input-align="right" @click="changeStart" />
        <van-field :readonly="true" :value="endTime" label="随机结束时间" label-width="10em" type="text" input-align="right" @click="changeEnd" />
      </template>
      <template v-else>
        <van-cell title="选择分组" :label="scheduleConfig.groupName">
          <template #right-icon>
            <van-dropdown-menu active-color="#1989fa" class="cell-dropdown">
              <van-dropdown-item v-model="scheduleConfig.groupCode" :options="groupOptions" @change="groupChanged"/>
            </van-dropdown-menu>
          </template>
        </van-cell>
      </template>
    </van-cell-group>
    <van-popup v-model="showTimePicker" position="bottom" :get-container="getContainer">
      <van-datetime-picker
        v-model="currentTime"
        type="time"
        title="选择时间"
        @confirm="handleChangeTime"
        @cancel="showTimePicker=false"
      />
    </van-popup>
  </div>
  `
}

const TaskScheduleConfig = (() => {
  return {
    name: 'TaskScheduleConfig',
    mixins: [mixin_methods],
    components: { TaskConfigEditor },
    props: {
      taskCode: String,
    },
    data () {
      return {
        taskInfo: {
          taskName: '测试任务'
        },
        scheduleConfig: {},
        showEditor: false,
        groups: [],
        scheduleConfigs: []
      }
    },
    filters: {
      displayLabel: function (schedule) {
        if (schedule.executeType === '1') {
          return '每天固定时间：' + millisToDisplay(schedule.start)
        } else if (schedule.executeType === '2') {
          return '每天随机范围：' + millisToDisplay(schedule.start) + ' 到 ' + millisToDisplay(schedule.end)
        } else {
          return `按分组[${schedule.groupName}]执行`
        }
      },
      displayType: function (type) {
        if (type === '1') {
          return '指定时间'
        } else if (type === '2') {
          return '随机时间'
        } else {
          return '按分组执行'
        }
      }
    },
    methods: {
      listScheduleConfigs: function () {
        if (!this.taskCode) {
          return
        }
        console.log('准备加载配置')
        $nativeApi.request('queryScheduleConfig', { taskCode: this.taskCode }).then(resp => {
          console.log('加载配置完成：', JSON.stringify(resp))
          this.scheduleConfigs = resp
        })
        if ($app.mock) {
          this.scheduleConfigs = [{
            id: 8,
            taskCode: "DingDong:fishpond",
            executeType: "2",
            start: 28800000,
            end: 31500000,
            sort: 1,
            createTime: "2022-05-28 18:04:09",
            modifyTime: "2022-05-28 18:04:09"
          },
          {
            id: 11,
            taskCode: "DingDong:fishpond",
            executeType: "2",
            start: 37800000,
            end: 41400000,
            sort: 2,
            createTime: "2022-05-28 18:04:09",
            modifyTime: "2022-05-28 18:04:09"
          },
          {
            id: 13,
            taskCode: "DingDong:fishpond",
            executeType: "3",
            start: 59400000,
            end: 63000000,
            sort: 3,
            createTime: "2022-05-28 18:04:09",
            modifyTime: "2022-05-28 18:04:09",
            groupName: '默认分组',
            groupCode: 'DEFAULT'
          }]
        }
      },
      editSchedule: function (schedule) {
        this.showEditor = true
        this.scheduleConfig = schedule
      },
      addNew: function () {
        $nativeApi.request('insertScheduleConfig', {
          taskCode: this.taskCode,
          executeType: "1",
          sort: 1,
          start: 28800000,
          end: null,
        }).then(resp => {
          this.listScheduleConfigs()
        })
        if ($app.mock) {
          let newSchedule = Object.assign({}, {
            taskCode: this.taskCode,
            executeType: "1",
            start: 28800000,
            end: null,
            id: new Date().getTime()
          })
          this.scheduleConfigs.push(newSchedule)
        }
      },
      duplicateSchedule: function (schedule) {
        $nativeApi.request('insertScheduleConfig', schedule).then(resp => {
          this.listScheduleConfigs()
        })
        if ($app.mock) {
          let newSchedule = Object.assign({}, schedule)
          newSchedule.id = new Date().getTime()
          this.scheduleConfigs.push(newSchedule)
        }
      },
      deleteSchedule: function (schedule) {
        vant.Dialog.confirm({
          title: '删除确认',
          message: `确认要删除该配置吗?`,
        })
          .then(() => {
            $nativeApi.request('deleteScheduleConfig', schedule).then(resp => {
              this.listScheduleConfigs()
            })
            if ($app.mock) {
              let deleteIdx = -1
              for (let i = 0; i < this.scheduleConfigs.length; i++) {
                if (this.scheduleConfigs[i].id == schedule.id) {
                  deleteIdx = i
                  break
                }
              }
              if (deleteIdx > -1) {
                console.log('find index:', deleteIdx)
                this.scheduleConfigs.splice(deleteIdx, 1)
              }
            }
          })
      },
      loadTaskInfo: function () {
        if (!this.taskCode) {
          return
        }
        $nativeApi.request('loadTaskInfo', { taskCode: this.taskCode }).then(resp => {
          this.taskInfo = resp
        })
      },
      handleConfigChanged: function (newConfig) {
        console.log('配置变更：', JSON.stringify(newConfig))
        $nativeApi.request('updateScheduleConfig', newConfig).then(resp => {
          this.listScheduleConfigs()
        })
      },
      listGroup: function () {
        $nativeApi.request('listGroupConfig', { taskCode: this.taskCode }).then(resp => {
          console.log('groups', JSON.stringify(resp))
          this.groups = resp
        })
        if ($app.mock) {
          this.groups = [{
            id: 1,
            groupCode: "DEFAULT",
            groupName: "默认分组",
            executeType: "2",
            start: 28800000,
            end: 64800000,
          },
          {
            id: 2,
            groupCode: "DingDong1",
            groupName: "叮咚分组1",
            executeType: "2",
            start: 28800000,
            end: 31500000,
          },
          {
            id: 3,
            groupCode: "DingDong2",
            groupName: "叮咚分组2",
            executeType: "2",
            start: 37800000,
            end: 41400000,
          },
          {
            id: 4,
            groupCode: "DingDong3",
            groupName: "叮咚分组3",
            executeType: "2",
            start: 59400000,
            end: 63000000,
          }]
        }
      }
    },
    watch: {
      taskCode: function(newVal) {
        this.loadTaskInfo()
        this.listScheduleConfigs()
      }
    },
    mounted () {
      this.loadTaskInfo()
      this.listScheduleConfigs()
      this.listGroup()
    },
    template: `
    <div>
      <tip-block style="padding: 0.5rem 0;">任务名称：[{{taskCode}}]{{taskInfo.taskName}}<van-button plain hairline type="primary" size="mini" style="margin-left: 0.3rem;" @click="addNew">新增</van-button></tip-block>
      <van-cell-group>
        <van-swipe-cell v-for="(schedule,index) in scheduleConfigs" :key="schedule.taskCode + schedule.id" stop-propagation>
          <van-cell clickable 
            :title="schedule.executeType|displayType" :label="schedule|displayLabel">
          </van-cell>
          <template #right>
            <div style="display:flex;height: 100%;">
              <van-button square type="primary" text="修改" @click="editSchedule(schedule)" style="height: 100%"/>
              <van-button square type="warning" text="复制" @click="duplicateSchedule(schedule)" style="height: 100%"/>
              <van-button square type="danger" text="删除" @click="deleteSchedule(schedule)" style="height: 100%"/>
            </div>
          </template>
        </van-swipe-cell>
      </van-cell-group>
      <van-popup v-model="showEditor" position="bottom" :get-container="getContainer" :style="{ height: '75%' }" >
        <task-config-editor :schedule-config="scheduleConfig" @config-changed="handleConfigChanged" :groups="groups"/>
      </van-popup>
    </div>
    `
  }

})()

const SignTaskScheduleConfig = {
  components: { TaskScheduleConfig },
  data () {
    return {
      taskCode: '',
      subTasks: [],
    }
  },
  methods: {
    listSubTasks: function () {
      $nativeApi.request('listSubTasks', { taskCode: this.taskCode }).then(resp => {
        console.log('sub tasks', JSON.stringify(resp))
        this.subTasks = resp
      })
      if ($app.mock) {
        this.subTasks = [{ "id": 7, "taskName": "积分签到", "taskCode": "DingDong:creditSign", "taskSource": null, "parentTaskCode": "DingDong", "createTime": "2022-05-28T10:03:13.000Z", "modifyTime": "2022-05-28T10:03:13.000Z" }, { "id": 8, "taskName": "鱼塘签到", "taskCode": "DingDong:fishpond", "taskSource": null, "parentTaskCode": "DingDong", "createTime": "2022-05-28T10:03:13.000Z", "modifyTime": "2022-05-28T10:03:13.000Z" }, { "id": 9, "taskName": "叮咚果园", "taskCode": "DingDong:orchard", "taskSource": null, "parentTaskCode": "DingDong", "createTime": "2022-05-28T10:03:13.000Z", "modifyTime": "2022-05-28T10:03:13.000Z" }]
      }
    }
  },
  mounted () {
    this.taskCode = this.$route.query.taskCode
    this.listSubTasks()
  },
  template: `
  <div>
    <task-schedule-config :task-code="taskCode" v-if="!subTasks || subTasks.length == 0"/>
    <template v-else>
      <task-schedule-config v-for="subTask in subTasks" :task-code="subTask.taskCode" :key="subTask.taskCode"/>
    </template>
  </div>
  `
}

const GroupConfigEditor = {
  mixins: [mixin_methods],
  name: 'GroupConfigEditor',
  props: {
    showEditor: Boolean,
    groupConfig: {
      type: Object,
      default: () => {
        return {
          id: '',
          groupCode: '',
          groupName: '',
          executeType: '',
          start: 0,
          end: 0,
        }
      }
    }
  },
  model: {
    prop: 'showEditor',
    event: 'emit-show',
  },
  data () {
    return {
      originGroupCode: this.groupConfig.groupCode,
      asyncErrors: {},
      executeTypeOptions: [
        { value: '1', text: '指定时间' },
        { value: '2', text: '随机时间段' },
      ],
      validations: {
        groupCode: {
          required: true,
          validate: (v) => false,
          message: (v) => {
            let queryData = {
              id: this.groupConfig.id,
              groupCode: this.groupConfig.groupCode,
            }
            $nativeApi.request('checkGroupCodeExists', queryData)
              .then(({ exists }) => {
                if (exists + '' === 'true') {
                  this.$set(this.asyncErrors, 'groupCode', '分组编码不能重复')
                } else {
                  this.$set(this.asyncErrors, 'groupCode', '')
                }
              })
            if ($app.mock) {
              let _this = this
              setTimeout(function () {
                if (_this.groupConfig.groupCode === 'DEFAULT') {
                  _this.$set(_this.asyncErrors, 'groupCode', '分组编码不能重复')
                } else {
                  _this.$set(_this.asyncErrors, 'groupCode', '')
                }
              }, 1000)
            }
          }
        },
        groupName: {
          required: true,
          validate: (v) => !!v,
          message: () => '分组名称不能为空'
        },
      },
      showTimePicker: false,
      currentTime: null,
      editStart: true,
      innerShowEditor: this.showEditor,
    }
  },
  methods: {
    handleChangeTime: function () {
      this.showTimePicker = false
    },
    changeStart: function () {
      this.editStart = true
      this.currentTime = this.startTime
      this.showTimePicker = true
    },
    changeEnd: function () {
      this.editStart = false
      this.currentTime = this.endTime
      this.showTimePicker = true
    },
  },
  computed: {
    startTime: function () {
      return millisToDisplay(this.groupConfig.start)
    },
    endTime: function () {
      return millisToDisplay(this.groupConfig.end)
    },
    validationError: function () {
      let errors = {}
      if (this.isNotEmpty(this.validations)) {
        Object.keys(this.validations).forEach(key => {
          let { [key]: value } = this.groupConfig
          let { [key]: validation } = this.validations
          if (this.isNotEmpty(value) && !validation.validate(value)) {
            errors[key] = validation.message(value)
          } else if (!this.isNotEmpty(value) && validation.required) {
            errors[key] = '此项必填'
          } else {
            errors[key] = ''
          }
        })
      }
      return Object.assign(errors, this.asyncErrors)
    },
  },
  watch: {
    showTimePicker: function (n) {
      if (!n) {
        console.log('currentTime: ', this.currentTime)
        if (this.editStart) {
          this.groupConfig.start = new Date('2022-01-01 ' + this.currentTime) - new Date('2022-01-01 00:00:00')
        } else {
          this.groupConfig.end = new Date('2022-01-01 ' + this.currentTime) - new Date('2022-01-01 00:00:00')
        }
      }
    },
    showEditor: function (newVal) {
      this.innerShowEditor = newVal
      if (newVal) {
        this.originGroupCode = this.groupConfig.groupCode
      }
    },
    innerShowEditor: function (newVal) {
      if (!newVal) {
        this.$emit('config-changed', { groupConfig: this.groupConfig, validationError: Object.keys(this.validationError).map(key => this.validationError[key]).filter(error => !!error) })
      }
      this.$emit('emit-show', this.innerShowEditor)
    }
  },
  template: `
  <div>
    <van-popup v-model="innerShowEditor" position="bottom" :get-container="getContainer" :style="{ height: '75%' }" >
      <van-cell-group>
        <van-field v-model="groupConfig.groupName" placeholder="请输入分组名称" label="分组名称" input-align="right" :error-message="validationError.groupName" error-message-align="right" />
        <van-field v-model="groupConfig.groupCode" placeholder="请输入分组编码" label="分组编码" :readonly="originGroupCode=='DEFAULT'" input-align="right" :error-message="validationError.groupCode" error-message-align="right" />
        <van-cell title="定时执行方式">
          <template #right-icon>
            <van-dropdown-menu active-color="#1989fa" class="cell-dropdown">
              <van-dropdown-item v-model="groupConfig.executeType" :options="executeTypeOptions"/>
            </van-dropdown-menu>
          </template>
        </van-cell>
        <template v-if="groupConfig.executeType === '1'">
          <van-field :readonly="true" :value="startTime" label="执行时间" label-width="10em" type="text" input-align="right" @click="changeStart" />
        </template>
        <template v-else-if="groupConfig.executeType === '2'">
          <van-field :readonly="true" :value="startTime" label="随机起始时间" label-width="10em" type="text" input-align="right" @click="changeStart" />
          <van-field :readonly="true" :value="endTime" label="随机结束时间" label-width="10em" type="text" input-align="right" @click="changeEnd" />
        </template>
      </van-cell-group>
      <van-popup v-model="showTimePicker" position="bottom" :get-container="getContainer">
        <van-datetime-picker
          v-model="currentTime"
          type="time"
          title="选择时间"
          @confirm="handleChangeTime"
          @cancel="showTimePicker=false"
        />
      </van-popup>
    </van-popup>
  </div>
  `
}

const GroupConfigList = {
  name: 'GroupConfigList',
  components: { GroupConfigEditor },
  mixins: [mixin_methods],
  data () {
    return {
      showEditor: false,
      groupConfig: {},
      groups: []
    }
  },
  filters: {
    displayLabel: function (schedule) {
      if (schedule.executeType === '1') {
        return '每天固定时间：' + millisToDisplay(schedule.start)
      } else if (schedule.executeType === '2') {
        return '每天随机范围：' + millisToDisplay(schedule.start) + ' 到 ' + millisToDisplay(schedule.end)
      }
    },
    displayType: function (type) {
      if (type === '1') {
        return '指定时间'
      } else if (type === '2') {
        return '随机时间'
      }
    }
  },
  methods: {
    listGroup: function () {
      $nativeApi.request('listGroupConfig', { taskCode: this.taskCode }).then(resp => {
        console.log('groups', JSON.stringify(resp))
        this.groups = resp
      })
      if ($app.mock) {
        this.groups = [{
          id: 1,
          groupCode: "DEFAULT",
          groupName: "默认分组",
          executeType: "2",
          start: 28800000,
          end: 64800000,
        },
        {
          id: 2,
          groupCode: "DingDong1",
          groupName: "叮咚分组1",
          executeType: "2",
          start: 28800000,
          end: 31500000,
        },
        {
          id: 3,
          groupCode: "DingDong2",
          groupName: "叮咚分组2",
          executeType: "2",
          start: 37800000,
          end: 41400000,
        },
        {
          id: 4,
          groupCode: "DingDong3",
          groupName: "叮咚分组3",
          executeType: "2",
          start: 59400000,
          end: 63000000,
        }]
      }
    },
    addGroup: function () {
      this.groupConfig = {
        id: null,
        groupCode: '',
        groupName: '',
        executeType: '1',
        start: 0,
        end: null,
      }
      this.showEditor = true
    },
    editGroup: function (groupInfo) {
      this.groupConfig = groupInfo
      this.showEditor = true
    },
    deleteGroup: function (groupInfo) {
      if (groupInfo.groupCode === 'DEFAULT') {
        vant.Toast('默认分组不可删除')
        return
      }
      vant.Dialog.confirm({
        title: '删除确认',
        message: `确认要删除分组${groupInfo.groupName}吗?`,
      })
        .then(() => {
          $nativeApi.request('checkGroupRefExists', { groupCode: groupInfo.groupCode }).then(({ count = 0 }) => {
            if (count > 0) {
              vant.Toast(`当前分组已关联${count}个执行配置，不可删除`)
            } else {
              $nativeApi.request('deleteGroupConfig', { id: groupInfo.id }).then(resp => {
                this.listGroup()
              })
            }
          })
          if ($app.mock) {
            let deleteIdx = -1
            for (let i = 0; i < this.groups.length; i++) {
              if (this.groups[i].id == groupInfo.id) {
                deleteIdx = i
                break
              }
            }
            if (deleteIdx > -1) {
              console.log('find index:', deleteIdx)
              this.groups.splice(deleteIdx, 1)
            }
          }
        })
        .catch(() => {
          // on cancel
        })
    },
    handleConfigChanged: function ({ groupConfig, validationError }) {
      if (Object.keys(validationError).length == 0) {
        if (groupConfig.id) {
          $nativeApi.request('updateGroupConfig', groupConfig).then(resp => {
            this.listGroup()
          })
        } else {
          $nativeApi.request('insertGroupConfig', groupConfig).then(resp => {
            this.listGroup()
          })
          if ($app.mock) {
            groupConfig.id = new Date().getTime()
            this.groups.push(groupConfig)
          }
        }
      }
    },
  },
  mounted () {
    this.listGroup()
  },
  template: `
  <div>
    <tip-block style="padding: 0.5rem 0;">
      <van-button plain hairline type="primary" size="mini" style="margin-left: 0.3rem;" @click="addGroup">添加分组</van-button>
    </tip-block>
    <van-cell-group>
      <van-swipe-cell v-for="(group,index) in groups" :key="group.groupCode" stop-propagation>
        <van-cell clickable :title="group.executeType|displayType" :label="group|displayLabel">
          <template #extra>
            <div style="margin-top: 4px;color: #969799;font-size: 12px;line-height: 18px;">
              <div><span style="float:right;">{{group.groupName}}</span></div>
              <div><span style="float:right;">{{group.groupCode}}</span></div>
            </div>
          </template>
        </van-cell>
        <template #right>
          <div style="display:flex;height: 100%;">
            <van-button square type="primary" text="修改" @click="editGroup(group)" style="height: 100%"/>
            <van-button square type="danger" text="删除" @click="deleteGroup(group)" style="height: 100%"/>
          </div>
        </template>
      </van-swipe-cell>
    </van-cell-group>
    <group-config-editor v-model="showEditor" :group-config="groupConfig" @config-changed="handleConfigChanged"/>
  </div>
  `
}

// inner functions

function millisToDisplay (millis) {
  let hour = Math.floor(millis / 3600000)
  let minute = Math.floor(millis % 3600000 / 60000)
  return prependZero(hour) + ':' + prependZero(minute)
}

function prependZero (val) {
  val += ''
  if (val.length < 2) {
    val = '0' + val
  }
  return val
}