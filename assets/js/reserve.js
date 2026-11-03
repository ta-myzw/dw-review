/**
 * 予約フォーム（/plan/reserve/）と確認・完了画面
 * - プラン詳細から ?plan=a-2&route=米子駅|米子駅 で来たら、コースと発着を選んだ状態で開く
 * - コースを変えると発着の選択肢を、発着を変えるとタクシー会社の選択肢（出発地の担当）を出し直す
 * - ご利用日は30日前〜5日前だけ。運休月・大山寺発（電話予約のみ）は送信できない理由を書く
 * - 送信時に入力をチェックし、誤りは上に一覧＋各欄の下に表示（WCAG 3.3.1）
 * - 静的HTMLでは入力を sessionStorage に置き、確認・完了画面に表示する（WPではフォームの仕組みが受け渡す）
 */
(function () {
  'use strict';
  var KEY = 'dwReserve';
  var LOCAL = /^(file:|http:\/\/(localhost|127\.0\.0\.1))/.test(location.href);
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function save(o) { try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function yen(n) { return n.toLocaleString('ja-JP'); }
  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  function jdate(s) { var d = new Date(s + 'T00:00:00'); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + WD[d.getDay()] + '）'; }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function go(path, staticPath) { location.href = LOCAL ? staticPath : path; }

  /* ---------- 入力画面 ---------- */
  var form = $('.js-rsv-form');
  if (form) {
    var DATA = JSON.parse($('#rsv-data').textContent);
    var byCode = {}; DATA.plans.forEach(function (p) { byCode[p.code] = p; });
    var sel = $('#rsv-plan'), routesBox = $('.js-rsv-routes'), coBox = $('.js-rsv-companies');
    var date = $('#rsv-date'), time = $('#rsv-time');
    var q = new URLSearchParams(location.search);
    var qPlan = (q.get('plan') || '').toUpperCase(), qRoute = q.get('route') || '';

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var min = new Date(today); min.setDate(min.getDate() + 5);
    var max = new Date(today); max.setDate(max.getDate() + 30);
    date.min = iso(min); date.max = iso(max);

    function plan() { return byCode[sel.value]; }
    function route() { var r = $('input[name="route"]:checked', form); if (!r) { return null; } var p = r.value.split('|'); return plan().routes.filter(function (x) { return x.from === p[0] && x.to === p[1]; })[0] || null; }

    function renderRoutes(pick) {
      var p = plan();
      if (!p.routes.length) {
        routesBox.innerHTML = '<p class="p-rsv__inline-note">このプランの発着・所要時間は確認中です。<a href="#company">お電話でお問い合わせください</a>。</p>';
      } else {
        routesBox.innerHTML = p.routes.map(function (r, i) {
          var v = r.from + '|' + r.to, on = pick ? v === pick : i === 0;
          return '<label class="c-route-pick__row"><input type="radio" name="route" value="' + v + '"' + (on ? ' checked' : '') + (i === 0 ? ' required' : '') + '><span class="c-route-pick__od">' + r.from + '<span class="c-route-pick__to" aria-hidden="true">→</span><span class="u-visually-hidden">から</span>' + r.to + '</span><span class="c-route-pick__h">' + r.h + '時間' + (r.tel ? '・電話のみ' : '') + '</span></label>';
        }).join('');
        if (!$('input[name="route"]:checked', form)) { $('input[name="route"]', form).checked = true; }
      }
      renderCompanies(); renderTimes(); renderSummary();
    }
    function renderCompanies() {
      var r = route();
      if (!r) { coBox.innerHTML = '<p class="p-rsv__inline-note">発着を選ぶと、担当のタクシー会社が出ます。</p>'; return; }
      var g = DATA.companies.filter(function (c) { return c.from.indexOf(r.from) >= 0; })[0];
      if (r.tel) {
        coBox.innerHTML = '<p class="p-rsv__inline-note">大山寺から出発するプランは、フォームではなくお電話でのご予約です。' + g.list.map(function (c) { return c.name + '（<a href="tel:' + c.tel.replace(/-/g, '') + '">' + c.tel + '</a>）'; }).join('、') + '</p>';
        return;
      }
      var cur = ($('input[name="company"]:checked', form) || {}).value;
      coBox.innerHTML = g.list.map(function (c, i) { return '<label class="c-choice"><input type="radio" name="company" value="' + c.name + '" data-tel="' + c.tel + '"' + (c.name === cur ? ' checked' : '') + (i === 0 ? ' required' : '') + '>' + c.name + '</label>'; }).join('');
    }
    function renderTimes() {
      var p = plan(), until = p.until || '14:45', cur = time.value;
      $$('option', time).forEach(function (o) { if (!o.value) { return; } var off = o.value.padStart(5, '0') > until.padStart(5, '0'); o.disabled = off; o.hidden = off; });
      if (cur && time.selectedOptions[0] && time.selectedOptions[0].disabled) { time.value = ''; }
      $('#rsv-time-help').textContent = (p.until ? '出発は' + p.until.replace(':00', '時') + 'まで。' : '') + '立ち寄り先の営業時間に間に合うよう、余裕をもってお選びください。';
    }
    function renderSummary() {
      var p = plan(), r = route();
      $('.js-sum-img').src = $('.js-sum-img').src.replace(/[a-g]-\d\.webp$/, p.img);
      $('.js-sum-code').textContent = p.code;
      $('.js-sum-title').textContent = p.title;
      $('.js-sum-route').textContent = r ? r.from + ' → ' + r.to : '確認中';
      $('.js-sum-h').textContent = r ? r.h + '時間' : '確認中';
      $('.js-sum-until').textContent = p.until ? p.until.replace(':00', '時') + 'まで' : '—';
      var pr = r && DATA.price[r.h];
      $('.js-sum-price').innerHTML = pr ? '<span class="c-price__now">' + yen(pr[0]) + '<small>円</small></span><span class="c-price__was">通常 <s>' + yen(pr[1]) + '円</s></span>' : '<span class="p-rsv__tbd">料金は確認中</span>';
      $('.js-sum-link').setAttribute('href', '/plan/' + p.slug + '/');
    }

    if (byCode[qPlan]) { sel.value = qPlan; }
    renderRoutes(qRoute);
    sel.addEventListener('change', function () { renderRoutes(); });
    routesBox.addEventListener('change', function () { renderCompanies(); renderSummary(); });

    // 入力のチェック
    function setErr(id, msg) {
      var f = $('[data-field="' + id + '"]', form); if (!f) { return; }
      f.classList.toggle('is-error', !!msg);
      var e = $('#' + id + '-err'); if (e) { e.textContent = msg || ''; }
      $$('input, select, textarea', f).forEach(function (el) { if (msg) { el.setAttribute('aria-invalid', 'true'); } else { el.removeAttribute('aria-invalid'); } });
    }
    function val(name) { var el = form.elements[name]; if (!el) { return ''; } if (el.length !== undefined && !el.tagName) { var c = $('input[name="' + name + '"]:checked', form); return c ? c.value : ''; } return el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value.trim(); }
    function check() {
      var errs = [], p = plan(), r = route();
      function add(id, label, msg) { setErr(id, msg); if (msg) { errs.push([id, label + '：' + msg]); } }
      add('rsv-plan', 'ご希望のコース', '');
      add('rsv-route', '発着', !p.routes.length ? 'このプランはフォームで予約できません。お電話でお問い合わせください' : !r ? '発着を選んでください' : r.tel ? '大山寺から出発するプランはお電話でご予約ください' : '');
      var d = val('date'), dm = d ? new Date(d + 'T00:00:00') : null;
      add('rsv-date', 'ご利用日', !d ? 'ご利用日を選んでください' : (dm < min || dm > max) ? '30日前から5日前までの日を選んでください。4日前以降はお電話でご予約ください' : (p.closed.indexOf(dm.getMonth() + 1) >= 0 ? 'このプランは' + (dm.getMonth() + 1) + '月は運休です。別の日かプランを選んでください' : ''));
      add('rsv-time', 'ご乗車予定時間', val('time') ? '' : '時間を選んでください');
      add('rsv-company', 'ご希望のタクシー会社', (r && !r.tel && !val('company')) ? 'タクシー会社を選んでください' : '');
      add('rsv-pax', 'ご利用人数', val('pax') ? '' : '人数を選んでください');
      add('rsv-luggage', '大型のお荷物', val('luggage') ? '' : '「なし」か「あり」を選んでください');
      add('rsv-pay', 'お支払方法', val('pay') ? '' : 'お支払方法を選んでください');
      add('rsv-name', '代表者のお名前', val('name') ? '' : 'お名前を入力してください');
      add('rsv-sign', 'お迎えの表示名', val('sign') ? '' : 'プラカードに出すお名前を入力してください');
      add('rsv-tel', '電話番号', !val('tel') ? '電話番号を入力してください' : /^[0-9０-９+()\-‐－ ]{10,}$/.test(val('tel')) ? '' : '数字とハイフンで入力してください（例：090-1234-5678）');
      add('rsv-mail', 'メールアドレス', !val('mail') ? 'メールアドレスを入力してください' : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('mail')) ? '' : '「@」と「.」を含む形で入力してください（例：name@example.com）');
      add('rsv-agree', '個人情報の取り扱い', val('agree') ? '' : '同意のチェックを入れてください');
      return errs;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errs = check(), box = $('.js-rsv-errors');
      if (errs.length) {
        $('.js-rsv-errlist').innerHTML = errs.map(function (x) { return '<li><a href="#' + x[0] + '">' + x[1] + '</a></li>'; }).join('');
        box.hidden = false; box.focus(); return;
      }
      box.hidden = true;
      var p = plan(), r = route(), co = $('input[name="company"]:checked', form);
      save({ plan: p.code + ' ' + p.title, route: r.from + ' → ' + r.to + '（' + r.h + '時間）', date: jdate(val('date')), time: val('time'), company: co.value, tel_co: co.getAttribute('data-tel'),
        pax: val('pax') + '名', luggage: val('luggage'), pay: val('pay'), name: val('name'), sign: val('sign'), tel: val('tel'), mail: val('mail'), country: val('country') || '—', note: val('note') || '—', price: DATA.price[r.h][0] });
      go('/plan/reserve/confirm/', 'confirm/index.html');
    });
    $('.js-rsv-errlist').addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) { return; } e.preventDefault();
      var f = $('[data-field="' + a.getAttribute('href').slice(1) + '"]', form);
      var el = f && $('input, select, textarea', f); if (el) { el.focus(); f.scrollIntoView({ block: 'center' }); }
    });
  }

  /* ---------- 確認画面 ---------- */
  var cf = $('.js-rsv-confirm');
  if (cf) {
    var d = load();
    if (d) {
      $$('dd[data-key]', cf).forEach(function (dd) { var v = d[dd.getAttribute('data-key')]; if (v) { dd.textContent = v; } });
      if (d.price) { $('.js-cf-price').innerHTML = yen(d.price) + '<small>円</small>'; }
    }
    var back = $('.p-rsv__actions a[href="/plan/reserve/"]');
    if (back && LOCAL) { back.addEventListener('click', function (e) { e.preventDefault(); history.back(); }); }
  }

  /* ---------- 完了画面 ---------- */
  var th = $('.js-th-company');
  if (th) {
    var t = load();
    if (t && t.company) { th.textContent = t.company; var a = $('.js-th-tel'); a.textContent = t.tel_co; a.href = 'tel:' + t.tel_co.replace(/-/g, ''); }
  }
})();
