/**
 * オープニング
 * - 初回：雫が落ちる（2.2秒）→ ロゴ → 最低3.2秒表示 → 幕が上がる（動画の読み込み待ちは最大4.5秒で打ち切り）
 * - 5分以内の再訪・動きを減らす設定：ロゴを一瞬見せて開く（0.6秒／0.3秒）
 * - スクロール・タップ・キー操作・SKIPボタンで、いつでもすぐ開く
 * 確認用URL：?op=first（初回として再生）／?op=repeat（再訪として再生）
 */
(function () {
  'use strict';
  var ov = document.querySelector('.js-opening');
  if (!ov) { return; }

  var KEY = 'dwOpeningSeenAt';
  var REPEAT_MIN = 5;
  var q = location.search;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = 0;
  try { seen = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) {}
  var repeat = (Date.now() - seen) < REPEAT_MIN * 60 * 1000;
  if (q.indexOf('op=first') !== -1) { repeat = false; }
  if (q.indexOf('op=repeat') !== -1) { repeat = true; }
  try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}

  var comet = ov.querySelector('.p-opening__comet');
  var logo = ov.querySelector('.p-opening__logo');
  var skip = ov.querySelector('.p-opening__skip');
  var page = document.querySelectorAll('body > header, body > main, body > footer, .c-skip-link');
  var opened = false;
  var timers = [];

  // 幕が閉じている間は、背面のリンクにフォーカスが入らないようにする
  Array.prototype.forEach.call(page, function (el) { el.setAttribute('inert', ''); });
  var prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  try { window.scrollTo(0, 0); } catch (e) {}

  function open() {
    if (opened) { return; }
    opened = true;
    timers.forEach(clearTimeout);
    ov.classList.add('is-done');
    document.body.style.overflow = prevOverflow || '';
    Array.prototype.forEach.call(page, function (el) { el.removeAttribute('inert'); });
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, open); });
    document.dispatchEvent(new CustomEvent('dw:opened'));
    setTimeout(function () { if (ov.parentNode) { ov.parentNode.removeChild(ov); } }, 1200);
  }

  ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.addEventListener(ev, open, { passive: true }); });
  ov.addEventListener('click', open);
  if (skip) { skip.addEventListener('click', open); }

  if (reduce || repeat) {
    if (comet) { comet.style.display = 'none'; }
    if (logo) { logo.classList.add('is-quick', 'is-shown'); }
    timers.push(setTimeout(open, reduce ? 300 : 600));
    return;
  }

  if (comet) { comet.classList.add('is-falling'); }
  timers.push(setTimeout(function () { if (logo) { logo.classList.add('is-shown'); } }, 1050));

  var vids = Array.prototype.slice.call(document.querySelectorAll('.js-hero-video'));
  var start = Date.now(), MIN = 3200, MAX = 4500;
  function ready() { return !vids.length || vids.every(function (v) { return v.readyState >= 3; }); }
  (function tick() {
    if (opened) { return; }
    var el = Date.now() - start;
    if ((el >= MIN && ready()) || el >= MAX) { open(); return; }
    timers.push(setTimeout(tick, 120));
  })();
})();
