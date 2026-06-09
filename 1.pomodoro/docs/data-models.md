# データモデル仕様

タイマーの状態はすべてブラウザの `localStorage` に JSON 形式で保存される。サーバーサイドのデータベースは存在しない。

## ストレージキー

| キー | 説明 |
|---|---|
| `pomodoro.state.v1` | アプリケーション全体の状態スナップショット |

## 状態スナップショット（`pomodoro.state.v1`）

```typescript
{
  settings: {
    workMinutes: number;          // 作業時間（分）
    shortBreakMinutes: number;    // 短休憩時間（分）
    longBreakMinutes: number;     // 長休憩時間（分）
    roundsBeforeLongBreak: number; // 長休憩に入るまでの作業ラウンド数
  };
  mode: "work" | "short_break" | "long_break"; // 現在のフェーズ
  status: "stopped" | "running" | "paused";    // 実行状態
  remainingSeconds: number;       // 現フェーズの残り秒数
  completedWorkSessions: number;  // 完了した作業セッション数
  updatedAt: number;              // 最終保存時刻（Unix ミリ秒）
}
```

### 設定値（`settings`）

| フィールド | 型 | デフォルト | 最小値 | 最大値 | 説明 |
|---|---|---|---|---|---|
| `workMinutes` | `number` | `25` | `1` | `180` | 作業時間（分） |
| `shortBreakMinutes` | `number` | `5` | `1` | `60` | 短休憩時間（分） |
| `longBreakMinutes` | `number` | `15` | `1` | `120` | 長休憩時間（分） |
| `roundsBeforeLongBreak` | `number` | `4` | `1` | `12` | 長休憩までの作業ラウンド数 |

### フェーズ（`mode`）

| 値 | 説明 |
|---|---|
| `work` | 作業セッション |
| `short_break` | 短い休憩 |
| `long_break` | 長い休憩 |

### 実行状態（`status`）

| 値 | 説明 |
|---|---|
| `stopped` | 停止中（初期状態） |
| `running` | タイマー動作中 |
| `paused` | 一時停止中 |

## デフォルト設定

```json
{
  "workMinutes": 25,
  "shortBreakMinutes": 5,
  "longBreakMinutes": 15,
  "roundsBeforeLongBreak": 4
}
```

## バリデーションルール

設定値を保存する前に以下のバリデーションが行われる。すべての値は整数でなければならない。

| フィールド | 条件 |
|---|---|
| `workMinutes` | `1 ≤ workMinutes ≤ 180` |
| `shortBreakMinutes` | `1 ≤ shortBreakMinutes ≤ 60` |
| `longBreakMinutes` | `1 ≤ longBreakMinutes ≤ 120` |
| `roundsBeforeLongBreak` | `1 ≤ roundsBeforeLongBreak ≤ 12` |

バリデーション失敗時は設定を保存せず、エラーメッセージを画面に表示する。

## 復元時の処理

`restoreState()` はページ読み込み時に実行される。

1. `localStorage` から `pomodoro.state.v1` を読み込む
2. 各フィールドのバリデーションを行い、不正な値はデフォルト値で上書きする
3. `status === "running"` だった場合、`updatedAt` と現在時刻の差分（秒）を `applyElapsed()` に渡してタイマーを補正する
4. 設定フォームに保存済みの値を反映する

読み込みや解析に失敗した場合はすべてデフォルト値に戻し、エラーメッセージを表示する。
