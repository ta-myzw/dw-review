/**
 * プラン詳細の「めぐるルート」の地図（Leaflet＋国土地理院の白地図。ピンと点線が目立つよう、道路や等高線のない地図にする）
 * - .js-route-map の data-stops（[{n, name, lat, lng}]）から、立ち寄る順の番号ピンと、順番を結ぶ線を描く
 * - 1番（出発）と最後（到着）が同じ場所のときは「発着」のピンを1つにまとめ、線は出発地へ戻す
 * - ピンはTabで止まらない（地図の下の一覧で同じ情報を読める）
 * - 地図が出せないとき（Leaflet や地理院タイルが読めない）は地図の枠ごと隠し、一覧だけにする
 */
(function () {
  'use strict';
  var el = document.querySelector('.js-route-map');
  if (!el) { return; }
  var stops = [];
  try { stops = JSON.parse(el.getAttribute('data-stops')) || []; } catch (e) { stops = []; }
  if (stops.length < 2) { el.classList.add('is-fallback'); return; }

  function fallback() { el.classList.add('is-fallback'); el.innerHTML = ''; }

  var tries = 0;
  (function build() {
    if (!window.L) { if (tries++ < 60) { setTimeout(build, 150); } else { fallback(); } return; }
    var L = window.L;
    var map = L.map(el, { maxZoom: 14, scrollWheelZoom: false, zoomSnap: 0.25, zoomDelta: 0.5 });
    var tiles = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png', {
      attribution: "出典：<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank' rel='noopener'>国土地理院</a>",
      maxZoom: 14   // 白地図は ズーム5〜14 まで
    }).addTo(map);
    var loaded = 0, errors = 0, gone = false;
    function giveUp() { if (gone || loaded) { return; } gone = true; map.remove(); fallback(); }
    tiles.on('tileload', function () { loaded++; });
    tiles.on('tileerror', function () { if (++errors >= 4) { giveUp(); } });
    setTimeout(giveUp, 8000);

    var pts = stops.map(function (s) { return [s.lat, s.lng]; });
    // 順番を結ぶ線（出発地へ戻る）
    L.polyline(pts.concat([pts[0]]), { color: '#386A76', weight: 2, opacity: .7, dashArray: '4 6' }).addTo(map);
    stops.forEach(function (s, i) {
      var end = i === 0;
      var label = end ? '発着' : String(s.n);
      var icon = L.divIcon({ className: '', html: '<span class="c-route-pin' + (end ? ' is-end' : '') + '">' + label + '</span>', iconSize: end ? [40, 28] : [28, 28], iconAnchor: end ? [20, 14] : [14, 14] });
      L.marker([s.lat, s.lng], { icon: icon, title: (end ? '出発・到着：' : s.n + '．') + s.name, keyboard: false }).addTo(map);
    });
    map.fitBounds(pts, { padding: [36, 36] });
    setTimeout(function () { map.invalidateSize(); }, 200);
    var zin = el.querySelector('.leaflet-control-zoom-in'), zout = el.querySelector('.leaflet-control-zoom-out');
    if (zin) { zin.setAttribute('title', '拡大'); zin.setAttribute('aria-label', '地図を拡大'); }
    if (zout) { zout.setAttribute('title', '縮小'); zout.setAttribute('aria-label', '地図を縮小'); }
  })();
})();
