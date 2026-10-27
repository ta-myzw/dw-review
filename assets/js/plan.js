/**
 * プラン一覧（/plan/）の絞り込み
 * - 条件は URL パラメータと同期する：?mood=zekkei,onsen&season=autumn&axis=katana&time=4&from=…&to=…&date=2027-01-15&sort=price
 *   テーマの条件名は WordPress の予約語 theme を避けて axis（物語・ジャーナルと共通）
 *   ページ送りは WordPress 標準の /plan/page/2/。静的HTML（確認用サイト・直接開いたとき）は #page-2 で代用
 *   （ページ送りの nav に data-pager="hash" がある＝静的HTML。WPのテンプレートには付けない）
 *   ?filter=mood など：その条件の選択肢を開く（1181px〜は条件バーの吹き出し、それ以下はシート）
 * - 同じ条件の中は「どれか」、条件同士は「すべて」を満たすもの。選ぶとすぐ一覧が変わる（「探す」ボタンはない）
 * - 気分・季節・テーマの条件がちょうど1つのとき、その特集の紹介（.js-feature）をページの下に出す
 * - 条件の部品は PC の条件バーとスマホのシートの2か所にあり、どちらで操作しても同じ状態を表示する
 * WP化のときは同じ条件をサーバー側（WP_Query）でも処理する。このJSは表示の切り替えと URL の同期だけ。
 */
(function () {
  'use strict';
  var list = document.querySelector('.js-plan-list');
  if (!list) { return; }

  var PER = 12;
  var GROUPS = ['mood', 'season', 'axis', 'time'];
  var FIELDS = ['from', 'to', 'date'];
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var LABEL = {};
  $$('.c-chip[data-group]').forEach(function (c) { LABEL[c.dataset.group + ':' + c.dataset.value] = c.textContent; });
  var items = $$('.js-plan', list);
  items.forEach(function (el, i) { el.dataset.order = i; });

  var sheet = document.getElementById('filter-sheet');
  var sortSel = document.querySelector('.js-sort');
  var pager = document.querySelector('.js-pager');
  var applied = document.querySelector('.js-applied');
  var emptyBox = document.querySelector('.js-empty');
  var results = document.querySelector('.p-plan__results');
  var wide = window.matchMedia('(min-width: 1181px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var state;
  function blank() { return { mood: [], season: [], axis: [], time: [], from: '', to: '', date: '', sort: 'recommend', page: 1 }; }

  /* ---------- URL ⇔ 状態 ---------- */
  function readURL() {
    var q = new URLSearchParams(location.search);
    var s = blank();
    GROUPS.forEach(function (g) { s[g] = (q.get(g) || '').split(',').filter(function (v) { return LABEL[g + ':' + v]; }); });
    FIELDS.forEach(function (k) { s[k] = q.get(k) || ''; });
    s.sort = q.get('sort') || 'recommend';
    var m = location.pathname.match(/\/page\/(\d+)\/?$/) || location.hash.match(/^#page-(\d+)$/);
    s.page = Math.max(1, m ? parseInt(m[1], 10) : 1);
    return s;
  }
  // 一覧の基本のパス（/plan/page/2/ の page/2/ を除いたもの）
  var BASE = location.pathname.replace(/page\/\d+\/?$/, '');
  // WP（/plan/）なら true。静的HTMLは /plan/page/2/ のページが無いので false（#page-2 を使う）
  var PRETTY = /\/$/.test(BASE) && pager.getAttribute('data-pager') !== 'hash';
  function query(s, page) {
    var q = new URLSearchParams();
    GROUPS.forEach(function (g) { if (s[g].length) { q.set(g, s[g].join(',')); } });
    FIELDS.forEach(function (k) { if (s[k]) { q.set(k, s[k]); } });
    if (s.sort !== 'recommend') { q.set('sort', s.sort); }
    var str = q.toString().replace(/%2C/g, ',');
    var path = BASE + (page > 1 && PRETTY ? 'page/' + page + '/' : '');
    return path + (str ? '?' + str : '') + (page > 1 && !PRETTY ? '#page-' + page : '');
  }

  /* ---------- 状態 → 部品の表示 ---------- */
  function syncControls() {
    $$('.c-chip[data-group]').forEach(function (c) {
      c.setAttribute('aria-pressed', state[c.dataset.group].indexOf(c.dataset.value) > -1 ? 'true' : 'false');
    });
    $$('.js-f').forEach(function (f) { f.value = state[f.name]; f.classList.toggle('is-set', !!state[f.name]); });
    $$('.js-pop-val').forEach(function (v) {
      var g = v.dataset.group;
      v.textContent = state[g].length ? state[g].map(function (x) { return LABEL[g + ':' + x]; }).join('・') : '指定なし';
      v.parentNode.classList.toggle('is-set', state[g].length > 0);
    });
    sortSel.value = state.sort;
  }

  function match(el) {
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i], want = state[g];
      if (!want.length) { continue; }
      var has = (el.dataset[g] || '').split(' ');
      if (!want.some(function (v) { return has.indexOf(v) > -1; })) { return false; }
    }
    // 出発地と到着地の両方を選んだときは、実在する発着の組（data-routes「発地→着地」）で判定する
    if (state.from && state.to) {
      if ((el.dataset.routes || '').split('|').indexOf(state.from + '→' + state.to) < 0) { return false; }
    } else {
      if (state.from && el.dataset.from.split('|').indexOf(state.from) < 0) { return false; }
      if (state.to && el.dataset.to.split('|').indexOf(state.to) < 0) { return false; }
    }
    if (state.date) {
      var m = String(parseInt(state.date.slice(5, 7), 10));
      if ((el.dataset.closed || '').split(' ').indexOf(m) > -1) { return false; }
    }
    return true;
  }
  function sorted(arr) {
    var key = {
      recommend: function (el) { return [-Number(el.dataset.new), Number(el.dataset.order)]; },
      price: function (el) { return [Number(el.dataset.price), Number(el.dataset.order)]; },
      time: function (el) { return [Number(el.dataset.time.split(' ')[0]), Number(el.dataset.order)]; }
    }[state.sort];
    return arr.slice().sort(function (a, b) { var ka = key(a), kb = key(b); return ka[0] - kb[0] || ka[1] - kb[1]; });
  }

  function chip(label, onRemove) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'c-chip c-chip--applied';
    b.textContent = label;
    b.setAttribute('aria-label', label + 'の条件を外す');
    b.addEventListener('click', onRemove);
    return b;
  }

  function render(opts) {
    opts = opts || {};
    var hit = sorted(items.filter(match));
    var pages = Math.max(1, Math.ceil(hit.length / PER));
    if (state.page > pages) { state.page = pages; }
    items.forEach(function (el) { el.hidden = true; });
    hit.forEach(function (el, i) { list.appendChild(el); el.hidden = !(i >= (state.page - 1) * PER && i < state.page * PER); });
    list.hidden = !hit.length;
    emptyBox.hidden = !!hit.length;

    var n = 0;
    GROUPS.forEach(function (g) { n += state[g].length; });
    FIELDS.forEach(function (k) { if (state[k]) { n++; } });
    document.querySelector('.js-count').textContent = hit.length;
    document.querySelector('.js-count-btn').textContent = hit.length + '件を表示';
    $$('.js-active-n').forEach(function (el) { el.textContent = n ? '（' + n + '）' : ''; });
    document.querySelector('.js-result-label').textContent = n ? '（条件に合うプラン）' : '（すべてのプラン）';

    applied.textContent = '';
    FIELDS.forEach(function (k) {
      if (!state[k]) { return; }
      var t = { from: '出発 ', to: '到着 ', date: '' }[k] + (k === 'date' ? state.date.replace(/^\d+-0?(\d+)-0?(\d+)$/, '$1月$2日に利用') : state[k]);
      applied.appendChild(chip(t, function () { state[k] = ''; update(true); }));
    });
    GROUPS.forEach(function (g) {
      state[g].forEach(function (v) {
        applied.appendChild(chip(LABEL[g + ':' + v], function () { state[g] = state[g].filter(function (x) { return x !== v; }); update(true); }));
      });
    });
    if (n > 1) {
      var all = document.createElement('button');
      all.type = 'button'; all.className = 'c-link-more p-plan__clear-all'; all.textContent = 'すべて解除';
      all.addEventListener('click', function () { reset(true); });
      applied.appendChild(all);
    }

    // 特集（気分・季節・テーマの条件がちょうど1つのとき、ページの下に）
    var axes = [];
    ['mood', 'season', 'axis'].forEach(function (g) { state[g].forEach(function (v) { axes.push(g + ':' + v); }); });
    $$('.js-feature').forEach(function (f) { f.hidden = !(axes.length === 1 && f.dataset.key === axes[0]); });

    renderPager(pages);
    history.replaceState(null, '', query(state, state.page));
    if (opts.scroll) { results.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); }
  }

  function renderPager(pages) {
    pager.textContent = '';
    if (pages < 2) { return; }
    var ul = document.createElement('ul');
    function li(node) { var l = document.createElement('li'); l.appendChild(node); ul.appendChild(l); }
    function link(p, html, cls, label) {
      var a = document.createElement('a');
      a.href = query(state, p); a.innerHTML = html;
      if (cls) { a.className = cls; }
      if (label) { a.setAttribute('aria-label', label); }
      if (p === state.page) { a.setAttribute('aria-current', 'page'); }
      a.addEventListener('click', function (e) { e.preventDefault(); state.page = p; render({ scroll: true }); });
      return a;
    }
    if (state.page > 1) { li(link(state.page - 1, '<span class="c-arrow" aria-hidden="true">←</span><span>前へ</span>', 'is-prev', '前のページ')); }
    for (var p = 1; p <= pages; p++) { li(link(p, String(p), '', p + 'ページ目')); }
    if (state.page < pages) { li(link(state.page + 1, '<span>次へ</span><span class="c-arrow" aria-hidden="true">→</span>', 'is-next', '次のページ')); }
    pager.appendChild(ul);
  }

  function update(focusCount) {
    state.page = 1;
    syncControls();
    render();
    if (focusCount) {
      var h = document.querySelector('.p-plan__count');
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  }
  function reset(focusCount) {
    var keep = state.sort;
    state = blank(); state.sort = keep;
    update(focusCount);
  }

  /* ---------- 操作 ---------- */
  // チップ（ui.js が aria-pressed を切り替えたあとに読む）
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.c-chip[data-group]');
    if (!c) { return; }
    var g = c.dataset.group, v = c.dataset.value;
    state[g] = state[g].filter(function (x) { return x !== v; });
    if (c.getAttribute('aria-pressed') === 'true') { state[g].push(v); }
    state.page = 1;
    syncControls();
    render();
  });
  $$('.js-f').forEach(function (f) {
    f.addEventListener('change', function () { state[f.name] = f.value; state.page = 1; syncControls(); render(); });
  });
  $$('.js-clear').forEach(function (b) {
    b.addEventListener('click', function () { state[b.dataset.group] = []; state.page = 1; syncControls(); render(); });
  });
  $$('.js-reset').forEach(function (b) { b.addEventListener('click', function () { reset(!sheet.open); }); });
  sortSel.addEventListener('change', function () { state.sort = sortSel.value; state.page = 1; render(); });

  /* ---------- 条件バーの吹き出し（PC） ---------- */
  var openPop = null;
  function closePop(focusBtn) {
    if (!openPop) { return; }
    var btn = openPop;
    btn.setAttribute('aria-expanded', 'false');
    document.getElementById(btn.getAttribute('aria-controls')).hidden = true;
    openPop = null;
    if (focusBtn) { btn.focus(); }
  }
  function showPop(btn) {
    closePop(false);
    btn.setAttribute('aria-expanded', 'true');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    panel.hidden = false;
    openPop = btn;
    return panel;
  }
  $$('.js-pop-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-expanded') === 'true') { closePop(false); } else { showPop(btn); }
    });
  });
  document.addEventListener('click', function (e) {
    if (openPop && !openPop.parentNode.contains(e.target)) { closePop(false); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openPop) { closePop(true); }
  });
  // 吹き出しからフォーカスが出たら閉じる
  document.addEventListener('focusin', function (e) {
    if (openPop && !openPop.parentNode.contains(e.target)) { closePop(false); }
  });
  wide.addEventListener && wide.addEventListener('change', function () { closePop(false); if (wide.matches && sheet.open) { sheet.close(); } });

  /* ---------- はじめの表示 ---------- */
  // ?filter= は開く条件の指定だけなので、URLを書き換える前に読んでおく
  var only = new URLSearchParams(location.search).get('filter');
  state = readURL();
  syncControls();
  render();

  // シートの「N件を表示」で閉じたら、一覧の頭（件数・選んだ条件）まで移動して、絞り込んだ結果を見せる
  var showBtn = document.querySelector('.js-show-results');
  var countHead = document.querySelector('.p-plan__count');
  var goResults = false;
  if (showBtn && results) {
    showBtn.addEventListener('click', function () { goResults = true; });
    sheet.addEventListener('close', function () {
      if (!goResults) { return; }
      goResults = false;
      setTimeout(function () {
        var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        results.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
        if (countHead) { countHead.focus({ preventScroll: true }); }
      }, 0);
    });
  }

  // スマホ・タブレットの FAB：上の「条件で絞り込む」が見えている間と、「ご利用の前に」から下では出さない
  var fab = document.querySelector('.js-fab');
  var inlineOpen = document.querySelector('.p-plan__open');
  var info = document.querySelector('.p-plan__info');
  if (fab && inlineOpen && info && 'IntersectionObserver' in window) {
    var inlineSeen = true, infoReached = false;
    var updateFab = function () { fab.classList.toggle('is-shown', !inlineSeen && !infoReached); };
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { inlineSeen = en.isIntersecting || en.boundingClientRect.top > 0; });
      updateFab();
    }).observe(inlineOpen);
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { infoReached = en.isIntersecting || en.boundingClientRect.top < 0; });
      updateFab();
    }, { rootMargin: '0px 0px 120px 0px' }).observe(info);
  }
  if (only && GROUPS.indexOf(only) > -1) {
    setTimeout(function () {
      if (wide.matches) {
        var btn = document.querySelector('.js-pop-btn[aria-controls="pop-' + only + '"]');
        var panel = showPop(btn);
        var first = panel.querySelector('.c-chip');
        if (first) { first.focus({ preventScroll: true }); }
        btn.closest('.p-plan-cond').scrollIntoView({ block: 'center' });
      } else {
        document.querySelector('[data-sheet-open="filter-sheet"]').click();
        setTimeout(function () {
          var group = document.getElementById('m-filter-' + only);
          group.scrollIntoView({ block: 'start' });
          var c = group.querySelector('.c-chip');
          if (c) { c.focus({ preventScroll: true }); }
        }, 50);
      }
    }, 0);
  }
})();
