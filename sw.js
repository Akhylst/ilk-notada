// Çevrimdışı açılış (PWA), üç sitede aynı dosya: sayfa önce ağdan (güncel kalsın), ağ yoksa önbellekten; simge, manifest ve Google yazı
// tipleri önbellekten. Ses dosyalarına dokunmaz: iPhone <audio> kısmi istek (Range) ister, önbellekten tam yanıt sesi bozabilir.
// Kökteki kopya (kapsamı "/") yalnız kendi sayfasına karışır; önbellek adları siteye göre ayrı (biri ötekinin önbelleğini silmez)
const KOK = new URL("./", location).pathname, ON = "kabuk|" + KOK + "|", ONBELLEK = ON + "1";
const KABUK = ["./", "manifest.webmanifest", "ikon-192.png", "ikon-512.png", "ikon-180.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(KABUK)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys()
  .then(L => Promise.all(L.filter(k => k.startsWith(ON) && k !== ONBELLEK).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (r.mode === "navigate") {
    if (u.origin !== location.origin || (u.pathname !== KOK && u.pathname !== KOK + "index.html")) return;
    e.respondWith(fetch(r).then(y => { if (y.ok) { const k = y.clone(); caches.open(ONBELLEK).then(c => c.put("./", k)); } return y; })
      .catch(() => caches.match("./", { cacheName: ONBELLEK }).then(y => y || Response.error())));
    return;
  }
  const yazi = /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  const kabuk = u.origin === location.origin && u.pathname.startsWith(KOK) && /^(manifest\.webmanifest|ikon-\d+\.png)$/.test(u.pathname.slice(KOK.length));
  if (!yazi && !kabuk) return;
  e.respondWith(caches.match(r, { cacheName: ONBELLEK }).then(v => v || fetch(r).then(y => {
    if (y.ok || y.type === "opaque") { const k = y.clone(); caches.open(ONBELLEK).then(c => c.put(r, k)); }
    return y;
  })));
});
