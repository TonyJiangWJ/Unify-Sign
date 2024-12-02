function openSignPage () {
  let url = 'openapp.jdmobile://virtual?params=' + encodeURIComponent(buildParams())
  console.log('url:', url)
  app.startActivity({
    action: 'android.intent.action.VIEW',
    data: url,
    packageName: 'com.jingdong.app.mall'
  })
}

function buildUrlParams () {
  let params = [
    'commontitle=no',
    'transparent=1',
    'has_native=0',
    '_ts=' + new Date().getTime(),
    // 'utm_user=plusmember',
    // 'gx=RnAoFNvDvpxGHheQeSnihXDdWirjP_lfCFEYixY',
    // 'gxd=RnAoy2FdYDaPyM5EqI1xXgjvwH1850Q',
    'ad_od=share',
    'utm_source=androidapp',
    'utm_medium=appshare',
    'utm_campaign=t_335139774',
    'utm_term=Wxfriends'
  ]
  console.log('url params:', JSON.stringify(params))
  return params.join('&')
}


function buildParams () {
  let params = {
    "category": "jump",
    "des": "m",
    "sourceValue": "babel-act",
    "sourceType": "babel",
    "url": "https://pro.m.jd.com/mall/active/Md9FMi1pJXg2q7qc8CmE9FNYDS4/index.html?" + buildUrlParams(),
    // "url": "https://pro.m.jd.com/mall/active/Md9FMi1pJXg2q7qc8CmE9FNYDS4/index.html?commontitle=no&transparent=1&has_native=0&_ts=1695884109640&utm_user=plusmember&gx=RnAoFNvDvpxGHheQeSnihXDdWirjP_lfCFEYixY&gxd=RnAoy2FdYDaPyM5EqI1xXgjvwH1850Q&ad_od=share&utm_source=androidapp&utm_medium=appshare&utm_campaign=t_335139774&utm_term=Wxfriends",
    "M_sourceFrom": "H5",
    "msf_type": "click",
    "m_param": {
      // // "m_source": "0",
      // // "event_series": {},
      // //"jda": "122270672.16958841235771574046910.1695884123.1695884123.1695884123.1",
      "usc": "androidapp",
      "ucp": "t_335139774",
      "umd": "appshare",
      "utr": "Wxfriends",
      // // "jdv": "122270672|androidapp|t_335139774|appshare|Wxfriends|1695884123579",
      // // "ref": "https://pro.m.jd.com/mall/active/Md9FMi1pJXg2q7qc8CmE9FNYDS4/index.html?commontitle=no&transparent=1&has_native=0&_ts=1695884109640&utm_user=plusmember&gx=RnAoFNvDvpxGHheQeSnihXDdWirjP_lfCFEYixY&gxd=RnAoy2FdYDaPyM5EqI1xXgjvwH1850Q&ad_od=share&utm_source=androidapp&utm_medium=appshare&utm_campaign=t_335139774&utm_term=Wxfriends",
      "psn": "16958841235771574046910|1",
      "psq": 1,
      // // "unpl": "",
      // // "pc_source": "",
      "mba_muid": "16958841235771574046910",
      "mba_sid": "16958841235902758310971131663",
      "std": "MO-J2011-1",
      // // "par": "commontitle=no&transparent=1&has_native=0&_ts=1695884109640&utm_user=plusmember&gx=RnAoFNvDvpxGHheQeSnihXDdWirjP_lfCFEYixY&gxd=RnAoy2FdYDaPyM5EqI1xXgjvwH1850Q&ad_od=share&utm_source=androidapp&utm_medium=appshare&utm_campaign=t_335139774&utm_term=Wxfriends",
      "event_id": "Babel_LeavepageExpo",
      // "mt_xid": "",
      // "mt_subsite": "",
      // // "YINLIUhuanqi": "https://pro.m.jd.com/mall/active/Md9FMi1pJXg2q7qc8CmE9FNYDS4/index.html?commontitle=no&transparent=1&has_native=0&_ts=1695884109640&utm_user=plusmember&gx=RnAoFNvDvpxGHheQeSnihXDdWirjP_lfCFEYixY&gxd=RnAoy2FdYDaPyM5EqI1xXgjvwH1850Q&ad_od=share&utm_source=androidapp&utm_medium=appshare&utm_campaign=t_335139774&utm_term=Wxfriends"
    },
    /*
    // "SE": {
    //   "mt_subsite": "",
    //   "__jdv": "122270672|androidapp|t_335139774|appshare|Wxfriends|1695884123579",
    //   "unpl": "",
    //   "__jda": "122270672.16958841235771574046910.1695884123.1695884123.1695884123.1"
    // }
    */
  }

  return JSON.stringify(params)
}
openSignPage()