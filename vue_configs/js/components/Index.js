let Index = {
  components: { UpdateTipsDialog, AnnouncementDialog },
  mixins: [mixin_methods],
  data: function () {
    return {
      menuItems: [
        {
          title: '锁屏设置',
          link: '/basic/lock'
        },
        {
          title: '签到设置',
          link: '/basic/sign'
        },
        {
          title: '日志设置',
          link: '/basic/log'
        },
        {
          title: '前台应用白名单设置',
          link: '/advance/skipPackage'
        },
        {
          title: '视频应用设置',
          link: '/advance/videoPackage'
        },
        {
          title: 'OCR设置',
          link: '/advance/ocr'
        },
        {
          title: '高级设置',
          link: '/advance/common'
        },
        {
          title: '关于项目',
          link: '/about'
        },
        {
          title: '支持作者',
          link: '/sponsor'
        },
        {
          title: '论坛',
          link: 'https://autoscripts.flarum.cloud/'
        },
      ]
    }
  },
  methods: {
    routerTo: function (item) {
      if (item.link.indexOf('https://') > -1) {
        vant.Toast.loading({
          duration: 0,
          message: '等待加载，请稍候'
        })
        $app.invoke('jumpToUrl', { url: item.link})
        return
      }
      this.$router.push(item.link)
      this.$store.commit('setTitleWithPath', { title: item.title, path: item.link })
    }
  },
  template: `<div>
    <update-tips-dialog />
    <announcement-dialog />
    <van-cell-group>
      <van-cell :title="item.title" is-link v-for="item in menuItems" :key="item.link" @click="routerTo(item)"/>
    </van-cell-group>
  </div>`
}
