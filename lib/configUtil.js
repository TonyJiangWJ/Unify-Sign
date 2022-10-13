
function convertDefaultData (default_config, config_storage_name) {
  let config_storage = storages.create(config_storage_name)
  let configData = {}
  Object.keys(default_config).forEach(key => {
    let storageValue = config_storage.get(key, default_config[key])
    if (storageValue == '') {
      storageValue = default_config[key]
    }
    configData[key] = storageValue
  })
  return configData
}

function getCurrentWorkPath () {
  let currentPath = files.cwd()
  if (files.exists(currentPath + '/main.js')) {
    return currentPath
  }
  let paths = currentPath.split('/')

  do {
    paths = paths.slice(0, paths.length - 1)
    currentPath = paths.reduce((a, b) => a += '/' + b)
  } while (!files.exists(currentPath + '/main.js') && paths.length > 0)
  if (paths.length > 0) {
    return currentPath
  }
}

function readImgDataIfExists (path) {
  if (files.exists(path)) {
    return files.read(path)
  }
  return ''
}

module.exports = {
  convertDefaultData: convertDefaultData,
  getCurrentWorkPath: getCurrentWorkPath,
  readImgDataIfExists: readImgDataIfExists,
}