const CACHE_NAME = "my-site-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
    '/',
    './index.html',
    './manifest.json',
    './js/idb.js',
    './js/index.js',
    './service-worker.js',
    './assets/css/styles.css',
    './assets/images/icons/icon-72x72.png',
    './assets/images/icons/icon-96x96.png',
    './assets/images/icons/icon-128x128.png',
    './assets/images/icons/icon-144x144.png',
    "./assets/images/icons/icon-152x152.png",
    "./assets/images/icons/icon-192x192.png",
    "./assets/images/icons/icon-384x384.png",
    "./assets/images/icons/icon-512x512.png",
];

self.addEventListener('install', function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Your files have been successfully pre-cached!');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(evt) {
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cached data now', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
})

self.addEventListener('fetch', function(evt) {
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then((cache) => {
                    return fetch(evt.request)
                        .then((response) => {
                            //if response is OK, clone and cache
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err => {
                            //if network request fails, pull data from the cache
                            return cache.match(evt.request);
                        });
                })
                .catch(err => console.log(err))
        );
        return
    }
    evt.respondWith(
        fetch(evt.request).catch(function() {
            return caches.match(evt.request).then(function (response) {
                if (response) {
                    return response;
                } else if (evt.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/');
                }
            });
        })
    );
});