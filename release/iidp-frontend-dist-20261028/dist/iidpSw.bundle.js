self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  self.skipWaiting() // Activate immediately
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  event.waitUntil(self.clients.claim()) // Take control of all clients immediately
})

const CACHE_NAME = 'iidp-sw-cache-v1'

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const umdCompsIndex = url.pathname.indexOf('/umdComps')
  let path = null
  if (umdCompsIndex !== -1) {
    path = url.pathname.substring(umdCompsIndex)
  }
  // 匹配资源合并数组中存在的请求
  if (
    path &&
    (url.pathname.endsWith('js') ||
      url.pathname.indexOf('js?') !== -1 ||
      url.pathname.endsWith('.css') ||
      url.pathname.indexOf('.css?') !== -1)
  ) {
    event.respondWith(
      (async () => {
        try {
          // console.time('sw js文件url.pathname == ' + url.pathname)
          const cache = await caches.open(CACHE_NAME)
          const cachedResponse = await cache.match(path)
          if (cachedResponse) {
            // console.timeEnd('sw js文件url.pathname == ' + url.pathname)
            return cachedResponse
          }
          return fetch(event.request)
        } catch (error) {
          console.error('Fetch error in SW:', error)
          return fetch(event.request)
        }
      })()
    )
  }
})

self.addEventListener('message', async (event) => {
  // 确保消息来自客户端
  if (!event.source || !event.source.id) {
    return
  }
  const { id, type, data, options } = event.data
  try {
    switch (type) {
      case 'SW_CONCAT_PATHS':
        // 等待所有循环和接口执行完成
        await swConcatPaths(data.paths, options, event)
        // console.log('##########result')
        // 所有操作完成后，发送响应回客户端
        event.source.postMessage({
          id,
          result: 'cached'
        })
        break
    }
  } catch (error) {
    event.source.postMessage({
      id,
      error: error.message
    })
  }
})

// 路径处理
async function swConcatPaths(arrObj, options, event) {
  const { baseUrl, concatLoadAppsJsNumber } = options
  const jsChunkSize = concatLoadAppsJsNumber || 8 // js最多一次请求多少个
  const otherChunkSize = 30 // 非js最多一次请求多少个
  const cache = await caches.open(CACHE_NAME)

  for (let n = 0; n < arrObj.length; n++) {
    let reqInfo = arrObj[n].type === 'js' ? 'appsJsReq' : 'appsCssReq'
    let apiPre = '/concatResource?info=' + reqInfo
    // 将各种时间格式转换为时间戳数字进行比较
    const parseTimeToTimestamp = (val) => {
      // null/undefined 转为 0
      if (val === null || val === undefined) {
        return 0
      }
      // 字符串处理
      if (typeof val === 'string') {
        let str = val.trim()
        // 空字符串转为 0
        if (!str) {
          return 0
        }
        // 先解码URL编码（如 2026-01-4%2010%3A17%3A17）
        try {
          str = decodeURIComponent(str)
        } catch (e) {
          // 解码失败则保持原值
        }
        // 如果是纯数字字符串（时间戳），直接转数字
        if (/^\d+$/.test(str)) {
          return Number(str)
        }
        // 尝试解析日期字符串（如 2026-01-4 10:17:17）
        const timestamp = new Date(str).getTime()
        return isNaN(timestamp) ? 0 : timestamp
      }
      // 数字直接返回
      if (typeof val === 'number') {
        return isNaN(val) ? 0 : val
      }
      return 0
    }

    let time = 0
    if (Object.prototype.toString.call(arrObj[n].time) === '[object Array]') {
      try {
        // 转换为时间戳数组并取最大值
        const timestamps = arrObj[n].time.map(parseTimeToTimestamp)
        time = Math.max(...timestamps, 0)
      } catch (e) {
        console.log(' === sw parse time error === ', e)
        time = 0
      }
    } else {
      time = parseTimeToTimestamp(arrObj[n].time)
    }
    let reqPaths = []
    try {
      reqPaths = arrObj[n].paths
        .map((url) => {
          const umdCompsIndex = url.indexOf('/umdComps')
          if (umdCompsIndex === -1) {
            console.warn(`未找到 /umdComps: ${url}`)
            return url // 返回原字符串或根据需求处理
          }
          return url.substring(umdCompsIndex)
        })
        .reduce((chunks, item, index) => {
          const chunkIndex = Math.floor(
            index / (arrObj[n].type === 'js' ? jsChunkSize : otherChunkSize)
          )
          if (!chunks[chunkIndex]) {
            chunks[chunkIndex] = []
          }
          chunks[chunkIndex].push(item)
          return chunks
        }, [])
    } catch (error) {
      console.error('Error in swConcatPaths path processing:', error)
      throw new Error(`路径处理失败: ${error.message}`)
    }
    // 将每个 chunk 的请求封装成 Promise
    const fetchPromises = reqPaths.map((paths, idx) =>
      (async () => {
        const reqUrl =
          baseUrl + apiPre + '&type=' + arrObj[n].type + '&t=' + time + '&files=' + paths.join(',')
        try {
          const response = await fetch(reqUrl)
          if (!response.ok) {
            throw new Error(`请求失败: ${response.status} ${response.statusText}`)
          }
          const responseText = await response.text()
          // 按照 /*--custom-tech-split--*/ 分割内容
          const splitContent = responseText.split('/*--custom-tech-split--*/')

          const cachePromises = []
          for (let j = 0; j < splitContent.length; j++) {
            const pathKey = paths[j]
            const content = '\n/* from sw */\n' + splitContent[j]
            const headers = {
              'Content-Type': pathKey.endsWith('.css') ? 'text/css' : 'application/javascript'
            }
            const newResponse = new Response(content, {
              status: 200,
              statusText: 'OK',
              headers: headers
            })
            cachePromises.push(cache.put(pathKey, newResponse))
          }
          await Promise.all(cachePromises)
          // postmessage通知出去 当前项js可以eval  断开eval出去因为css还没建好sw缓存
          // event.source.postMessage({
          //   evalPaths: paths
          // })
          return { status: 'fulfilled', value: paths }
        } catch (error) {
          console.error('Error in swConcatPaths fetch:', error)
          return {
            status: 'rejected',
            reason: new Error(`资源请求失败 (${paths.join(',')}): ${error.message}`)
          }
        }
      })()
    )

    // 等待所有请求完成（无论成功或失败）
    const results = await Promise.allSettled(fetchPromises)

    // 收集失败的请求并抛出错误
    const failures = results
      .map((r, idx) => (r.status === 'rejected' ? r.reason : null))
      .filter(Boolean)
    if (failures.length > 0) {
      throw new Error(failures.map((f) => f.message).join('; '))
    }
  }
}
