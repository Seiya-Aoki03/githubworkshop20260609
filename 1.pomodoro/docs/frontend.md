# フロントエンドドキュメント

## 概要

フロントエンドは外部ライブラリを使用しないバニラ JavaScript で実装されている。すべてのロジックは `static/js/app.js` 単一ファイルに収められ、`DOMContentLoaded` イベント内でスコープが閉じている。

## ファイル構成

| ファイル | 説明 |
|---|---|
| `static/js/app.js` | タイマーロジック・UI制御・状態管理 |
| `static/css/style.css` | スタイルシート |
| `templates/index.html` | HTML テンプレート |

---

## `static/js/app.js`

### 定数

| 定数 | 値 | 説明 |
|---|---|---|
| `STORAGE_KEY` | `"pomodoro.state.v1"` | localStorage のキー名 |
| `DEFAULT_SETTINGS` | `{ workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, roundsBeforeLongBreak: 4 }` | デフォルト設定値 |
| `SETTINGS_LIMITS` | 各設定の `min`・`max` | 入力値バリデーション範囲 |

### 状態変数

| 変数 | 初期値 | 説明 |
|---|---|---|
| `settings` | `DEFAULT_SETTINGS` のコピー | 現在の設定値 |
| `mode` | `"work"` | 現在のフェーズ |
| `remainingSeconds` | `settings.workMinutes * 60` | 残り秒数 |
| `intervalId` | `null` | `setInterval` のID |
| `status` | `"stopped"` | 実行状態 |
| `completedWorkSessions` | `0` | 完了した作業セッション数 |
| `progressCircumference` | `2π × r` | プログレスリングの円周（SVG `r` 属性から計算） |

### 主要関数

#### タイマー操作

| 関数 | 説明 |
|---|---|
| `startTimer()` | `status === "stopped"` のときタイマーを開始し `status = "running"` にする |
| `stopTimer()` | `status === "running"` のとき一時停止し `status = "paused"` にする |
| `resumeTimer()` | `status === "paused"` のとき再開し `status = "running"` にする |
| `resetTimer()` | タイマーを停止し、`mode = "work"`・`completedWorkSessions = 0`・残り秒数をリセットする |
| `runInterval()` | `setInterval` を開始し、1秒ごとに `remainingSeconds` を減算する |
| `stopInterval()` | `clearInterval` で `setInterval` を停止する |

#### フェーズ管理

| 関数 | 説明 |
|---|---|
| `moveToNextMode()` | `mode` が `work` のとき `completedWorkSessions` を加算し、次のフェーズ（`short_break` または `long_break`）に移行する。ブレーク中のときは `work` に戻る |
| `secondsForMode(targetMode)` | 指定フェーズの秒数を返す |
| `applyElapsed(elapsedSeconds)` | 経過秒数分だけ `moveToNextMode()` を繰り返してタイマーを補正する（ページ復元時に使用） |

#### フェーズ切り替えロジック

```
work → completedWorkSessions % roundsBeforeLongBreak === 0 → long_break
work → それ以外 → short_break
short_break / long_break → work
```

#### 表示更新

| 関数 | 説明 |
|---|---|
| `updateView()` | 全DOM要素を現在の状態で更新し `persistState()` を呼ぶ |
| `modeMeta()` | 現在の `mode` に応じた `badge`・`heading`・`subtitle`・`durationSeconds` を返す |
| `statusLabel()` | `status` の表示文字列（Running / Paused / Stopped）を返す |
| `currentSessionNumber()` | 表示用セッション番号（`completedWorkSessions + (mode === "work" ? 1 : 0)`）を返す |

#### プログレスリング

プログレスリングは SVG の `<circle id="progressCircle">` で実装されている。

- `strokeDasharray`: 円周（`2π × r`）を設定
- `strokeDashoffset`: `circumference × (1 - remainingRatio)` で進捗を表現
- `stroke` の色: `progressColor(remainingRatio)` で HSL カラーを補間

```
remainingRatio = 1.0 → hsl(210 ...) （青）
remainingRatio = 0.5 → hsl(50 ...)  （黄）
remainingRatio = 0.0 → hsl(0 ...)   （赤）
```

`lerp()` 関数で2段階の線形補間を行っている。

#### 設定管理

| 関数 | 説明 |
|---|---|
| `readSettingsFromInputs()` | フォームの入力値を読み取り、バリデーション結果 `{ ok, value/message }` を返す |
| `writeSettingsToInputs()` | 現在の `settings` をフォームに反映する |
| `saveSettings()` | バリデーション通過後に `settings` を更新し `resetTimer()` を呼ぶ |
| `setSettingsMessage(message, type)` | 設定ステータスメッセージを表示する（`"info"` / `"error"` / `"success"`） |

#### 状態永続化

| 関数 | 説明 |
|---|---|
| `persistState()` | 現在の状態を `localStorage` に保存する。失敗時は無視する |
| `restoreState()` | ページ読み込み時に `localStorage` から状態を復元する |

### イベントリスナー

| 要素 ID | イベント | 呼び出し関数 |
|---|---|---|
| `startButton` | `click` | `startTimer()` |
| `stopButton` | `click` | `stopTimer()` |
| `resumeButton` | `click` | `resumeTimer()` |
| `resetButton` | `click` | `resetTimer()` |
| `saveSettingsButton` | `click` | `saveSettings()` |

### ボタン有効/無効の制御

`updateView()` 内でタイマーの状態に応じてボタンの `disabled` を制御する。

| ボタン | 有効な条件 |
|---|---|
| Start | `status === "stopped"` |
| Stop | `status === "running"` |
| Resume | `status === "paused"` |
| Reset | 常に有効 |

---

## `static/css/style.css`

### CSS カスタムプロパティ（`:root`）

| 変数 | 値 | 用途 |
|---|---|---|
| `--bg` | `#f5efe6` | 背景色 |
| `--panel` | `#fffaf3` | カード背景色 |
| `--panel-strong` | `#fff4e8` | カード強調背景色 |
| `--text` | `#2e2520` | テキスト色 |
| `--muted` | `#7d6c61` | 補助テキスト色 |
| `--accent` | `#db724d` | アクセントカラー（ボタンなど） |
| `--accent-hover` | `#c95f3b` | ホバー時アクセントカラー |
| `--accent-soft` | `rgba(219,114,77,0.12)` | 薄いアクセントカラー |
| `--border` | `rgba(46,37,32,0.12)` | ボーダー色 |
| `--shadow` | `0 28px 90px ...` | カードシャドウ |
| `--progress-color` | `hsl(210 80% 50%)` | プログレスリングの色（JS から動的に更新） |

### 主要クラス

| クラス | 説明 |
|---|---|
| `.app-shell` | ページ全体のグリッドコンテナ |
| `.hero-panel` | タイトルと状態バッジを表示するパネル |
| `.timer-card` | プログレスリング・時間表示・操作ボタンを含むカード |
| `.timer-card--focus` | 作業中 (`mode === "work" && status === "running"`) に付与されるクラス。フォーカスアニメーションを有効化 |
| `.settings-card` | 設定フォームを含むカード |
| `.progress-ring` | SVG プログレスリング |
| `.progress-ring__track` | プログレスリングの背景トラック |
| `.progress-ring__progress` | プログレスリングの進捗インジケーター |
| `.focus-effect` | 作業中に表示されるアニメーションエフェクト |
| `.state-badge` | モード・セッション番号のバッジ |
| `.state-badge--active` | アクティブなバッジのスタイル |
| `.settings-message--error` | エラーメッセージの色（赤） |
| `.settings-message--success` | 成功メッセージの色（緑） |

### レスポンシブ対応

`@media (max-width: 480px)` でモバイルレイアウトに切り替わる。

- `.hero-panel`・`.timer-card__header`・`.section-heading` が縦並びになる
- `.timer-summary`・`.settings-grid` が1カラムになる
- `.timer-actions` のボタンが縦並び・全幅になる

---

## `templates/index.html`

Jinja2 テンプレート。Flask の `render_template("index.html")` で配信される。

### セクション構成

| セクション | ID / クラス | 説明 |
|---|---|---|
| ヒーローパネル | `.hero-panel` | タイトル・説明文・状態バッジ |
| タイマーカード | `.timer-card` | プログレスリング・時間表示・サマリー・操作ボタン |
| 設定カード | `.settings-card` | 設定入力フォーム・保存ボタン |

### 主要な要素 ID

| ID | 要素 | 説明 |
|---|---|---|
| `timerDisplay` | `div` | タイマーの残り時間表示（`MM:SS` 形式）、`aria-live="polite"` |
| `progressCircle` | `circle` | SVG プログレスリングの進捗部分、`r="52"` |
| `modeBadge` | `span` | 現在のモード表示（Work / Short Break / Long Break） |
| `sessionBadge` | `span` | 現在のセッション番号表示 |
| `timerSubtitle` | `p` | タイマーの状態補足テキスト |
| `remainingSummary` | `strong` | 残り時間（分単位の概算） |
| `statusSummary` | `strong` | 実行状態（Running / Paused / Stopped） |
| `workSummary` | `strong` | 現フェーズの合計時間（分） |
| `timer-heading` | `h2` | タイマーカードの見出し |
| `startButton` | `button` | 開始ボタン |
| `stopButton` | `button` | 停止ボタン（初期 disabled） |
| `resumeButton` | `button` | 再開ボタン（初期 disabled） |
| `resetButton` | `button` | リセットボタン |
| `workMinutesInput` | `input[type=number]` | 作業時間入力（min=1, max=180） |
| `shortBreakMinutesInput` | `input[type=number]` | 短休憩時間入力（min=1, max=60） |
| `longBreakMinutesInput` | `input[type=number]` | 長休憩時間入力（min=1, max=120） |
| `roundsBeforeLongBreakInput` | `input[type=number]` | 長休憩までのラウンド数入力（min=1, max=12） |
| `saveSettingsButton` | `button` | 設定保存ボタン |
| `settingsStatus` | `p` | 設定操作のフィードバックメッセージ、`role="status"`, `aria-live="polite"` |
| `focusEffect` | `div` | 作業中のフォーカスアニメーション要素（`aria-hidden="true"`） |
