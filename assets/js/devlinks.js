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
    '/plan/a-2/': 'plan/a-2/index.html'
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) { return; }
    var href = a.getAttribute('href');
    var path = href.split(/[?#]/)[0];
    var rest = href.slice(path.length);
    if (built[path]) { e.preventDefault(); location.href = root + built[path] + rest; }
  });
})();
