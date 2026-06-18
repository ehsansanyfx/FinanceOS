const CACHE_NAME='financeos-v1-6-clean-core';
const ASSETS=['./','./index.html','./manifest.json','./assets/css/styles.css','./assets/js/app.js','./assets/icons/icon-192.svg','./assets/icons/icon-512.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)))});
