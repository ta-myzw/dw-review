/**
 * 下層ページの共通の動き
 * 1) タブ（.js-tabs）：矢印キー・Home/End で切り替え（WAI-ARIA の tabs パターン）
 * 2) 選べるチップ（button.c-chip[aria-pressed]）：押すと選択／解除
 * 3) 下から出るシート（<dialog class="c-sheet">）：[data-sheet-open="id"] で開き、[data-sheet-close] で閉じる
 */
(function () {
  'use strict';

  /* ---------- 1) タブ ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.js-tabs'), function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; }
      });
      if (focus) { tab.focus(); }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') { n = tabs[(i + 1) % tabs.length]; }
        else if (e.key === 'ArrowLeft') { n = tabs[(i - 1 + tabs.length) % tabs.length]; }
        else if (e.key === 'Home') { n = tabs[0]; }
        else if (e.key === 'End') { n = tabs[tabs.length - 1]; }
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    select(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0], false);
  });

  /* ---------- 2) 選べるチップ ---------- */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('button.c-chip[aria-pressed]');
    if (!chip) { return; }
    chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });

  /* ---------- 3) シート ---------- */
  document.addEventListener('click', function (e) {
    var opener = e.target.closest && e.target.closest('[data-sheet-open]');
    if (opener) {
      var d = document.getElementById(opener.getAttribute('data-sheet-open'));
      if (d && d.showModal) {
        d.showModal();
        opener.setAttribute('aria-expanded', 'true');
        d.addEventListener('close', function once() {
          opener.setAttribute('aria-expanded', 'false');
          d.removeEventListener('close', once);
        });
      }
      return;
    }
    var closer = e.target.closest && e.target.closest('[data-sheet-close]');
    if (closer) { var dlg = closer.closest('dialog'); if (dlg) { dlg.close(); } return; }
    // 背景（シートの外）を押したら閉じる
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('c-sheet')) {
      var r = e.target.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) { e.target.close(); }
    }
  });
})();
