# 简介

- 聚合签到，一次性执行多个APP的签到，薅羊毛等等都不在话下，更多APP逐渐完善中
- 目前已实现的功能如下：
  - 京东京豆签到
  - 蚂蚁积分签到
  - 全家-Fa米家 APP签到
  - 米哈游-原神签到
  - 淘金币签到
  - 柚番短视频 自动刷泡泡 APP会检测无障碍因此需要[特殊版本的AutoJS](https://github.com/TonyJiangWJ/Auto.js/releases/download/v4.1.1/AntiDetect.20210628.-armeabi.apk)并关闭原版AutoJS的无障碍权限；
- 因为AutoJSPro的限制，Pro下部分签到将无法正常执行
- 因为部分应用会检测集中某个时间点的签到，检测为异常行为 因此脚本在每天第一次启动时会随机延迟一定的时间，所以可以对 `main.js` 设置每天0点的定时任务 如果需要绕过则需要设置两次定时任务；脚本在第二次运行时会直接运行 不再等待随机时间

## 其他的脚本

- [蚂蚁森林脚本传送门](https://github.com/TonyJiangWJ/Ant-Forest)
- [蚂蚁庄园脚本传送门](https://github.com/TonyJiangWJ/Ant-Manor)
- [开发框架传送门](https://github.com/TonyJiangWJ/AutoScriptBase)
