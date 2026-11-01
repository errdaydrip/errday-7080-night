// 설치(홈 화면 앱)용 최소 서비스워커: 캐시하지 않고 그대로 네트워크로 보냄
self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
