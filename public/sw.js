const CACHE_NAME = 'quite-scheduler-v1'
const urlsToCache = [
  '/',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
      })
  )
})

// プッシュ通知受信
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have a scheduled post coming up!',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Post',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/images/xmark.png'
      }
    ]
  }

  let promiseChain = Promise.resolve()
  
  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.icon = data.icon || options.icon
    
    promiseChain = promiseChain.then(() => {
      return self.registration.showNotification(data.title || 'Quite Scheduler', options)
    })
  }

  event.waitUntil(promiseChain)
})

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/schedule')
    )
  } else if (event.action === 'close') {
    // 通知を閉じるだけ
  } else {
    // デフォルトアクション：アプリを開く
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})