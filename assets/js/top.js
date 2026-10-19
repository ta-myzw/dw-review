/**
 * トップページの小さな機能
 * 1) 季節のおすすめ：今日の日付から季節を判定して先頭に並べ、「いまの季節」を付ける
 *    確認用URL：?season=spring / summer / autumn / winter
 * 2) スマホの横スクロール（物語・人物）：位置を示す点を付ける
 */
(function () {
  'use strict';

  /* ---------- 1) いまの季節 ---------- */
  var grid = document.querySelector('.js-seasons');
  if (grid) {
    var m = new Date().getMonth() + 1;
    try {
      var q = new URLSearchParams(location.search).get('season');
      if (q) { m = { spring: 4, summer: 7, autumn: 10, winter: 1 }[q] || m; }
    } catch (e) {}
    var order = ['spring', 'summer', 'autumn', 'winter'];
    var cur = (m >= 3 && m <= 5) ? 0 : (m >= 6 && m <= 8) ? 1 : (m >= 9 && m <= 11) ? 2 : 3;
    var cards = {};
    Array.prototype.forEach.call(grid.querySelectorAll('.js-season'), function (c) { cards[c.getAttribute('data-season')] = c; });
    order.slice(cur).concat(order.slice(0, cur)).forEach(function (k) { if (cards[k]) { grid.appendChild(cards[k]); } });
    var now = cards[order[cur]] && cards[order[cur]].querySelector('.c-season-card__now');
    if (now) { now.hidden = false; }
  }

  /* ---------- 2) 横スクロールの点 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.js-hscroll'), function (box) {
    var items = Array.prototype.slice.call(box.children);
    var dots = document.createElement('div');
    dots.className = 'c-hdots';
    dots.setAttribute('aria-hidden', 'true');
    items.forEach(function () { dots.appendChild(document.createElement('i')); });
    box.parentNode.insertBefore(dots, box.nextSibling);
    function update() {
      var w = items[0] ? items[0].getBoundingClientRect().width + 14 : 1;
      var i = Math.round(box.scrollLeft / w);
      if (box.scrollLeft + box.clientWidth >= box.scrollWidth - 4) { i = items.length - 1; }
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === i); });
    }
    box.addEventListener('scroll', update, { passive: true });
    update();
  });
})();
