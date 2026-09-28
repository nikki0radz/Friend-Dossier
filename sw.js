const CACHE='friend-dossier-v17';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './app-icon.svg',
  './style.css',
  './splash.css',
  './editor-polish.css',
  './app.js',
  './emoji-frames.js',
  './profile-customization.js',
  './home-polish.js',
  './person-experience.js',
  './person-landing-actions.js',
  './dossier-magic.js',
  './magical-transitions.js',
  './category-dividers.js',
  './dossier-finishing.js',
  './magic-intensify.js',
  './colour-studio-v2.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const isNavigation=event.request.mode==='navigate';
  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request).then(cached=>cached||(isNavigation?caches.match('./index.html'):undefined)))
  );
});
