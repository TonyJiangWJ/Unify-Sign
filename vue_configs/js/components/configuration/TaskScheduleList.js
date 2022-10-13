const TaskScheduleList = {
  mixins: [mixin_methods],
  data () {
    return {
      taskSchedules: [
        // dfrs delete for release
        { id: 64, taskCode: "DingDong:fishpond", triggerType: "1", configId: 8, executeStatus: "S", executeTime: 1654042797459, executeDate: "2022-06-01", realExecuteTime: 1654045680758, executeEndTime: 1654045736158, executeCost: 55400 },
        { id: 67, taskCode: "DingDong:orchard", triggerType: "1", configId: 9, executeStatus: "F", executeTime: 1654043415817, executeDate: "2022-06-01", realExecuteTime: 1654045680758, executeEndTime: 1654045756654, executeCost: 1654045756654 - 1654045680758 },
        { id: 58, taskCode: "Fami", triggerType: "1", configId: 2, executeStatus: "P", executeTime: 1654047023510, executeDate: "2022-06-01", realExecuteTime: 1654047467846, executeEndTime: 1654047490471, executeCost: null },
        { id: 62, taskCode: "DingDong", triggerType: "1", configId: 6, executeStatus: "A", executeTime: 1654049772585, executeDate: "2022-06-01", realExecuteTime: 1654053183580, executeEndTime: 1654053227395, executeCost: null },
        // dfre
      ],
      showTimePicker: false,
      editSchedule: {
        taskCode: '',
        id: '',
        executeTime: 0
      },
      taskMap: {},
      currentTime: null,
      timedUnit: ''
    }
  },
  filters: {
    displayTime: value => {
      if (value && value.length > 0) {
        return `[${value}]`
      }
      return ''
    },
    displayLabel: function (schedule) {
      let executeTime = formatDate(new Date(schedule.executeTime))

      return `${executeTime}`
    },
    displayStatus: function (schedule) {
      let statusMap = {
        'A': '等待执行',
        'S': '执行成功',
        'F': '执行失败',
        'P': '执行中',
        'D': '已禁用',
      }
      return `${statusMap[schedule.executeStatus]}${schedule.executeStatus != 'A' && schedule.executeCost ? '[' + (schedule.executeCost / 1000).toFixed(0) + 's]' : ''}`
    },
    displayStatusStyle: function (schedule) {
      let statusMap = {
        'A': '#efe413',
        'S': '#2ff40c',
        'F': 'red',
        'P': '#fbadd3',
        'D': 'gray',
      }
      return { color: statusMap[schedule.executeStatus] }
    },
    displayExecuteTime: function (schedule) {
      let realExecuteTime = formatDate(new Date(schedule.realExecuteTime), 'HH:mm:ss')
      let executeEndTime = formatDate(new Date(schedule.executeEndTime), 'HH:mm:ss')
      let executeTime = formatDate(new Date(schedule.executeTime), 'HH:mm:ss')
      let status = schedule.executeStatus
      if (status == 'S' || status == 'F') {
        return `${realExecuteTime}-${executeEndTime}`
      } else if (status == 'P') {
        return `${realExecuteTime} - ~`
      } else if (status == 'A') {
        return `${executeTime} - ~`
      }
      return ''
    },
  },
  methods: {
    getTaskName: function (taskCode) {
      let taskInfo = this.taskMap[taskCode]
      if (taskInfo) {
        let taskName = taskInfo.taskName
        if (taskInfo.parentTaskCode) {
          let parentTask = this.taskMap[taskInfo.parentTaskCode]
          taskName = parentTask ? parentTask.taskName + ':' + taskName : taskName
        }
        return taskName
      }
      return taskCode
    },
    toggleExecuted: function (schedule) {
      schedule.executeStatus = 'S'
      schedule.executeEndTime = new Date().getTime()
      let executeStart = Math.min(schedule.executeTime, new Date().getTime())
      schedule.executeCost = schedule.executeEndTime - (schedule.realExecuteTime || executeStart)
      schedule.realExecuteTime = schedule.realExecuteTime || executeStart
      let { id, executeStatus, executeEndTime, editExecuteTime, executeCost, realExecuteTime } = schedule
      $nativeApi.request('updateSchedule', { id, executeStatus, executeEndTime, editExecuteTime, executeCost, realExecuteTime }).then(resp => {
        if (resp.success) {
          this.listSchedules()
        } else {
          vant.Toast('修改失败')
        }
      })
    },
    toggleNotExecuted: function (schedule) {
      schedule.executeStatus = 'A'
      $nativeApi.request('updateSchedule', { id: schedule.id, executeStatus: schedule.executeStatus }).then(resp => {
        if (resp.success) {
          this.listSchedules()
        } else {
          vant.Toast('修改失败')
        }
      })
    },
    listSchedules: function () {
      $nativeApi.request('queryScheduleList', { date: formatDate(new Date(), 'yyyy-MM-dd') }).then(resp => {
        this.taskSchedules = resp
      })
    },
    duplicateSchedule: function (schedule) {
      let newSchedule = {
        taskCode: schedule.taskCode,
        triggerType: 2,
        executeStatus: 'A',
        executeTime: new Date().getTime(),
        executeDate: schedule.executeDate,
      }
      $nativeApi.request('insertSchedule', newSchedule).then(resp => {
        newSchedule.id = resp.id
        if (resp.id > 0) {
          this.listSchedules()
        }
      })
    },
    deleteSchedule: function (schedule) {
      $nativeApi.request('deleteSchedule', schedule).then(r => this.listSchedules())
    },
    editExecuteTime: function (schedule) {
      this.editSchedule = schedule
      this.showTimePicker = true
      this.currentTime = formatDate(new Date(schedule.executeTime), 'HH:mm')
    },
    handleChangeTime: function () {
      this.showTimePicker = false
      this.editSchedule.executeTime = new Date(formatDate(new Date(), 'yyyy-MM-dd ' + this.currentTime)).getTime()
      $nativeApi.request('updateSchedule', { id: this.editSchedule.id, executeTime: this.editSchedule.executeTime }).then(resp => {
        this.listSchedules()
      })
    },
    listTasks: function () {
      $nativeApi.request('listTaskInfos').then(taskList => {
        console.log('task list:', JSON.stringify(taskList))
        if (taskList && taskList.length > 0) {
          taskList.forEach(task => {
            this.$set(this.taskMap, task.taskCode, task)
            if (task.parentTaskCode) {
              this.$set(this.taskMap, task.parentTaskCode + ':' + task.taskCode, task)
            }
          })
        }
        console.log('task map:', JSON.stringify(this.taskMap))
      })
    },
    executeNow: function () {
      $app.invoke('executeTargetScript', '/main.js')
    },
    generateSchedules: function () {
      $nativeApi.request('generateTaskSchedules').then(resp => {
        this.listTasks()
        this.listSchedules()
      })
    },
    regenerateSchedules: function () {
      vant.Dialog.confirm({
        title: '确认重新生成？',
        message: '此操作会删除所有执行计划并重新生成，已执行过的请手动标记为已完成'
      }).then(() => {
        $nativeApi.request('regenerateTaskSchedules').then(resp => {
          this.listTasks()
          this.listSchedules()
        })
      })
    },
    regenerateNotExecuted: function () {
      vant.Dialog.confirm({
        title: '确认重新生成？',
        message: '此操作会删除未执行的执行计划并重新生成'
      }).then(() => {
        $nativeApi.request('regenerateTaskSchedulesNotExecuted').then(resp => {
          this.listTasks()
          this.listSchedules()
        })
      })
    }
  },
  mounted () {
    this.listSchedules()
    this.listTasks()
    $nativeApi.request('queryTargetTimedTaskInfo', { path: '/main.js' }).then(r => this.timedUnit = r)
  },
  template: `
  <div>
    <tip-block>
      <van-button plain hairline type="warning" size="mini" style="margin: 0.3rem;" @click="generateSchedules">生成执行计划</van-button>
      <span>只生成不存在的执行计划</span>
    </tip-block>
    <tip-block>
      <van-button plain hairline type="danger" size="mini" style="margin: 0.3rem;" @click="regenerateNotExecuted">重新生成未执行的</van-button>
      <span>删除未执行的执行计划并重新生成</span>
    </tip-block>
    <tip-block>
      <van-button plain hairline type="danger" size="mini" style="margin: 0.3rem;" @click="regenerateSchedules">全部重新生成</van-button>
      <span>删除所有执行计划并重新生成</span>
    </tip-block>
    <tip-block>
      <van-button plain hairline type="primary" size="mini" style="margin: 0.3rem;" @click="executeNow">立即执行</van-button> 
      <span>{{timedUnit|displayTime}}</span>
    </tip-block>
    <tip-block style="padding: 0.5rem 0;">今日任务执行状态 左右滑动可以进行修改等操作</tip-block>
    <van-cell-group>
      <van-swipe-cell v-for="(schedule,index) in taskSchedules" :key="schedule.taskCode + schedule.configId + schedule.executeStatus" stop-propagation>
        <van-cell clickable 
          :title="getTaskName(schedule.taskCode)" :label="schedule|displayLabel">
          <template #extra>
          <div style="margin-top: 4px;color: #969799;font-size: 12px;line-height: 18px;">
            <div><span style="float:right;color: green;" :style="schedule|displayStatusStyle" >{{schedule|displayStatus}}</span></div>
            <div><span style="float:right;">{{schedule|displayExecuteTime}}</span></div>
          </div>
          </template>
        </van-cell>
        <template #right>
          <div style="display:flex;height: 100%;">
            <van-button square type="primary" v-if="schedule.executeStatus=='A' || schedule.executeStatus == 'P'" text="标记完成" @click="toggleExecuted(schedule)" style="height: 100%"/>
            <van-button square type="info" v-if="schedule.executeStatus=='A' || schedule.executeStatus == 'P'" text="修改时间" @click="editExecuteTime(schedule)" style="height: 100%"/>
            <van-button square type="warning" v-if="schedule.executeStatus=='S' && schedule.executeTime > new Date().getTime()" text="标记未完成" @click="toggleNotExecuted(schedule)" style="height: 100%"/>
            <van-button square type="danger" v-if="schedule.triggerType !='1' && (schedule.executeStatus=='A' || schedule.executeStatus == 'P')" text="删除任务" @click="deleteSchedule(schedule)" style="height: 100%"/>
          </div>
        </template>
        <template #left>
          <div style="display:flex;height: 100%;">
            <van-button square type="primary" text="复制新任务" @click="duplicateSchedule(schedule)" style="height: 100%"/>
          </div>
        </template>
      </van-swipe-cell>
    </van-cell-group>
    <van-popup v-model="showTimePicker" position="bottom" :get-container="getContainer">
      <van-datetime-picker
        v-model="currentTime"
        type="time"
        title="选择时间"
        :min-hour="new Date().getHours()"
        @confirm="handleChangeTime"
        @cancel="showTimePicker=false"
      />
    </van-popup>
  </div>`
}