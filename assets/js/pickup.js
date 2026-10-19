/**
 * Pick Up のスライダー
 * - 7秒ごとに自動で切り替え。一時停止／再生ボタンあり
 * - マウスを乗せている間・キーボードのフォーカス中は一時的に止める
 * - 「動きを減らす」設定では自動送りしない
 * - 表示中以外のスライドは inert（フォーカス・読み上げの対象外）
 */
(function () {
  'use strict';
  var root = document.querySelector('.js-pickup');
  if (!root) { return; }
  var slides = Array.prototype.slice.call(root.querySelectorAll('.p-top-pickup__slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.p-top-pickup__dot'));
  var pauseBtn = root.querySelector('.js-pickup-pause');
  var n = slides.length, idx = 0, hold = false, timer = 0;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paused = !!reduce;

  function show(i) {
    idx = ((i % n) + n) % n;
    slides.forEach(function (s, k) {
      var on = k === idx;
      s.classList.toggle('is-current', on);
      if (on) { s.removeAttribute('inert'); s.removeAttribute('aria-hidden'); } else { s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true'); }
    });
    dots.forEach(function (d, k) { d.setAttribute('aria-current', k === idx ? 'true' : 'false'); });
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(function () { if (!paused && !hold) { show(idx + 1); } }, 7000);
  }
  function setPaused(p) {
    paused = p;
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
      pauseBtn.setAttribute('aria-label', p ? 'スライドの自動再生を再開' : 'スライドの自動再生を一時停止');
    }
  }

  root.querySelector('.js-pickup-prev').addEventListener('click', function () { show(idx - 1); restart(); });
  root.querySelector('.js-pickup-next').addEventListener('click', function () { show(idx + 1); restart(); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); restart(); }); });
  if (pauseBtn) { pauseBtn.addEventListener('click', function () { setPaused(!paused); }); }
  var slider = root.querySelector('.p-top-pickup__slider');
  slider.addEventListener('mouseenter', function () { hold = true; });
  slider.addEventListener('mouseleave', function () { hold = false; });
  slider.addEventListener('focusin', function () { hold = true; });
  slider.addEventListener('focusout', function () { hold = false; });

  setPaused(paused);
  show(0);
  restart();
})();
