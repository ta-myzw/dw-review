/**
 * ヘッダー
 * 1) メガメニュー（PC）
 *    - ホバー0.15秒で開く／離れて0.25秒で閉じる。開いている間に隣の項目へ移ると、閉じずにその場で切り替える
 *    - クリック・Enter・Spaceで開閉、↓で開いて最初のリンクへ、Escで閉じてボタンへ戻る
 *    - 開いたボタンからTabでパネル内へ、パネル末尾からTabで次のナビ項目へ
 *    - エリアの一覧にホバー・フォーカスすると、地図の該当市町村を強調
 * 2) スマホメニュー（ハンバーガー）
 *    - 開閉状態を aria-expanded で伝え、閉じている間は inert（フォーカスが入らない）
 *    - 開くと閉じるボタンへ、閉じるとハンバーガーへフォーカスを戻す。Escで閉じる。メニュー内でフォーカスを循環
 */
(function () {
  'use strict';
  var header = document.querySelector('.js-header');
  if (!header) { return; }

  /* ---------- 1) メガメニュー ---------- */
  var triggers = Array.prototype.slice.call(header.querySelectorAll('.c-gnav__trigger'));
  var navItems = Array.prototype.slice.call(header.querySelectorAll('.js-gnav > a, .js-gnav > button'));
  var openKey = null, tOpen = 0, tClose = 0;

  function panel(k) { return document.getElementById('mega-' + k); }
  function trigger(k) { return header.querySelector('[data-mega="' + k + '"]'); }
  function links(p) { return Array.prototype.slice.call(p.querySelectorAll('a')); }

  function close() {
    if (!openKey) { return; }
    var p = panel(openKey), t = trigger(openKey);
    if (t) { t.setAttribute('aria-expanded', 'false'); }
    if (p) { p.classList.remove('is-open'); }
    header.classList.remove('is-mega-open');
    openKey = null;
  }

  function open(k) {
    if (openKey === k) { return; }
    var p = panel(k), t = trigger(k);
    if (!p || !t) { return; }
    if (openKey) {
      // 別のパネルが開いている → 閉じずに中身だけ切り替える（チラつき防止）
      var op = panel(openKey), ot = trigger(openKey);
      if (ot) { ot.setAttribute('aria-expanded', 'false'); }
      if (op) { op.classList.add('is-swap'); op.classList.remove('is-open'); void op.offsetWidth; op.classList.remove('is-swap'); }
      p.classList.add('is-swap', 'is-open'); void p.offsetWidth; p.classList.remove('is-swap');
    } else {
      p.classList.add('is-open');
    }
    t.setAttribute('aria-expanded', 'true');
    header.classList.add('is-mega-open');
    openKey = k;
  }

  triggers.forEach(function (t) {
    var k = t.getAttribute('data-mega');
    var p = panel(k);
    t.addEventListener('mouseenter', function () {
      clearTimeout(tClose); clearTimeout(tOpen);
      if (openKey) { open(k); } else { tOpen = setTimeout(function () { open(k); }, 150); }
    });
    t.addEventListener('mouseleave', function () { clearTimeout(tOpen); clearTimeout(tClose); tClose = setTimeout(close, 250); });
    t.addEventListener('click', function (e) { e.preventDefault(); clearTimeout(tOpen); if (openKey === k) { close(); } else { open(k); } });
    t.addEventListener('keydown', function (e) {
      if (!p) { return; }
      if (e.key === 'Tab' && !e.shiftKey && openKey === k) { e.preventDefault(); links(p)[0].focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); open(k); setTimeout(function () { links(p)[0].focus(); }, 30); }
    });
    if (p) {
      p.addEventListener('mouseenter', function () { clearTimeout(tClose); });
      p.addEventListener('mouseleave', function () { clearTimeout(tClose); tClose = setTimeout(close, 250); });
      p.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') { return; }
        var ls = links(p);
        if (!e.shiftKey && document.activeElement === ls[ls.length - 1]) {
          e.preventDefault(); var nx = navItems[navItems.indexOf(t) + 1]; close(); (nx || t).focus();
        } else if (e.shiftKey && document.activeElement === ls[0]) { e.preventDefault(); t.focus(); }
      });
    }
  });

  // 直リンクの項目（大山ワンダーとは）に乗ったら閉じる
  Array.prototype.forEach.call(header.querySelectorAll('.js-gnav > a'), function (a) {
    a.addEventListener('mouseenter', function () { clearTimeout(tOpen); clearTimeout(tClose); tClose = setTimeout(close, 120); });
  });

  // エリアの一覧 ↔ 地図の強調
  Array.prototype.forEach.call(header.querySelectorAll('.c-mega__towns a'), function (a) {
    var k = (a.getAttribute('href') || '').split('/')[2];
    function hl(on) { var m = header.querySelector('.c-area-svg a[data-area="' + k + '"]'); if (m) { m.classList.toggle('is-hl', on); } }
    a.addEventListener('mouseenter', function () { hl(true); });
    a.addEventListener('mouseleave', function () { hl(false); });
    a.addEventListener('focus', function () { hl(true); });
    a.addEventListener('blur', function () { hl(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openKey) { var t = trigger(openKey); close(); if (t) { t.focus(); } }
  });
  document.addEventListener('click', function (e) { if (openKey && !header.contains(e.target)) { close(); } });
  window.addEventListener('scroll', function () {
    if (openKey && window.scrollY > 40 && !header.matches(':hover')) { close(); }
  }, { passive: true });

  /* ---------- 2) スマホメニュー ---------- */
  var menu = document.querySelector('.js-spmenu');
  var burger = header.querySelector('.js-spmenu-open');
  if (!menu || !burger) { return; }
  var closeBtn = menu.querySelector('.js-spmenu-close');
  var prevOverflow = '';

  function setMenu(on) {
    menu.classList.toggle('is-open', on);
    burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) {
      menu.removeAttribute('inert');
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(function () { if (closeBtn) { closeBtn.focus(); } }, 60);
    } else {
      menu.setAttribute('inert', '');
      document.body.style.overflow = prevOverflow || '';
      burger.focus();
    }
  }
  burger.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) { closeBtn.addEventListener('click', function () { setMenu(false); }); }
  // メニュー内のリンクを押したら閉じる
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a) { menu.classList.remove('is-open'); menu.setAttribute('inert', ''); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = prevOverflow || ''; }
  });
  menu.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key !== 'Tab') { return; }
    var f = Array.prototype.filter.call(menu.querySelectorAll('a, button, summary'), function (el) { return el.offsetParent !== null; });
    if (!f.length) { return; }
    if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    else if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  });
  // 画面幅が広がったら閉じる
  window.addEventListener('resize', function () { if (window.innerWidth > 1180 && menu.classList.contains('is-open')) { setMenu(false); } });
})();

/**
 * 言語の切り替え（.js-lang のボタンと [data-lang] の選択肢）
 * 多言語は「シュッと翻訳」で行う（11/9 代理店打ち合わせ）。切り替えの処理は setLang() の中でシュッと翻訳につなぐ（タグ・仕様は確認中）
 */
(function () {
  'use strict';
  var roots = Array.prototype.slice.call(document.querySelectorAll('.js-lang'));
  function close(root) {
    var b = root.querySelector('.c-lang__btn'), m = root.querySelector('.c-lang__menu');
    if (b && m) { b.setAttribute('aria-expanded', 'false'); m.hidden = true; }
  }
  roots.forEach(function (root) {
    var btn = root.querySelector('.c-lang__btn'), menu = root.querySelector('.c-lang__menu');
    if (!btn || !menu) { return; }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') === 'true';
      roots.forEach(close);
      if (!open) { btn.setAttribute('aria-expanded', 'true'); menu.hidden = false; var c = menu.querySelector('[aria-current="true"]') || menu.querySelector('button'); if (c) { c.focus(); } }
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(root); btn.focus(); } });
  });
  document.addEventListener('click', function (e) { roots.forEach(function (r) { if (!r.contains(e.target)) { close(r); } }); });
  function setLang(code) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (el) {
      if (el.getAttribute('data-lang') === code) { el.setAttribute('aria-current', 'true'); } else { el.removeAttribute('aria-current'); }
    });
    // TODO：ここでシュッと翻訳の切り替えを呼ぶ（code：ja / en / zh-TW / zh-CN / ko）
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (el) {
    el.addEventListener('click', function () { setLang(el.getAttribute('data-lang')); roots.forEach(close); });
  });
})();
