// 캐시 버전 — 배포할 때마다 숫자를 올리세요! (안 올리면 옛 화면이 남아요)
const CACHE = 'kkoma-dic-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// 설치: 앱 파일 미리 저장
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 활성화: 옛 캐시 정리
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API 호출은 캐시하지 않음 (항상 네트워크)
  if (url.pathname.startsWith('/api/')) {
    return; // 브라우저 기본 처리 = 네트워크로 직접
  }

  // 그 외(앱 파일): 캐시 우선, 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
