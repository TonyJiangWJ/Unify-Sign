[![GitHub forks](https://img.shields.io/github/forks/TonyJiangWJ/Unify-Sign?style=flat-square)](https://github.com/TonyJiangWJ/Unify-Sign/forks)
[![GitHub stars](https://img.shields.io/github/stars/TonyJiangWJ/Unify-Sign?style=flat-square)](https://github.com/TonyJiangWJ/Unify-Sign/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/TonyJiangWJ/Unify-Sign?style=flat-square)](https://github.com/TonyJiangWJ/Unify-Sign/issues)
[![Page Views Count](https://badges.toozhao.com/badges/01HV8RTJSBDZVMS36ZWQR470XM/green.svg)](https://badges.toozhao.com/stats/01HV8RTJSBDZVMS36ZWQR470XM "Get your own page views count badge on badges.toozhao.com")

# 聚合签到 (Unify-Sign)

一个聚合多个 APP 签到任务的 Auto.js 脚本，轻松薅羊毛。

## ⚠️ 重要提示：依赖与环境

* **核心依赖**: 本脚本需要 **特定版本的 Auto.js** 才能正常运行，因为部分 APP 会检测无障碍服务，且脚本使用了内置 OCR 功能。推荐使用：
  * **[困鱼 (AutoJS.fake)](https://github.com/TonyJiangWJ/Ant-Forest/releases/download/v1.1.1.4/AutoJS.fake.latest.apk)**
  * **最新版下载**: `https://wwxs.lanzouq.com/b042le51i` (密码: `b034`)
* **不兼容**:
  * **原版 Auto.js**: 请关闭原版 Auto.js 的无障碍权限。
  * **Auto.js Pro**: 由于其无障碍限制和代码审查政策，**不受支持**，请勿使用。
* **权限**: 需要授予 Auto.js 必要的权限，如无障碍服务、后台运行、悬浮窗等。

## ✨ 主要功能

* **聚合签到**: 一次配置，自动执行多个 APP 的签到任务。
* **支持的任务 (持续增加中)**:
  * 京东 - 京豆签到、种豆得豆
  * 支付宝 - 蚂蚁积分签到
  * ~~全家 - Fa米家 APP 签到~~ (倒闭)
  * 米哈游 - 原神签到
  * 淘宝 - 淘金币签到
  * 叮咚买菜 - 签到 (积分、鱼塘、果园)
  * 微博 - 积分签到
  * 淘宝/支付宝 - 芭芭农场签到
  * 手机淘宝 - 现金签到
  * 一嗨租车 - 积分签到
  * 华住会 - 积分签到
  * 网上国网 - 积分签到
  * 小米商城 - 积分签到
  * 什么值得买 - 每日签到
  * 阿里云盘 - 每日签到
  * 饿了么 - 吃货豆签到
  * 支付宝商家 - 积分签到
  * 小米钱包 - 每日签到（未完善）
  * ~~柚番短视频 - 自动刷泡泡~~ (已失效)
* **可视化配置**: 通过 `可视化配置.js` 方便地管理签到任务、执行时间、分组等。
* **智能执行计划**:
  * 每日首次运行时自动生成 **随机化** 的执行计划，避免被检测。
  * 支持查看、管理和重新生成执行计划。
* **灵活分组**:
  * 可创建执行分组，将任务按需归类，实现特定时间段的批量执行。
  * 例如：设置叮咚买菜的鱼塘和果园任务在早、中、晚三个不同时间段随机执行，确保领取所有奖励。
* **手动执行**: 支持对单个任务进行立即的手动执行测试。
* **可扩展性**: 支持开发者添加自定义的签到脚本。

## 🚀 使用入门

1. **环境准备**:
    * 下载并安装上文提到的 **[困鱼 (AutoJS.fake)](https://github.com/TonyJiangWJ/Ant-Forest/releases/download/v1.1.1.4/AutoJS.fake.latest.apk)** 或其最新版本。
    * 将整个脚本项目文件夹放置到设备的 **`/sdcard/脚本/`** 目录下。
2. **授权与设置**:
    * 打开 AutoJS 应用，下拉刷新列表，找到本项目。
    * 授予 AutoJS **`后台弹出界面`**、**`显示悬浮窗`**、**`自启动`**、**`电量无限制`** 等必要权限。
    * 保持 AutoJS 应用在后台运行（加入电池优化白名单）。
    * (可选) [通过 ADB 授权脚本自动开启无障碍权限](#自动开启无障碍权限)。
3. **配置定时任务 (关键!)**:
    * 点击 `main.js` 右侧的菜单按钮，选择 `更多` -> `定时任务`。
    * **必须** 为 `main.js` 设置一个 **每天 0 点** 左右执行的定时任务。此任务用于生成当天的随机执行计划。
4. **配置签到任务**:
    * 运行 `可视化配置.js`。
    * 进入 `签到设置`，勾选你想要自动执行的签到任务。
    * **设置执行时间**: 选中任务项 **右滑**，点击 `设置执行时间`，可以单独设置，也可以绑定到预设的分组。
    * **配置图像/参数 (如需)**: 对于需要特定配置的任务 (如叮咚签到)，选中任务项 **左滑**，点击 `更多设置`，根据提示配置图像节点或其他参数。
    * **管理分组**: 在 `管理执行分组` 中创建和配置执行分组。
5. **生成与查看计划**:
    * 配置完成后，在 `签到设置` 界面点击 `查看执行计划`。
    * 首次使用或修改配置后，点击 `生成执行计划` 来创建或更新计划。之后可以查看当天的任务安排。
6. **运行**: 完成以上步骤后，脚本将根据生成的执行计划自动在后台执行签到任务。

## ⚙️ 配置与管理详解

* **可视化配置 (`可视化配置.js`)**:
  * **签到设置**: 核心管理界面。
    * 勾选/取消勾选任务。
    * **右滑** 设置执行时间或绑定分组。
    * **左滑** 进入更多设置 (配置图像、参数等) 或手动执行。
  * **管理执行分组**: 创建、编辑、删除执行分组，并为分组设置随机时间段。
  * **查看执行计划**: 查看当天已生成的任务列表和预定执行时间，可手动重新生成。
* **执行逻辑**:
  * `main.js` 的 0 点定时任务负责调用内部逻辑，生成一整天的、时间点随机打散的签到计划。
  * Auto.js 的定时任务调度器会根据计划在相应时间点唤起对应的签到子脚本。
* **分组应用示例 (叮咚买菜)**:
    1. 在 `管理执行分组` 中创建三个分组，分别设置随机时间段：分组A (7-9点)，分组B (10-12点)，分组C (16-18点)。
    2. 在 `签到设置` 中：
        * 将 "叮咚签到 - 积分签到" 子任务绑定到默认分组 (或其他你希望的时间)。
        * 将 "叮咚签到 - 鱼塘" 子任务绑定到分组 A、B、C。
        * 将 "叮咚签到 - 果园" 子任务绑定到分组 A、B、C。
    3. 这样，鱼塘和果园任务每天会在早、中、晚三个时间段内各随机执行一次。

### 自动开启无障碍权限

* 需要 ADB 或 Shizuku 授权 `WRITE_SECURE_SETTINGS` 权限给 AutoJS。
* **ADB 命令** (请将包名替换为你使用的 AutoJS 版本，可通过 `context.getPackageName()` 获取):

    ```shell
    adb shell pm grant org.autojs.autojs.modify android.permission.WRITE_SECURE_SETTINGS
    ```

* **详细教程**: [通过ADB授权脚本自动开启无障碍权限](https://github.com/TonyJiangWJ/AutoScriptBase/blob/master/resources/doc/ADB%E6%8E%88%E6%9D%83%E8%84%9A%E6%9C%AC%E8%87%AA%E5%8A%A8%E5%BC%80%E5%90%AF%E6%97%A0%E9%9A%9C%E7%A2%8D%E6%9D%83%E9%99%90.md)

## 🔧 开发自定义签到脚本

如果你想添加列表中没有的签到任务，可以按照以下步骤进行：

### 1. 定义任务信息

* 创建文件 `extends/CustomConfig.js` (可参考 `extends/CustomConfig-demo.js`)。
* 在此文件中定义你的任务编号、名称、脚本文件名等。

```javascript
// extends/CustomConfig.js 示例
module.exports = {
  supported_signs: [
    // ... 你可以添加多个自定义任务
    {
      name: '我的应用签到',        // 任务显示名称
      taskCode: 'MyAppSign',     // 任务唯一标识符 (英文数字)
      script: 'MyAppSign.js',    // 对应的签到脚本文件名 (需放在 core/ 目录下)
      enabled: true,             // 默认是否启用
      // 如果有子任务 (例如一个应用内有多个签到点)
      subTasks: [
        {
          taskCode: 'dailyCheckin', // 子任务唯一标识符
          taskName: '每日签到',     // 子任务显示名称
          enabled: true,          // 默认是否启用子任务
        },
        {
          taskCode: 'bonusPoints',
          taskName: '领额外积分',
          enabled: false,
        }
      ]
    },
    // ... 其他自定义任务
  ]
}
```

### 2. 定义任务配置 (可选)

* 如果你的签到任务需要额外的配置项 (如特定坐标、账号密码、图片识别区域等)，创建 `extends/CustomSignConfig.js` (可参考 `extends/CustomSignConfig-demo.js`)。

```javascript
// extends/CustomSignConfig.js 示例
module.exports = function (binder) {
  /**
   * 绑定自定义配置
   * @param {string} prefix - 配置前缀 (需唯一, 建议与 taskCode 相关)
   * @param {object} initialValues - 配置项的初始值 (如果只有图片配置, 可传 {})
   * @param {string[]} imageFields - 需要配置的图片字段列表 (可选)
   */
  binder.bindCustomSignConfig(
    'my_app_sign', // 配置前缀 (将在 config 对象中以 my_app_sign_config 访问)
    { // 初始值
      username: '',
      click_point: { x: 500, y: 1500 },
      some_option: true,
    },
    [ // 需要配置的图片 (会在“更多设置”中显示图片配置项)
      'login_button_image',
      'signin_success_image',
    ]
  );
}

// 在你的签到脚本 (core/MyAppSign.js) 中获取配置:
// let { config } = require('../config.js')(runtime, global);
// let username = config.my_app_sign_config.username;
// let loginBtnImg = config.my_app_sign_config.login_button_image;
```

### 3. 编写签到脚本

* 在 `core/` 目录下创建与步骤 1 中 `script` 字段同名的 JS 文件 (例如 `core/MyAppSign.js`)。
* 脚本需要继承 `BaseSignRunner` 并实现 `exec` 方法。

```javascript
// core/MyAppSign.js 示例
let { config } = require('../config.js')(runtime, global);
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, global);
let FloatyInstance = singletonRequire('FloatyUtil'); // 悬浮窗工具
let widgetUtils = singletonRequire('WidgetUtils');   // 控件操作工具
let automator = singletonRequire('Automator');       // 自动化操作封装
let commonFunctions = singletonRequire('CommonFunction'); // 常用函数
// let localOcrUtil = require('../lib/LocalOcrUtil.js'); // 本地OCR (如果需要)

let BaseSignRunner = require('./BaseSignRunner.js'); // 引入基类

function MyAppSignRunner() {
  BaseSignRunner.call(this); // 调用父类构造函数

  // 实现签到执行逻辑
  this.exec = function () {
    FloatyInstance.setFloatyInfo('开始执行我的应用签到...');
    commonFunctions.launchPackage(config.my_app_sign_config.package_name); // 假设配置了包名

    // --- 无子任务的简单示例 ---
    if (!this.isTaskExecuted()) { // 检查今天是否已执行过
      // ... 在这里编写打开APP、查找按钮、点击签到等逻辑 ...
      // let loginBtn = widgetUtils.widgetGetOne(config.my_app_sign_config.login_button_image, 5000);
      // if (loginBtn) { automator.clickWidget(loginBtn); }
      // ... 更多逻辑 ...

      let success = true; // ... 判断是否签到成功 ...
      if (success) {
        this.setExecuted(); // 标记任务已完成
        FloatyInstance.setFloatyInfo('我的应用签到完成');
      } else {
        FloatyInstance.setFloatyWarning('我的应用签到失败');
      }
    }

    // --- 有子任务的示例 ---
    // 检查并执行子任务 'dailyCheckin'
    if (!this.isSubTaskExecuted({ taskCode: 'dailyCheckin' })) {
      if (this.doDailyCheckin()) { // 假设 doDailyCheckin 是签到逻辑函数
        this.setSubTaskExecuted({ taskCode: 'dailyCheckin' }); // 标记子任务完成
      }
    }
    // 检查并执行子任务 'bonusPoints'
    if (!this.isSubTaskExecuted({ taskCode: 'bonusPoints' })) {
      if (this.doBonusPoints()) {
        this.setSubTaskExecuted({ taskCode: 'bonusPoints' });
      }
    }

    commonFunctions.recycle(); // 回收资源
  };

  // (可选) 封装子任务逻辑
  this.doDailyCheckin = function() {
    FloatyInstance.setFloatyInfo('执行每日签到子任务...');
    // ... 每日签到具体逻辑 ...
    return true; // 返回是否成功
  }

  this.doBonusPoints = function() {
    FloatyInstance.setFloatyInfo('执行领额外积分子任务...');
    // ... 领积分具体逻辑 ...
    return true;
  }
}
// 设置继承关系
MyAppSignRunner.prototype = Object.create(BaseSignRunner.prototype);
MyAppSignRunner.prototype.constructor = MyAppSignRunner;

// 导出实例
module.exports = new MyAppSignRunner();
```

### 4. 测试签到脚本

* 修改 `test/测试签到功能.js` 文件，将其中的 `require` 指向你刚创建的脚本。

```javascript
// test/测试签到功能.js 修改示例
// ... 其他代码 ...

// 将 'core/DingDong.js' 替换为你自己的脚本路径
let signRunner = require('../core/MyAppSign.js');

// 设置任务名称 (用于日志和悬浮窗显示) 并执行
signRunner.setName('测试我的应用签到').exec();

// ... 其他代码 ...
```

* 将所有修改后的文件复制到手机的脚本目录下。
* 运行 `test/测试签到功能.js` 来单独测试你的签到逻辑是否正常工作。

### 5. 配置执行时间

* 测试通过后，回到 `可视化配置.js` -> `签到设置`。
* 找到你添加的自定义任务，**右滑** 设置执行时间或绑定分组。
* 进入 `查看执行计划`，点击 `生成执行计划`，你的新任务就会被纳入自动执行计划中。

## 🖼️ 界面预览

* <details>
    <summary>签到设置</summary>
    <img alt="签到设置" src="./resources/sign_config.jpg" height="400"/>
  </details>
* <details>
    <summary>执行时间设置</summary>
    <img alt="执行时间设置" src="./resources/task_config.jpg" height="400"/>
  </details>
* <details>
    <summary>执行计划管理</summary>
    <img alt="执行计划管理" src="./resources/task_schedules.jpg" height="400"/>
  </details>

## 🔄 脚本更新

* 运行 `update/检测更新.js` 检查并更新脚本。
* 可以选择 **覆盖更新** 或 **备份后更新**。
* 更多说明请参考 `update/说明-重要.txt` 文件。

## 🐞 问题反馈

1. **开启日志**: 在 `可视化配置.js` -> `高级设置` 中，勾选 `保存日志到文件`，并将 `日志文件大小` 调整为 1024KB 或更大。
2. **复现问题**: 重新运行脚本直到问题出现。
3. **收集信息**:
    * 详细描述问题现象、操作步骤。
    * 提供使用的脚本版本、AutoJS 版本、手机型号、安卓版本。
    * 长截图AutoJS软件中的日志，可以的话再附上日志文件 (`logs/log-verboses.log`)。日志默认保存 100k，旧日志在 `logs/logback`。
    * 如有截图或录屏更有助于定位问题。
4. **提交**:
    * **[创建 ISSUE](https://github.com/TonyJiangWJ/Unify-Sign/issues/new)** (推荐)。
    * **[前往论坛反馈](https://autoscripts.flarum.cloud)** 邮箱注册即可，常见的问题后续会逐渐完善上去
    * 如果日志包含隐私信息，可删除敏感部分或通过邮件发送给开发者: `tonyjiangwj@gmail.com`。

## 🔗 其他的脚本

* **[蚂蚁森林脚本传送门](https://github.com/TonyJiangWJ/Ant-Forest)**
* **[蚂蚁庄园脚本传送门](https://github.com/TonyJiangWJ/Ant-Manor)**
* **[AutoScriptBase - 开发框架传送门](https://github.com/TonyJiangWJ/AutoScriptBase)**

## ☕ 支持开发者

如果觉得项目对你有帮助，欢迎请我喝杯咖啡！

* 一元喝速溶、五元喝胶囊、十二买全家、三十三买星巴克，感激不尽！

| 支付宝 | 微信 | 也欢迎支付宝扫码领红包，你领我也得，双赢！|
| :----: | :----: | :----: |
| ![alipay_qrcode](./resources/alipay_qrcode.png) | ![wechat_qrcode](./resources/wechat_qrcode.png) | ![扫码领红包](./resources/hongbao_qrcode.png) |

* 也可以运行 `unit/支持作者.js` 在线获取红包口令，通过支付宝直接打开领取，每使用一个红包我都可以获取一分钱的收益。
