/**
 * 確認用のリンク変換（静的HTMLを直接開いて確認するときだけ動く。WP化のときは読み込まない）
 * サイト内リンクは本番と同じ「/plan/?mood=zekkei」の形で書いてある。
 * ファイルを直接開いたとき（file:）やローカルサーバーでは、作成済みの静的ページへ置き換えて移動する。
 */
(function () {
  'use strict';
  if (!/^(file:|http:\/\/(localhost|127\.0\.0\.1))/.test(location.href)) { return; }
  var root = document.documentElement.getAttribute('data-root') || '';
  // 作成済みの静的ページ（ページを作ったらここに足す）
  var built = {
    '/': 'index.html',
    '/plan/': 'plan/index.html',
    '/plan/a-2/': 'plan/a-2/index.html',
    '/plan/reserve/': 'plan/reserve/index.html',
    '/plan/reserve/confirm/': 'plan/reserve/confirm/index.html',
    '/plan/reserve/thanks/': 'plan/reserve/thanks/index.html',
    '/journal/': 'journal/index.html',
    '/journal/katana/': 'journal/katana/index.html',
    '/area/': 'area/index.html',
    '/area/hino/': 'area/hino/index.html',
    '/stories/': 'stories/index.html',
    '/stories/iron/': 'stories/iron/index.html',
    '/about/': 'about/index.html',
    '/people/': 'people/index.html',
    '/people/brewer-01/': 'people/brewer-01/index.html',
    '/news/': 'news/index.html',
    '/news/sample/': 'news/sample/index.html',
    '/event/': 'event/index.html',
    '/event/sample/': 'event/sample/index.html',
    '/access/': 'access/index.html',
    '/contact/': 'contact/index.html',
    '/contact/confirm/': 'contact/confirm/index.html',
    '/contact/thanks/': 'contact/thanks/index.html',
    '/contact_kanko/': 'contact_kanko/index.html'
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) { return; }
    var href = a.getAttribute('href');
    var path = href.split(/[?#]/)[0];
    var rest = href.slice(path.length);
    if (built[path]) { e.preventDefault(); location.href = root + built[path] + rest; }
  });
  // GET のフォーム（プラン詳細の「この発着で予約する」）も同じように置き換える
  document.addEventListener('submit', function (e) {
    var f = e.target, act = f.getAttribute('action') || '';
    if (e.defaultPrevented || (f.method || '').toLowerCase() !== 'get' || !built[act]) { return; }
    e.preventDefault(); location.href = root + built[act] + '?' + new URLSearchParams(new FormData(f)).toString();
  });
})();
