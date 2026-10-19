/**
 * デザイン確認用の Basic 認証（Cloudflare Pages Functions）
 * ID・パスワードは Cloudflare の環境変数 BASIC_USER / BASIC_PASS（Secret）で設定する。
 * あわせて全レスポンスに noindex を付け、検索エンジンに載らないようにする。
 */
export async function onRequest({ request, env, next }) {
  const user = env.BASIC_USER;
  const pass = env.BASIC_PASS;
  if (!user || !pass) {
    return new Response('Basic auth is not configured.', { status: 503 });
  }

  const expected = 'Basic ' + btoa(unescape(encodeURIComponent(`${user}:${pass}`)));
  const given = request.headers.get('Authorization') || '';

  if (!timingSafeEqual(given, expected)) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Daisen Wonder Preview", charset="UTF-8"',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
