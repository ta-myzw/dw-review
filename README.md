# 大山ワンダー 静的HTML版（トップ＋下層）

`Daisen-Wonder トップ デザイン（v20）.dc.html` を、WordPress 化を前提に「普通のHTML＋外部CSS＋外部JS」へ組み直したもの。
見た目と動きは v20 と同じ（PC・スマホで画面を撮り比べて確認済み）。ブラウザで `index.html` を直接開いて確認できる。

## フォルダ構成

```
index.html          … トップ
plan/index.html     … プラン一覧（/plan/）。気分・季節・テーマの検索結果を兼ねる
styleguide.html     … デザインシステム（部品カタログ）。色・文字・余白・アイコン・全部品の見本と使い方のルール
parts/
  area-map.svg      … 10市町村の地図（メガメニューとスマホメニューで共通。リンクと連動があるのでページには直書きで出す）
assets/
  css/
    tokens.css      … デザイントークン（色・文字・余白・角丸・影・動き）。値の変更はここだけ
    base.css        … リセット、要素の初期値、本文幅（.l-container）、ユーティリティ、フォーカスの見え方
    components.css  … 全ページ共通の部品（ヘッダー、メガメニュー、スマホメニュー、ボタン、見出しの型、カード類、フッター）
    top.css         … トップページ固有の並べ方・余白・演出
    plan.css        … プラン一覧の並べ方（p-plan-）
    styleguide.css  … 部品カタログ専用（本番では読み込まない）
  js/
    opening.js      … オープニング（初回／5分以内の再訪／スキップ）
    header.js       … メガメニュー、スマホメニュー
    motion.js       … 見出しのリビール、波線、パララックス、最後の写真の色、流れ星の線
    hero.js         … ヒーロー動画の一時停止
    pickup.js       … Pick Up のスライダー
    top.js          … いまの季節、スマホ横スクロールの点
    map.js          … エリアマップ（Leaflet＋国土地理院タイル）
    ui.js           … 下層の共通の動き（タブ、選べるチップ、下から出るシート）
    plan.js         … プラン一覧の絞り込み・並び替え・ページ送り・特集の導入（URLパラメータと同期）
    devlinks.js     … 確認用。直接開いたときに /plan/ などのリンクを作成済みの静的ページへ置き換える（WPでは読み込まない）
  images/
    icons.svg       … アイコン集（SVGスプライト）
  videos/
```

## アイコン（SVG）

- アイコンは `assets/images/icons.svg` に `<symbol id="i-…">` として集約。使う場所では `<svg aria-hidden="true"><use href="#i-car"/></svg>` と書く（色は currentColor）
- 静的HTMLでは、ブラウザで直接開いても表示されるよう、アイコン集を各ページの `<body>` 直後に1回だけ埋め込んでいる（中身は icons.svg と同じ）
- WP化のときは `<use href="<?php echo get_theme_file_uri('assets/images/icons.svg'); ?>#i-car"/>` の外部参照に切り替えるか、footer.php で icons.svg を1回だけ出力する
- アイコンを足すときは icons.svg に追加し、styleguide.html の一覧にも載せる
- 地図（parts/area-map.svg）は中にリンクがあるため外部ファイルにはせず、`get_template_part` でページに直書きする

## 命名ルール

| 接頭辞 | 用途 | 例 |
|---|---|---|
| `l-` | レイアウト（ページの骨組み） | `l-header` `l-footer` `l-container` `l-main` |
| `c-` | 部品（どのページでも使う） | `c-btn` `c-sec-head` `c-story-card` `c-axis` |
| `p-` | ページ固有 | `p-top-hero` `p-top-pickup` |
| `u-` | ユーティリティ | `u-cover` `u-sp-only` `u-visually-hidden` |
| `is-` | 状態（JSが付け外し） | `is-open` `is-current` `is-shown` |
| `js-` | JSの目印（見た目は付けない） | `js-header` `js-pickup` `js-reveal` |

部品の中の要素は `c-部品名__要素`、バリエーションは `c-部品名--種類`。

## 画面幅の区切り

| 幅 | 主な変化 |
|---|---|
| 〜360px | ヘッダー予約ボタンのアイコンを省略、Pick Up の操作部を詰める |
| 〜768px | スマホ。左右余白20px、カードを縦積み／横スクロール。表は縦積み、予約は画面下の固定バー、絞り込みは下からのシート |
| 〜1024px | 横に置く列（予約ボックス・絞り込み）を本文の下へ |
| 〜900px | フッターのナビを2列 |
| 〜1180px | ハンバーガーメニューに切り替え（メガメニューは出さない） |
| 〜1320px | ヘッダーのSNSボタンを省略 |
| 1680px〜 | ワイド。本文幅は最大1600pxで止め、ヘッダー・写真帯の文字も本文の左端にそろえる。写真や地図を少し大きく |

## 確認用URL

- `?op=first` オープニングを初回として再生／`?op=repeat` 再訪として再生
- `?season=spring|summer|autumn|winter` 「いまの季節」を指定
- プラン一覧：`plan/index.html?axis=katana`（ページの下に特集の紹介が出る）、`?mood=zekkei,onsen&time=4`、`?date=2027-01-15`（運休コースを除く）、`?filter=season`（その条件の選択肢を開く）、`#page-2`（静的HTMLだけ。WPでは `/plan/page/2/`）

## URLのルール

ページのURL・テンプレート・旧URLの転送先は「03_下層WF／大山ワンダー_ディレクトリマップ.html」が正。主な決めごと：
- 気分・季節・テーマは専用ページを作らず、プランの検索結果（`/plan/?mood=zekkei` `?season=autumn` `?axis=katana`）。テーマの条件名は WordPress の予約語 `theme` を避けて `axis`（物語・ジャーナルの絞り込みと共通）。ページ送りは WordPress 標準の `/plan/page/2/`（予約語 `page` をパラメータにしない）。読み物は特集記事（`/journal/katana/`）
- 記事・イベント・お知らせは `/journal|event|news/｛スラッグ｝/`（半角英数とハイフン、イベントは末尾に開催年）
- 地域の人は `/people/brewer-01/`（氏名をURLに入れない）。スポットは単体のページを作らず、公式サイトへの外部リンク
- 予約フォームの確認・完了は `/plan/reserve/confirm/` `/plan/reserve/thanks/`

## WordPress 化のときのメモ

- ヘッダー・スマホメニュー・フッターはテンプレートパーツに切り出す。メガメニューの中身はカスタム投稿・タクソノミーから出力
- CSS は tokens → base → components → ページ別 の順で `wp_enqueue_style`。JS は `defer` のまま `wp_enqueue_script`
- 一覧の繰り返し（カード・行）は1件分のマークアップをそのままループにする
- 画像・動画・テキストは差し替え前提の仮素材

## 下層ページの作り方

- 下層はヘッダー・スマホメニュー・フッターを index.html から写して作る（共通部分を直すときは index.html を直してから下層を作り直す）。`<main class="l-main l-main--sub">` で固定ヘッダーの高さぶん下げる
- 作ったページは devlinks.js の `built` に足す

- まず styleguide.html の部品（`c-`）だけで組む。ページ固有の見た目が必要なときだけ `p-ページ名-` のCSSを作る
- 色・文字サイズ・余白はトークン（tokens.css の変数）を使い、色コードを直接書かない
- 管理画面から入る長い文章は `.c-prose` の中に入れる（見出し・リスト・引用・写真・表の見た目が自動で付く）
