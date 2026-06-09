# API リファレンス

## 概要

現在の実装では、Flask サーバーは HTML 配信のみを担当しています。REST API エンドポイントは実装されていません。タイマーのすべての状態管理はブラウザ側の JavaScript で行われます。

---

## エンドポイント一覧

### GET /

トップページの HTML を返します。

#### リクエスト

```http
GET / HTTP/1.1
Host: localhost:5000
```

#### レスポンス

| ステータスコード | Content-Type | 説明 |
|---|---|---|
| `200 OK` | `text/html` | ポモドーロタイマーの HTML ページ |

#### レスポンス例

```html
<!doctype html>
<html lang="ja">
  <head>
    <title>Pomodoro Timer</title>
    ...
  </head>
  <body>
    ...
  </body>
</html>
```

---

## 注意事項

- 設定の保存・復元は `localStorage` を使ってブラウザ側で完結しており、サーバーとの通信は発生しません。
- 将来的に設定保存 API や履歴 API の追加が想定されていますが、現時点では未実装です。
