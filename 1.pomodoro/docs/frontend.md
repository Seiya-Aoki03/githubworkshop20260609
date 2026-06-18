# フロントエンドモジュール仕様

## ファイル構成

| ファイル | 説明 |
|---|---|
| `static/js/app.js` | タイマーのすべてのロジックと UI 制御 |
| `static/css/style.css` | レイアウト・デザイン定義 |
| `templates/index.html` | HTML テンプレート |

---

## app.js

`DOMContentLoaded` イベント発火後に初期化される単一モジュール構成です。

### 定数

| 定数 | 説明 |
|---|---|
| `STORAGE_KEY` | `'pomodoro.state.v1'` — localStorage のキー |
| `DEFAULT_SETTINGS` | タイマーのデフォルト設定値 |
| `SETTINGS_LIMITS` | 各設定値の最小値・最大値 |

### 状態変数

| 変数 | 初期値 | 説明 |
|---|---|---|
| `settings` | `DEFAULT_SETTINGS` のコピー | 現在の設定値 |
| `mode` | `'work'` | 現在のフェーズ |
| `remainingSeconds` | `settings.workMinutes * 60` | 残り秒数 |
| `intervalId` | `null` | `setInterval` の ID |
| `status` | `'stopped'` | タイマーの実行状態 |
| `completedWorkSessions` | `0` | 完了した作業セッション数 |

### 主要な関数

#### `formatTime(seconds)`

秒数を `MM:SS` 形式の文字列に変換して返します。

```js
formatTime(90); // => "01:30"
```

#### `modeMeta()`

現在の `mode` に応じたバッジ文字列・見出し・サブタイトル・フェーズ時間（秒）を返します。

#### `statusLabel()`

現在の `status` に応じた表示文字列（`'Running'` / `'Paused'` / `'Stopped'`）を返します。

#### `currentSessionNumber()`

現在のセッション番号を返します。作業中は `completedWorkSessions + 1`、休憩中は `completedWorkSessions` です。

#### `updateView()`

DOM 全体を現在の状態で更新し、`persistState()` を呼び出します。更新対象は以下の要素です。

| 要素ID | 表示内容 |
|---|---|
| `timerDisplay` | 残り時間（`MM:SS`） |
| `timer-heading` | 現在フェーズの見出し |
| `modeBadge` | モードバッジ（`Work` / `Short Break` / `Long Break`） |
| `sessionBadge` | セッション番号（`Session N`） |
| `timerSubtitle` | 状態に応じたサブタイトル |
| `remainingSummary` | 残り時間（分単位、切り上げ） |
| `statusSummary` | 実行状態のラベル |
| `workSummary`（`phaseDurationSummary`） | 現在フェーズの合計時間（分） |

ボタンの `disabled` 状態も `status` に応じて制御されます。

| ボタン | 有効になる条件 |
|---|---|
| Start | `status === 'stopped'` |
| Stop | `status === 'running'` |
| Resume | `status === 'paused'` |
| Reset | 常時有効 |

#### `startTimer()`

`status` が `'stopped'` のときのみ実行。`status` を `'running'` に変更し、1秒インターバルを開始します。

#### `stopTimer()`

`status` が `'running'` のときのみ実行。インターバルを停止し、`status` を `'paused'` にします。

#### `resumeTimer()`

`status` が `'paused'` のときのみ実行。`status` を `'running'` に戻し、インターバルを再開します。

#### `resetTimer()`

インターバルを停止し、`status` / `mode` / `remainingSeconds` / `completedWorkSessions` をすべて初期値に戻します。

#### `moveToNextMode()`

現在のフェーズが `'work'` の場合、`completedWorkSessions` をインクリメントし、`roundsBeforeLongBreak` の倍数であれば `'long_break'` に、それ以外は `'short_break'` に遷移します。それ以外のフェーズからは `'work'` に戻ります。

#### `persistState()`

現在の状態を `localStorage` に JSON 形式で保存します。保存失敗時はエラーを無視してタイマーの動作を継続します。

#### `restoreState()`

ページ読み込み時に `localStorage` から状態を復元します。`status` が `'running'` だった場合は、`updatedAt` との差分から経過時間を計算し `applyElapsed()` で状態を進めます。

#### `applyElapsed(elapsedSeconds)`

指定した経過秒数分だけ状態を進めます。フェーズをまたぐ場合は `moveToNextMode()` を繰り返し呼び出します。

#### `saveSettings()`

フォームの入力値をバリデーションし、有効であれば `settings` を更新して `resetTimer()` を呼び出します。

---

## style.css

### デザイントークン（CSS カスタムプロパティ）

| 変数 | 値 | 用途 |
|---|---|---|
| `--bg` | `#f5efe6` | ページ背景色 |
| `--panel` | `#fffaf3` | カードの背景色 |
| `--panel-strong` | `#fff4e8` | ヒーローパネルのグラデーション終端色 |
| `--text` | `#2e2520` | メインテキスト色 |
| `--muted` | `#7d6c61` | 補助テキスト色 |
| `--accent` | `#db724d` | アクセントカラー（ボタン・バッジ等） |
| `--accent-hover` | `#c95f3b` | ボタンホバー時のアクセントカラー |
| `--accent-soft` | `rgba(219, 114, 77, 0.12)` | アクティブバッジの背景色 |
| `--border` | `rgba(46, 37, 32, 0.12)` | ボーダー色 |
| `--shadow` | `0 28px 90px rgba(68, 49, 34, 0.12)` | カードのドロップシャドウ |

### 主要なクラス

| クラス | 説明 |
|---|---|
| `.app-shell` | ページ全体のグリッドコンテナ |
| `.hero-panel` | アプリタイトルと状態バッジを含むヘッダーエリア |
| `.timer-card` | タイマー表示と操作ボタンを含むカード |
| `.settings-card` | 設定フォームを含むカード |
| `.state-badge` | モード・セッション番号のバッジ |
| `.state-badge--active` | アクティブ状態のバッジ |
| `.timer-display` | 残り時間の大型表示 |
| `.timer-summary` | Remaining / Status / Phase duration の3列グリッド |
| `.settings-grid` | 設定入力フィールドの2列グリッド |
| `.settings-message--error` | エラーメッセージ（赤色） |
| `.settings-message--success` | 成功メッセージ（緑色） |

### レスポンシブ対応

ビューポート幅が `480px` 以下の場合、以下のレイアウト変更が適用されます。

- `.hero-panel` / `.timer-card__header` / `.section-heading` が縦並びに変更
- `.timer-summary` / `.settings-grid` が1列に変更
- `.timer-actions` が縦並びに変更
- すべてのボタンが幅 100% に変更

---

## index.html

### HTML 構造

```
main.app-shell
├── section.hero-panel          ← アプリタイトル・状態バッジ
│   ├── div.hero-copy
│   │   ├── p.eyebrow
│   │   ├── h1#app-title
│   │   └── p.hero-description
│   └── div.hero-badge-group
│       ├── span#modeBadge
│       └── span#sessionBadge
├── section.timer-card          ← タイマー表示・操作ボタン
│   ├── div.timer-card__header
│   │   ├── h2#timer-heading
│   │   └── p#timerSubtitle
│   ├── div#timerDisplay
│   ├── div.timer-summary
│   │   ├── strong#remainingSummary
│   │   ├── strong#statusSummary
│   │   └── strong#workSummary
│   └── div.timer-actions
│       ├── button#startButton
│       ├── button#stopButton
│       ├── button#resumeButton
│       └── button#resetButton
└── section.settings-card       ← 設定フォーム
    ├── div.section-heading
    ├── div.settings-grid
    │   ├── input#workMinutesInput
    │   ├── input#shortBreakMinutesInput
    │   ├── input#longBreakMinutesInput
    │   └── input#roundsBeforeLongBreakInput
    └── div.settings-actions
        ├── button#saveSettingsButton
        └── p#settingsStatus
```
