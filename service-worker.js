// 캐시 이름 정의. 버전이 바뀌면 이 값을 변경해야 합니다.
const CACHE_NAME = 'pe-helper-cache-v1';
// 앱을 오프라인으로 실행하기 위해 캐시할 파일 목록
const urlsToCache = [
    '/',
    'index.html'
];

// 서비스 워커 설치 이벤트
self.addEventListener('install', event => {
    // waitUntil()은 설치가 완료될 때까지 기다립니다.
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // urlsToCache에 명시된 모든 파일을 캐시에 추가합니다.
                return cache.addAll(urlsToCache);
            })
    );
});

// 서비스 워커 활성화 이벤트 (오래된 캐시 정리)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 화이트리스트에 없는 캐시는 삭제합니다.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기 이벤트
self.addEventListener('fetch', event => {
    event.respondWith(
        // event.request에 해당하는 캐시된 응답이 있는지 확인합니다.
        caches.match(event.request)
            .then(response => {
                // 캐시에 응답이 있으면 캐시된 값을 반환합니다.
                if (response) {
                    return response;
                }
                // 캐시에 없으면 네트워크를 통해 요청을 보냅니다.
                return fetch(event.request);
            }
        )
    );
});
