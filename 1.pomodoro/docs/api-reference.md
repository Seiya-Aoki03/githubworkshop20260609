# API リファレンス

## 概要

このアプリケーションはサーバーサイド API を持たない。Flask は HTML ページの配信のみを行い、タイマーのロジックはすべてブラウザ上の JavaScript で処理される。

## エンドポイント

### `GET /`

メインページを返す。

| 項目 | 内容 |
|---|---|
| メソッド | GET |
| パス | `/` |
| 説明 | ポモドーロタイマーの HTML ページを返す |

#### レスポンス

| ステータスコード | Content-Type | 説明 |
|---|---|---|
| 200 OK | `text/html` | `templates/index.html` のレンダリング結果 |

#### レスポンス例

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

HTML ページが返される。ページには以下が含まれる。

- タイマー表示セクション
- 操作ボタン（Start / Stop / Resume / Reset）
- 設定フォーム（作業時間・休憩時間・長休憩・ラウンド数）
- `static/css/style.css` および `static/js/app.js` への参照

## 静的アセット

Flask の `static` ディレクトリを通じて以下のアセットが配信される。

| パス | 種別 | 説明 |
|---|---|---|
| `/static/css/style.css` | CSS | アプリケーションのスタイルシート |
| `/static/js/app.js` | JavaScript | タイマーロジックおよび UI 制御 |

## 将来の拡張

`architecture.md` に記載されているとおり、将来的には以下の API を追加できる設計となっている。

- 設定取得・保存 API
- セッション履歴保存 API
- 統計取得 API
