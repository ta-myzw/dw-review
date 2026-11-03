/**
 * エリアのイラスト地図（parts/area-illust.svg）と、市町村の一覧（.js-area-chip）をつなぐ
 * - 地図の町（形・ピン）にマウスを乗せると、一覧の同じ町も光る。逆も同じ
 * - 地図の町の形を押すと、その町のページへ（ピンはリンク。キーボードでは一覧から同じ操作ができるので、地図はTabで止めない）
 */
(function () {
  'use strict';
  var map = document.querySelector('.js-area-map');
  if (!map) { return; }
  function all(name) {
    return Array.prototype.slice.call(document.querySelectorAll('.js-area-chip[data-town="' + name + '"], .js-area-map [data-town="' + name + '"]'));
  }
  function hl(name, on) { all(name).forEach(function (el) { el.classList.toggle('is-hl', on); }); }
  Array.prototype.forEach.call(document.querySelectorAll('.js-area-map [data-town], .js-area-chip'), function (el) {
    var n = el.getAttribute('data-town');
    el.addEventListener('mouseenter', function () { hl(n, true); });
    el.addEventListener('mouseleave', function () { hl(n, false); });
    if (el.classList.contains('js-area-chip')) {
      el.addEventListener('focus', function () { hl(n, true); });
      el.addEventListener('blur', function () { hl(n, false); });
    }
  });
  // 町の形を押したら、同じ町のピンのリンク先へ
  Array.prototype.forEach.call(map.querySelectorAll('.areas [data-town]'), function (p) {
    p.addEventListener('click', function () {
      var a = map.querySelector('.c-area-illust__pin[data-town="' + p.getAttribute('data-town') + '"]');
      if (a) { location.href = a.getAttribute('href'); }
    });
  });
})();
