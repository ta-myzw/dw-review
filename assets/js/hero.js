/**
 * ヒーローの動画
 * - 一時停止／再生ボタン（2本の動画をまとめて止める）
 * - 「動きを減らす」設定では最初から停止
 * - 自動再生が止められた環境でも、ループと再生を確実にする
 */
(function () {
  'use strict';
  var vids = Array.prototype.slice.call(document.querySelectorAll('.js-hero-video'));
  var btn = document.querySelector('.js-hero-pause');
  if (!vids.length) { return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paused = false;

  function play(v) { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } }
  function set(pause) {
    paused = pause;
    vids.forEach(function (v) { if (pause) { v.pause(); } else { play(v); } });
    if (btn) {
      btn.setAttribute('aria-pressed', pause ? 'true' : 'false');
      btn.setAttribute('aria-label', pause ? '背景動画を再生' : '背景動画を一時停止');
    }
  }
  vids.forEach(function (v) {
    v.muted = true; v.loop = true; v.playsInline = true;
    v.addEventListener('ended', function () { if (!paused) { v.currentTime = 0; play(v); } });
  });
  if (btn) { btn.addEventListener('click', function () { set(!paused); }); }
  set(!!reduce);
})();
