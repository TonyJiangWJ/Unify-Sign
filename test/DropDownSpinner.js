/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-09 20:42:08
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-08-01 08:36:09
 * @Description: 
 */
// 'ui';

importClass(android.text.TextWatcher)
importClass(android.widget.AdapterView)
importClass(android.view.View)
importClass(android.view.MotionEvent)


let TextWatcherBuilder = function (textCallback) {
  return new TextWatcher({
    onTextChanged: (text) => {
      textCallback(text + '')
    },
    beforeTextChanged: function (s) { },
    afterTextChanged: function (s) { }
  })
}

let SpinnerItemSelectedListenerBuilder = function (selectedCallback) {
  return new AdapterView.OnItemSelectedListener({
    onItemSelected: function (parentView, selectedItemView, position, id) {
      selectedCallback(position)
    },
    onNothingSelected: function (parentView) { }
  })
}

setTimeout(function () {
  let start = new Date().getTime()
  let window = floaty.window(
    <ScrollView w="300" h="500">
      <vertical padding="24 0">
        {/* 是否在收取到了一定阈值后自动浇水10克 */}
        <horizontal gravity="center">
          <text text="浇水数量" textSize="14sp" />
          <spinner id="ui_spiner" entries="10|18|33|66" />
        </horizontal>
      </vertical>
    </ScrollView>
  )
  window.ui_spiner.setOnItemSelectedListener(
    SpinnerItemSelectedListenerBuilder(position => {
      let chose = [10, 18, 33, 66][position]
      toastLog('chosen: ' + position + ' ' + chose)
    })
  )

  let mItems = ['1', '2', '3', '4', '5']
  // 建立Adapter并且绑定数据源
  let adapter = android.widget.ArrayAdapter(context, android.R.layout.simple_spinner_item, mItems);
  adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
  //绑定 Adapter到控件
  window.ui_spiner.setAdapter(adapter);
}, 300)

setInterval(function () {
  //
}, 1000)
