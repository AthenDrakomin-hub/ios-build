/* ------------------------------------------------------------------
 * Service Worker：离线壳 + 静态资源缓存
 *
 * 策略：
 *  - 导航请求（HTML）：network-first，断网回退到缓存的壳
 *  - 同源静态资源（js/css/图片/字体）：stale-while-revalidate
 *  - /api 一律不缓存，直接走网络（金融数据不能读旧值）
 *
 * 版本：改 SW 内容时把 VERSION 加一，旧缓存会在 activate 阶段清掉。
 * ------------------------------------------------------------------ */

const VERSION = 'v1'
const SHELL_CACHE = `rvs-shell-${VERSION}`
const ASSET_CACHE = `rvs-asset-${VERSION}`

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-512.png',
  '/ios/splash-1170x2532.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('rvs-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // 跨域、API、socket 一律放过
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) return

  // 导航：优先网络，失败回退壳
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL_CACHE).then((c) => c.put('/index.html', copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || Response.error())),
    )
    return
  }

  // 静态资源：先给缓存，同时后台更新
  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone()).catch(() => {})
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
