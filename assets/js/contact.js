/**
 * お問い合わせフォーム（/contact/）と確認・完了画面
 * - 送信時に入力をチェックし、誤りは上に一覧＋各欄の下に表示（WCAG 3.3.1）
 * - 静的HTMLでは入力を sessionStorage に置き、確認画面に表示する（WPではフォームの仕組みが受け渡す）
 */
(function () {
  'use strict';
  var KEY = 'dwContact';
  var LOCAL = /^(file:|http:\/\/(localhost|127\.0\.0\.1))/.test(location.href);
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function save(o) { try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function go(path, staticPath) { location.href = LOCAL ? staticPath : path; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 入力画面 ---------- */
  var form = $('.js-ct-form');
  if (form) {
    var prev = load();
    if (prev) {   // 確認画面から戻ったときは、入力を戻す
      ['name', 'mail', 'tel', 'pref', 'body'].forEach(function (k) { if (prev[k] && prev[k] !== '—') { form.elements[k].value = prev[k]; } });
      $$('input[name="type"]', form).forEach(function (r) { r.checked = r.value === prev.type; });
    }
    function val(n) { var el = form.elements[n]; if (n === 'type') { var c = $('input[name="type"]:checked', form); return c ? c.value : ''; } return el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value.trim(); }
    function setErr(id, msg) {
      var f = $('[data-field="' + id + '"]', form); if (!f) { return; }
      f.classList.toggle('is-error', !!msg);
      $('#' + id + '-err').textContent = msg || '';
      $$('input, select, textarea', f).forEach(function (el) { if (msg) { el.setAttribute('aria-invalid', 'true'); } else { el.removeAttribute('aria-invalid'); } });
    }
    function check() {
      var errs = [];
      function add(id, label, msg) { setErr(id, msg); if (msg) { errs.push([id, label + '：' + msg]); } }
      add('ct-type', 'お問い合わせの種類', val('type') ? '' : '種類を選んでください');
      add('ct-mail', 'メールアドレス', !val('mail') ? 'メールアドレスを入力してください' : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('mail')) ? '' : '「@」と「.」を含む形で入力してください');
      add('ct-tel', '電話番号', !val('tel') || /^[0-9０-９+()\-‐－ ]{10,}$/.test(val('tel')) ? '' : '数字とハイフンで入力してください（例：0859-00-0000）');
      add('ct-body', 'お問い合わせ内容', val('body') ? '' : 'お問い合わせ内容を入力してください');
      add('ct-agree', '個人情報の取り扱い', val('agree') ? '' : '同意のチェックを入れてください');
      return errs;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errs = check(), box = $('.js-ct-errors');
      if (errs.length) {
        $('.js-ct-errlist').innerHTML = errs.map(function (x) { return '<li><a href="#' + x[0] + '">' + x[1] + '</a></li>'; }).join('');
        box.hidden = false; box.focus(); return;
      }
      box.hidden = true;
      save({ type: val('type'), name: val('name') || '—', mail: val('mail'), tel: val('tel') || '—', pref: val('pref') || '—', body: val('body') });
      go('/contact/confirm/', 'confirm/index.html');
    });
  }

  /* ---------- 確認画面 ---------- */
  var cf = $('.js-ct-confirm');
  if (cf) {
    var d = load();
    if (d) { $$('[data-key]', cf).forEach(function (dd) { dd.innerHTML = esc(d[dd.getAttribute('data-key')] || '—'); }); }
    var back = $('.js-ct-back'), send = $('.js-ct-send');
    if (LOCAL) { back.setAttribute('href', '../index.html'); send.setAttribute('href', '../thanks/index.html'); }
    send.addEventListener('click', function () { try { sessionStorage.removeItem(KEY); } catch (e) {} });
  }
})();
