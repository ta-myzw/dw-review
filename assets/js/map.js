/**
 * エリアマップ（Leaflet＋国土地理院タイル）
 * - 10市町村のピン。ピンに乗せると一覧のカードも光り、押すとその市町村のページへ
 * - 一覧のカードにホバー・フォーカスすると、地図の該当ピンを強調
 * - ピンはTabで止まらない（代わりに地図の下の一覧で同じ操作ができる）
 */
(function () {
  'use strict';
  var el = document.querySelector('.js-area-map');
  if (!el) { return; }

  var TOWNS = [
    { name: '日吉津村', lat: 35.4338, lng: 133.3869, dir: 'top' },
    { name: '米子市', lat: 35.4281, lng: 133.3311, dir: 'left' },
    { name: '境港市', lat: 35.5403, lng: 133.2308 },
    { name: '大山町', lat: 35.4503, lng: 133.5006, dir: 'right' },
    { name: '伯耆町', lat: 35.3672, lng: 133.4356, dir: 'right' },
    { name: '南部町', lat: 35.3308, lng: 133.3506, dir: 'left' },
    { name: '江府町', lat: 35.2997, lng: 133.4894 },
    { name: '日野町', lat: 35.2306, lng: 133.4292 },
    { name: '日南町', lat: 35.1172, lng: 133.3108 },
    { name: '倉吉市', lat: 35.4300, lng: 133.8258 }
  ];
  var LABEL_POS = {
    left: 'top:-2px;right:14px;text-align:right;',
    right: 'top:-2px;left:14px;',
    top: 'top:-22px;left:50%;transform:translateX(-50%);',
    center: 'top:16px;left:50%;transform:translateX(-50%);'
  };

  function chip(name) { return document.querySelector('.js-area-chip[data-town="' + name + '"]'); }
  function marker(name) { return el.querySelector('.c-map-marker[data-town="' + name + '"]'); }
  function hl(name, on) {
    var m = marker(name), c = chip(name);
    if (m) { m.classList.toggle('is-hl', on); if (m.parentNode) { m.parentNode.style.zIndex = on ? 1000 : ''; } }
    if (c) { c.classList.toggle('is-hl', on); }
  }

  var tries = 0;
  (function build() {
    if (!window.L) { if (tries++ < 60) { setTimeout(build, 150); } return; }
    var L = window.L;
    var map = L.map(el, { scrollWheelZoom: false, attributionControl: true, zoomControl: true, zoomSnap: 0.25, zoomDelta: 0.5 });
    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
      attribution: "出典：<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank' rel='noopener'>国土地理院</a>",
      maxZoom: 18
    }).addTo(map);
    var pane = map.getPane('tilePane');
    if (pane) { pane.style.filter = 'grayscale(1) contrast(.9) brightness(1.06)'; }
    var pts = [];
    TOWNS.forEach(function (t) {
      var html = '<div class="c-map-marker" data-town="' + t.name + '"><span class="ring"></span><span class="dot"></span></div>' +
        '<div class="c-map-label" style="position:absolute;' + LABEL_POS[t.dir || 'center'] + '">' + t.name + '</div>';
      var icon = L.divIcon({ className: '', html: html, iconSize: [16, 16], iconAnchor: [8, 8] });
      var mk = L.marker([t.lat, t.lng], { icon: icon, title: t.name, keyboard: false }).addTo(map);
      mk.on('click', function () { var c = chip(t.name); if (c) { location.href = c.getAttribute('href'); } });
      mk.on('mouseover', function () { hl(t.name, true); });
      mk.on('mouseout', function () { hl(t.name, false); });
      pts.push([t.lat, t.lng]);
    });
    map.fitBounds(pts, { paddingTopLeft: [40, 30], paddingBottomRight: [40, 40] });
    map.setMaxBounds(L.latLngBounds(pts).pad(0.6));
    map.setMinZoom(Math.max(7, map.getZoom() - 1));
    setTimeout(function () { map.invalidateSize(); }, 200);
    // 地図の拡大・縮小ボタンを日本語に
    var zin = el.querySelector('.leaflet-control-zoom-in'), zout = el.querySelector('.leaflet-control-zoom-out');
    if (zin) { zin.setAttribute('title', '拡大'); zin.setAttribute('aria-label', '地図を拡大'); }
    if (zout) { zout.setAttribute('title', '縮小'); zout.setAttribute('aria-label', '地図を縮小'); }
  })();

  Array.prototype.forEach.call(document.querySelectorAll('.js-area-chip'), function (c) {
    var n = c.getAttribute('data-town');
    c.addEventListener('mouseenter', function () { hl(n, true); });
    c.addEventListener('mouseleave', function () { hl(n, false); });
    c.addEventListener('focus', function () { hl(n, true); });
    c.addEventListener('blur', function () { hl(n, false); });
  });
})();
