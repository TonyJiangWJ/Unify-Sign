/*
 * @Author: TonyJiangWJ
 * @Date: 2020-12-18 14:30:58
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-12-26 11:34:14
 * @Description: 
 */

/**
 * 基础配置
 */
Vue.component('sample-configs', function (resolve, reject) {
  resolve({
    mixins: [mixin_common],
    data: function () {
      return {
        configs: {
          password: '',
          bang_offset: -90,
          auto_set_bang_offset: false,
          show_debug_log: false,
          show_engine_id: false,
          save_log_file: false,
          back_size: '',
          async_save_log_file: false,
          console_log_maximum_size: 1500,
          delayStartTime: 5,
          request_capture_permission: true,
          capture_permission_button: 'START NOW|立即开始|允许',
          enable_call_state_control: false,
          auto_set_brightness: false,
          dismiss_dialog_if_locked: true,
          check_device_posture: false,
          check_distance: false,
          posture_threshold_z: 6,
          battery_keep_threshold: 20,
          auto_lock: false,
          hasRootPermission: false,
          lock_x: 150,
          lock_y: 970,
          timeout_unlock: 1000,
          timeout_findOne: 1000,
          timeout_existing: 8000,
          async_waiting_capture: true,
          capture_waiting_time: 500,
          develop_mode: false,
          develop_saving_mode: false,
          enable_visual_helper: false,
          auto_check_update: true,
          is_pro: false,
        },
        device: {
          pos_x: 0,
          pos_y: 0,
          pos_z: 0,
          distance: 0
        },
        validations: {
          min_floaty_color: {
            validate: (v) => /^#[\dabcdef]{6}$/i.test(v),
            message: () => '颜色值格式不正确'
          },
          posture_threshold_z: {
            validate: v => {
              if (v === undefined || v === '') {
                return true
              }
              let value = parseInt(v)
              return value > 0 && value < 9
            },
            message: () => '请输入一个介于0-9的数字，推荐4-7之间'
          }
        }
      }
    },
    methods: {
      saveConfigs: function () {
        console.log('save basic configs')
        if (this.configs.min_floaty_color && this.computedFloatyTextColor === '') {
          this.configs.min_floaty_color = ''
        }
        this.doSaveConfigs()
      },
      gravitySensorChange: function (data) {
        this.device.pos_x = data.x
        this.device.pos_y = data.y
        this.device.pos_z = data.z
      },
      distanceSensorChange: function (data) {
        this.device.distance = data.distance
      }
    },
    computed: {
      computedFloatyTextColor: function () {
        if (/#[\dabcdef]{6}/i.test(this.configs.min_floaty_color)) {
          return this.configs.min_floaty_color
        } else {
          return ''
        }
      }
    },
    filters: {
      toFixed3: function (v) {
        if (v) {
          return v.toFixed(3)
        }
        return v
      }
    },
    mounted () {
      $app.registerFunction('saveBasicConfigs', this.saveConfigs)
      $app.registerFunction('gravitySensorChange', this.gravitySensorChange)
      $app.registerFunction('distanceSensorChange', this.distanceSensorChange)
      $app.registerFunction('reloadBasicConfigs', this.loadConfigs)
    },
    template: '<div>\
      <van-divider content-position="left">锁屏相关</van-divider>\
      <van-cell-group>\
        <van-field v-model="configs.password" label="锁屏密码" type="password" placeholder="请输入锁屏密码" input-align="right" />\
        <number-field v-model="configs.timeout_unlock" label="解锁超时时间" placeholder="请输入解锁超时时间" >\
          <template #right-icon><span>毫秒</span></template>\
        </number-field>\
        <switch-cell title="锁屏启动设置最低亮度" v-model="configs.auto_set_brightness" />\
        <switch-cell title="锁屏启动关闭弹窗提示" v-model="configs.dismiss_dialog_if_locked" />\
        <switch-cell title="锁屏启动时检测设备传感器" label="检测是否在裤兜内，防止误触" v-model="configs.check_device_posture" />\
        <template  v-if="configs.check_device_posture">\
          <switch-cell title="同时校验距离传感器" label="部分设备数值不准默认关闭" v-model="configs.check_distance" />\
          <tip-block>z轴重力加速度阈值（绝对值小于该值时判定为在兜里）</tip-block>\
          <tip-block>x: {{device.pos_x | toFixed3}} y: {{device.pos_y | toFixed3}} z: {{device.pos_z | toFixed3}} 距离传感器：{{device.distance}}</tip-block>\
          <number-field v-if="configs.check_device_posture" v-model="configs.posture_threshold_z" error-message-align="right" :error-message="validationError.posture_threshold_z" label="加速度阈值" placeholder="请输入加速度阈值"/>\
        </template>\
        <switch-cell title="自动锁屏" label="脚本执行完毕后自动锁定屏幕" v-model="configs.auto_lock" />\
        <template v-if="configs.auto_lock && !configs.hasRootPermission">\
          <tip-block>自动锁屏功能默认仅支持MIUI12，其他系统需要自行扩展实现：extends/LockScreen.js</tip-block>\
          <number-field v-model="configs.lock_x" label="横坐标位置" placeholder="请输入横坐标位置"/>\
          <number-field v-model="configs.lock_y" label="纵坐标位置" placeholder="请输入纵坐标位置"/>\
        </template>\
        <tip-block>设置脚本运行的最低电量(充电时不受限制)，防止早晨低电量持续运行导致自动关机，发生意外情况，比如闹钟歇菜导致上班迟到等情况。如不需要设置为0即可</tip-block>\
        <number-field v-model="configs.battery_keep_threshold" label="脚本可运行的最低电量" label-width="12em" placeholder="请输入最低电量" />\
      </van-cell-group>\
      <van-divider content-position="left">悬浮窗配置</van-divider>\
      <van-cell-group>\
        <tip-block>刘海屏或者挖孔屏悬浮窗显示位置和实际目测位置不同，需要施加一个偏移量，一般是负值，脚本运行时会自动设置</tip-block>\
        <switch-cell title="下次执行时重新识别" v-model="configs.auto_set_bang_offset" />\
        <van-cell center title="当前偏移量">\
          <span>{{configs.auto_set_bang_offset ? "下次执行时重新识别": configs.bang_offset}}</span>\
        </van-cell>\
      </van-cell-group>\
      <van-divider content-position="left">执行配置</van-divider>\
      <van-cell-group>\
        <tip-block>对话框的倒计时时间，如果设置成0则不显示对话框</tip-block>\
        <number-field v-model="configs.delayStartTime" label="延迟启动时间" label-width="10em" placeholder="请输入延迟启动时间">\
          <template #right-icon><span>秒</span></template>\
        </number-field>\
        <switch-cell title="是否自动授权截图权限" v-model="configs.request_capture_permission" />\
        <van-field v-if="configs.request_capture_permission" v-model="configs.capture_permission_button" label="确定按钮文本" type="text" placeholder="请输入确定按钮文本" input-align="right" />\
        <tip-block>偶尔通过captureScreen获取截图需要等待很久，或者一直阻塞无法进行下一步操作，建议开启异步等待，然后设置截图等待时间(默认500ms,需自行调试找到合适自己设备的数值)。\
          失败多次后脚本会自动重启，重新获取截图权限</tip-block>\
        <switch-cell title="是否异步等待截图" v-model="configs.async_waiting_capture" />\
        <number-field v-if="configs.async_waiting_capture" v-model="configs.capture_waiting_time" label="获取截图超时时间" label-width="8em" placeholder="请输入超时时间">\
          <template #right-icon><span>毫秒</span></template>\
        </number-field>\
        <switch-cell center title="是否通话时暂停脚本" title-style="width: 10em;flex:2;" label="需要授权AutoJS获取通话状态，Pro版暂时无法使用" v-model="configs.enable_call_state_control" />\
        <number-field v-model="configs.timeout_findOne" label="查找控件超时时间" label-width="8em" placeholder="请输入超时时间" >\
          <template #right-icon><span>毫秒</span></template>\
        </number-field>\
        <number-field v-model="configs.timeout_existing" label="校验控件是否存在超时时间" label-width="12em" placeholder="请输入超时时间">\
          <template #right-icon><span>毫秒</span></template>\
        </number-field>\
      </van-cell-group>\
      <van-divider content-position="left">日志配置</van-divider>\
      <van-cell-group>\
        <tip-block v-if="!configs.is_pro">控制台保留的日志行数，避免运行时间长后保留太多的无用日志，导致内存浪费</tip-block>\
        <number-field v-if="!configs.is_pro" v-model="configs.console_log_maximum_size" label="控制台日志最大保留行数" label-width="12em" />\
        <switch-cell title="是否显示debug日志" v-model="configs.show_debug_log" />\
        <switch-cell title="是否显示脚本引擎id" v-model="configs.show_engine_id" />\
        <switch-cell title="是否保存日志到文件" v-model="configs.save_log_file" />\
        <number-field v-if="configs.save_log_file" v-model="configs.back_size" label="日志文件滚动大小" label-width="8em" placeholder="请输入单个文件最大大小">\
          <template #right-icon><span>KB</span></template>\
        </number-field>\
        <switch-cell title="是否异步保存日志到文件" v-model="configs.async_save_log_file" />\
      </van-cell-group>\
      <switch-cell title="是否自动检测更新" v-model="configs.auto_check_update" />\
      <van-divider content-position="left">开发模式配置</van-divider>\
      <van-cell-group>\
        <switch-cell title="是否启用开发模式" v-model="configs.develop_mode" />\
        <template v-if="configs.develop_mode">\
          <tip-block>脚本执行时保存图片等数据，未启用开发模式时依旧有效，请不要随意开启</tip-block>\
          <switch-cell title="是否保存一些开发用的数据" v-model="configs.develop_saving_mode" />\
          <switch-cell title="是否启用可视化辅助工具" v-model="configs.enable_visual_helper" />\
        </template>\
      </van-cell-group>\
    </div>'
  })
})

/**
 * 进阶配置
 */
Vue.component('advance-configs', function (resolve, reject) {
  resolve({
    mixins: [mixin_common],
    data: function () {
      return {
        mounted: false,
        showAddSkipRunningDialog: false,
        newSkipRunningPackage: '',
        newSkipRunningAppName: '',
        configs: {
          single_script: false,
          auto_restart_when_crashed: false,
          useCustomScrollDown: true,
          scrollDownSpeed: 200,
          bottomHeight: 200,
          warn_skipped_ignore_package: false,
          warn_skipped_too_much: false,
          skip_running_packages: [{ packageName: 'com.tony.test', appName: 'test' }, { packageName: 'com.tony.test2', appName: 'test2' }],
          supported_signs: [
            {
              name: '蚂蚁积分签到',
              script: 'AntCredits.js',
              enabled: true
            },
            {
              name: '全家签到',
              script: 'Fami.js',
              enabled: true
            },
            {
              name: '京东签到',
              script: 'JingDongBeans.js',
              enabled: false
            },
            {
              name: '米游社-原神签到',
              script: 'MiHoYou.js',
              enabled: true
            }
          ]
        },
        checked: [],
        validations: {
        }
      }
    },
    methods: {
      loadConfigs: function () {
        $app.invoke('loadConfigs', {}, config => {
          Object.keys(this.configs).forEach(key => {
            console.log('child load config key:[' + key + '] value: [' + config[key] + ']')
            this.$set(this.configs, key, config[key])
          })
          if (this.configs.skip_running_packages && this.configs.skip_running_packages.length > 0) {
            if (!this.configs.skip_running_packages[0].packageName) {
              this.configs.skip_running_packages = []
            }
          }
          this.checked = this.configs.supported_signs.filter(v => v.enabled).map(v => v.name)
          this.mounted = true
          let self = this
          this.configs.supported_signs.forEach((sign, idx) => {
            $nativeApi.request('checkExecuted', { name: sign.name }).then(resp => {
              sign.executedInfo = resp.success ? '今日已执行 ' + resp.executedTime : '未执行'
              console.log(sign.name + ' 执行状态：' + sign.executedInfo)
              self.$set(self.configs.supported_signs, idx, sign)
            })
          })
        })
      },
      saveConfigs: function () {
        console.log('save advnace configs')
        this.doSaveConfigs(['stroll_button_region', 'rank_check_region', 'bottom_check_region', 'tree_collect_region'])
      },
      addSkipPackage: function () {
        this.newSkipRunningPackage = ''
        this.newSkipRunningAppName = ''
        this.showAddSkipRunningDialog = true
      },
      doAddSkipPackage: function () {
        if (!this.isNotEmpty(this.newSkipRunningAppName)) {
          vant.Toast('请输入应用名称')
          return
        }
        if (!this.isNotEmpty(this.newSkipRunningPackage)) {
          vant.Toast('请输入应用包名')
          return
        }
        if (this.addedSkipPackageNames.indexOf(this.newSkipRunningPackage) < 0) {
          this.configs.skip_running_packages.push({ packageName: this.newSkipRunningPackage, appName: this.newSkipRunningAppName })
        }
      },
      deleteSkipPackage: function (idx) {
        this.$dialog.confirm({
          message: '确认要删除' + this.configs.skip_running_packages[idx].packageName + '吗？'
        }).then(() => {
          this.configs.skip_running_packages.splice(idx, 1)
        }).catch(() => { })
      },
      showRealVisual: function () {
        $app.invoke('showRealtimeVisualConfig', {})
      },
      handlePackageChange: function (payload) {
        this.newSkipRunningAppName = payload.appName
        this.newSkipRunningPackage = payload.packageName
      },
      toggle (index) {
        this.$refs.checkboxes[index].toggle()
      },
      toggleExecuted (name) {
        let self = this
        let idx = this.configs.supported_signs.map(sign => sign.name).indexOf(name)
        if (idx > -1) {
          let sign = this.configs.supported_signs[idx]
          let targetExecutedStatus = false
          if (!sign.executedInfo || sign.executedInfo === '未执行') {
            targetExecutedStatus = true
          }
          this.$dialog.confirm({
            message: `确定要将${name}标记为${targetExecutedStatus ? '已执行' : '未执行'}吗？`
          }).then(() => {
            let resolver = resp => {
              sign.executedInfo = resp.success ? '今日已执行 ' + resp.executedTime : '未执行'
              self.$set(self.configs.supported_signs, idx, sign)
            }
            if (targetExecutedStatus) {
              sign.executedInfo = '今日已执行'
              $nativeApi.request('setExecuted', { name: name }).then(resolver)
            } else {
              sign.executedInfo = '未执行'
              $nativeApi.request('markNotExecuted', { name: name }).then(resolver)
            }
          })
        }
      }
    },
    computed: {
      addedSkipPackageNames: function () {
        return this.configs.skip_running_packages.map(v => v.packageName)
      }
    },
    watch: {
      enabledSigns: function (v) {
        this.checked = v
      },
      checked: function (v) {
        this.configs.supported_signs.forEach(s => s.enabled = false)
        if (v && v.length > 0) {
          this.configs.supported_signs.filter(s => v.indexOf(s.name) > -1).forEach(s => s.enabled = true)
        }
        console.log(JSON.stringify(this.checked))
      }
    },
    mounted () {
      $app.registerFunction('saveAdvanceConfigs', this.saveConfigs)
      $app.registerFunction('reloadAdvanceConfigs', this.loadConfigs)
      // this.loadConfigs()
    },
    template: '<div>\
      <van-cell-group>\
        <tip-block>当需要使用多个脚本时不要勾选（如同时使用我写的蚂蚁庄园脚本），避免抢占前台</tip-block>\
        <switch-cell title="是否单脚本运行" v-model="configs.single_script" />\
        <tip-block>AutoJS有时候会莫名其妙的崩溃，但是授权了自启动权限之后又会自动启动。开启该选项之后会创建一个广播事件的定时任务，\
          当脚本执行过程中AutoJS崩溃自启，将重新开始执行脚本。如果脚本执行完毕，则不会触发执行</tip-block>\
        <switch-cell title="AutoJS崩溃自启后重启脚本" v-model="configs.auto_restart_when_crashed" />\
        <switch-cell title="是否使用模拟滑动" v-model="configs.useCustomScrollDown" />\
        <template v-if="configs.useCustomScrollDown">\
          <number-field v-model="configs.scrollDownSpeed" label="模拟滑动速度" label-width="8em" />\
          <number-field v-model="configs.bottomHeight" label="模拟底部起始高度" label-width="8em" />\
        </template>\
      </van-cell-group>\
      <van-divider content-position="left">\
        前台应用白名单设置\
        <van-button style="margin-left: 0.4rem" plain hairline type="primary" size="mini" @click="addSkipPackage">增加</van-button>\
      </van-divider>\
      <van-cell-group>\
        <div style="max-height:10rem;overflow:scroll;padding:1rem;background:#f1f1f1;">\
        <van-swipe-cell v-for="(skip,idx) in configs.skip_running_packages" :key="skip.packageName" stop-propagation>\
          <van-cell :title="skip.appName" :label="skip.packageName" />\
          <template #right>\
            <van-button square type="danger" text="删除" @click="deleteSkipPackage(idx)" style="height: 100%"/>\
          </template>\
        </van-swipe-cell>\
        </div>\
        <switch-cell title="当前台白名单跳过次数过多时提醒" label="当白名单跳过3次之后会toast提醒，按音量下可以直接执行" title-style="width: 12em;flex:2;" v-model="configs.warn_skipped_too_much" />\
        <switch-cell v-if="configs.warn_skipped_too_much" title="是否无视前台包名" title-style="width: 10em;flex:2;" label="默认情况下包名相同且重复多次时才提醒" v-model="configs.warn_skipped_ignore_package" />\
      </van-cell-group>\
      <van-divider content-position="left">\
        设置启用的签到\
      </van-divider>\
      <van-checkbox-group v-model="checked">\
        <van-cell-group>\
          <van-swipe-cell v-for="(supportedSign,index) in configs.supported_signs" :key="supportedSign.name" stop-propagation>\
            <van-cell clickable \
              :title="supportedSign.name" @click="toggle(index)" :label="supportedSign.executedInfo">\
              <template #right-icon>\
                <van-checkbox :name="supportedSign.name" ref="checkboxes" />\
              </template>\
            </van-cell>\
            <template #right>\
              <van-button square type="danger" text="切换执行状态" @click="toggleExecuted(supportedSign.name)" style="height: 100%"/>\
            </template>\
          </van-swipe-cell>\
        </van-cell-group>\
      </van-checkbox-group>\
      <van-dialog v-model="showAddSkipRunningDialog" show-cancel-button @confirm="doAddSkipPackage" :get-container="getContainer">\
        <template #title>\
          <installed-package-selector @value-change="handlePackageChange" :added-package-names="addedSkipPackageNames"/>\
        </template>\
        <van-field v-model="newSkipRunningAppName" placeholder="请输入应用名称" label="应用名称" />\
        <van-field v-model="newSkipRunningPackage" placeholder="请输入应用包名" label="应用包名" />\
      </van-dialog>\
    </div>'
  })
})

/**
 * 控件配置
 */
Vue.component('widget-configs', function (resolve, reject) {
  resolve({
    mixins: [mixin_common],
    data: function () {
      return {
        configs: {
        },
      }
    },
    methods: {
      loadConfigs: function () {
        $app.invoke('loadConfigs', {}, config => {
          Object.keys(this.configs).forEach(key => {
            // console.log('load config key:[' + key + '] value: [' + config[key] + ']')
            this.$set(this.configs, key, config[key])
          })
        })
      },
      saveConfigs: function () {
        console.log('save widget configs')
        this.doSaveConfigs()
      }
    },
    mounted () {
      $app.registerFunction('saveWidgetConfigs', this.saveConfigs)
      $app.registerFunction('reloadWidgetConfigs', this.loadConfigs)
    },
    template: '<div>\
      控件信息配置\
    </div>'
  })
})