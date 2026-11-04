// Nhà Mình – service worker: chạy offline, tự cập nhật ở lần mở sau
const CACHE = 'nha-minh-v1793763835';
const SHELL = ['./', './index.html', './exceljs.min.js', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png', ...['an-uong','con-cai','dich-vu-sinh-hoat','di-lai','qua-tang','mua-sam','y-te','giao-duc','giai-tri','nha-o','hoa-don','tiet-kiem','du-lich','luong','dau-tu','lam-dep','thu-cung','the-thao','cong-viec','khac'].map(s => './icons/' + s + '.webp')];

self.addEventListener('install', e => {
  // cache:'reload' để luôn lấy tệp mới từ máy chủ, không dùng bản cũ trong bộ nhớ tạm của trình duyệt
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Lấy từ cache trước cho nhanh, đồng thời tải bản mới về cho lần sau (gồm cả font Google)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ok = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!ok) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: url.origin === location.origin});
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});

// Mimi nhắc: bấm vào thông báo thì mở app và đưa tới đúng việc cần làm
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const go = (e.notification.data && e.notification.data.go) || 'home';
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(cs => {
    const c = cs[0];
    if (c) { c.postMessage({mimiGo:go}); return c.focus(); }
    return self.clients.openWindow('./#mimi=' + encodeURIComponent(go));
  }));
});
