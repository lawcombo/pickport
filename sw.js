// /pickport/sw.js
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
// 최소 존재만으로도 PWA 설치 요건 충족. (나중에 캐싱 전략 추가 가능)
self.addEventListener('fetch', (e) => {});
