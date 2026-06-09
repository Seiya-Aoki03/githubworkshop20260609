# アーキテクチャ概要

## 現在の構成

```
1.pomodoro/
  app.py                  # Flask アプリケーションエントリーポイント
  requirements.txt        # Python 依存パッケージ
  templates/
    index.html            # メインHTMLテンプレート
  static/
    css/
      style.css           # スタイルシート
    js/
      app.js              # タイマーロジック・UI制御
    img/                  # 画像アセット
  tests/
    test_app.py           # Flask ルートの統合テスト
```

## 層の分離

### Flask 層（`app.py`）

責務を最小限に絞った薄い層。

- `GET /` で `index.html` をレンダリングして返す
- 静的アセット（CSS・JS）の配信
- タイマーの状態管理は行わない

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")
```

### テンプレート層（`templates/index.html`）

画面の骨組みのみを定義する。ロジックを持たない。

主な要素：
- ヒーローパネル（タイトル・状態バッジ）
- タイマーカード（プログレスリング・時間表示・操作ボタン）
- 設定カード（入力フォーム・保存ボタン）

### CSS 層（`static/css/style.css`）

レイアウトと視覚表現を担当する。

- CSS カスタムプロパティによるテーマ管理
- レスポンシブ対応（480px 以下でモバイルレイアウトに切替）
- タイマー状態（`timer-card--focus`）に応じたアニメーション

### JavaScript 層（`static/js/app.js`）

タイマーの状態管理と UI 更新をすべて担う単一ファイル。

主な責務：
- タイマーの状態管理（`status`・`mode`・`remainingSeconds`）
- `setInterval` によるカウントダウン処理
- フェーズ自動切り替え（作業 → 短休憩 → 長休憩）
- 設定値のバリデーションと保存
- `localStorage` による状態の永続化と復元
- DOM 更新（時間表示・プログレスリング・ボタン有効/無効）

## 状態管理

### `status`（実行状態）

| 値 | 説明 |
|---|---|
| `stopped` | 停止中（初期状態） |
| `running` | 実行中 |
| `paused` | 一時停止中 |

### `mode`（フェーズ）

| 値 | 説明 |
|---|---|
| `work` | 作業時間 |
| `short_break` | 短い休憩 |
| `long_break` | 長い休憩 |

## 状態遷移

```
stopped ──[Start]──► running ──[Stop]──► paused
   ▲                    │                   │
   │                    │                   │
   └────[Reset]─────────┘     [Resume]──────┘

running: 残り時間 0 → moveToNextMode() → mode が変わり remainingSeconds リセット
```

## localStorage による状態永続化

キー `pomodoro.state.v1` に以下の JSON を保存する。

```json
{
  "settings": { "workMinutes": 25, "shortBreakMinutes": 5, "longBreakMinutes": 15, "roundsBeforeLongBreak": 4 },
  "mode": "work",
  "status": "stopped",
  "remainingSeconds": 1500,
  "completedWorkSessions": 0,
  "updatedAt": 1749449165000
}
```

ページ読み込み時に `restoreState()` が呼ばれ、保存済み状態を復元する。`status` が `running` だった場合は `updatedAt` との差分から経過時間を計算してタイマーを補正する。

## 依存関係

- **Python**: Flask（バージョンは `requirements.txt` 参照）
- **フロントエンド**: 外部ライブラリなし（バニラ JavaScript）
- **テスト**: Python 標準ライブラリ `unittest`
