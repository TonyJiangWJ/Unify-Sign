const OCRConfig = {
  mixins: [mixin_common],
  name: 'OCRConfig',
  data() {
    return {
      ocrPriorityOptions: [
        { text: '自动', value: 'auto' },
        { text: 'mlkit优先', value: 'mlkit' },
        { text: 'paddle优先', value: 'paddle' },
      ],
      configs: {
        // 本地ocr优先级
        local_ocr_priority: 'auto',
      }
    }
  },
  methods: {

  },
  template: `
  <div>
    <tip-block>本地OCR支持。如果已安装mlkitOcr插件则自动使用mlkit，未安装则尝试PaddleOCR（需要修改版AutoJS支持）</tip-block>
    <tip-block>签到功能界面复杂，建议使用PaddleOCR，mlkit-ocr对中文的支持不是特别好，单个数字或者浅色背景下不能准确识别。</tip-block>
    <van-cell title="本地OCR优先级">
      <template #right-icon>
        <van-dropdown-menu active-color="#1989fa" class="cell-dropdown">
          <van-dropdown-item v-model="configs.local_ocr_priority" :options="ocrPriorityOptions" />
        </van-dropdown-menu>
      </template>
    </van-cell>
  </div>
  `
}