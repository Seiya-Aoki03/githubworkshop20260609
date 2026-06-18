# アーキテクチャ概要

## 現在の構成

```
1.pomodoro/
├── app.py              # Flask アプリケーション
├── requirements.txt    # 依存パッケージ
├── templates/
│   └── index.html      # メインページのHTMLテンプレート
├── static/
│   ├── css/
│   │   └── style.css   # スタイルシート
│   ├── js/
│   │   └── app.js      # フロントエンドのタイマーロジック
│   └── img/
│       └── pomodoro.png
└── tests/
    └── test_app.py     # Flask ルートのテスト
```

---

## 各層の責務

### Flask 層（`app.py`）

- `GET /` で `templates/index.html` をレンダリングして返す
- タイマーの状態遷移・ビジネスロジックは持たない
- 依存: `Flask >= 3.0, < 4.0`

### テンプレート層（`templates/index.html`）

- ポモドーロタイマーの UI 構造を定義する
- JavaScript と CSS を読み込む
- DOM 要素の ID を通じて JavaScript と連携する

### CSS 層（`static/css/style.css`）

- CSS カスタムプロパティによるデザイントークン管理
- レスポンシブデザイン（ブレークポイント: 480px）
- 状態バッジ・タイマー表示・設定フォームのレイアウト定義

### JavaScript 層（`static/js/app.js`）

- タイマーのすべての状態管理と UI 更新を担当
- `localStorage` を用いた状態の永続化と復元
- DOM の準備完了後（`DOMContentLoaded`）に初期化

---

## データフロー

```
ユーザー操作（ボタンクリック）
    ↓
app.js のイベントハンドラ
    ↓
タイマー状態の更新（status / mode / remainingSeconds）
    ↓
updateView() で DOM を更新
    ↓
persistState() で localStorage に保存
```

---

## 状態管理

タイマーの状態は JavaScript の変数として管理されます。

| 変数名 | 型 | 説明 |
|---|---|---|
| `status` | `string` | 実行状態（`stopped` / `running` / `paused`） |
| `mode` | `string` | 作業フェーズ（`work` / `short_break` / `long_break`） |
| `remainingSeconds` | `number` | 現在のフェーズの残り秒数 |
| `completedWorkSessions` | `number` | 完了した作業セッション数 |
| `settings` | `object` | タイマーの設定値 |

---

## 依存関係

- **バックエンド**: Python + Flask のみ。データベースや外部サービスへの依存はありません。
- **フロントエンド**: 外部 JavaScript ライブラリへの依存はありません。ネイティブ Web API（`setInterval`、`localStorage`）のみを使用します。
