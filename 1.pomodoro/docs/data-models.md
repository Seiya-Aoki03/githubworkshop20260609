# データモデル仕様

現在の実装では、サーバーサイドのデータモデルやデータベースは存在しません。すべてのデータはブラウザの `localStorage` にJSON形式で保存されます。

---

## localStorage スキーマ

### キー

```
pomodoro.state.v1
```

### 保存される値（JSON）

```json
{
  "settings": {
    "workMinutes": 25,
    "shortBreakMinutes": 5,
    "longBreakMinutes": 15,
    "roundsBeforeLongBreak": 4
  },
  "mode": "work",
  "status": "stopped",
  "remainingSeconds": 1500,
  "completedWorkSessions": 0,
  "updatedAt": 1717900000000
}
```

---

## フィールド定義

### settings オブジェクト

| フィールド | 型 | デフォルト | 最小値 | 最大値 | 説明 |
|---|---|---|---|---|---|
| `workMinutes` | `number`（整数） | `25` | `1` | `180` | 作業時間（分） |
| `shortBreakMinutes` | `number`（整数） | `5` | `1` | `60` | 短い休憩時間（分） |
| `longBreakMinutes` | `number`（整数） | `15` | `1` | `120` | 長い休憩時間（分） |
| `roundsBeforeLongBreak` | `number`（整数） | `4` | `1` | `12` | 長い休憩に入るまでの作業セッション数 |

### トップレベルフィールド

| フィールド | 型 | 取りうる値 | 説明 |
|---|---|---|---|
| `mode` | `string` | `work` / `short_break` / `long_break` | 現在の作業フェーズ |
| `status` | `string` | `stopped` / `running` / `paused` | タイマーの実行状態 |
| `remainingSeconds` | `number`（整数） | `1` 〜 現在フェーズの秒数 | 現在フェーズの残り秒数 |
| `completedWorkSessions` | `number`（整数） | `0` 以上 | 完了した作業セッション数 |
| `updatedAt` | `number` | Unix ミリ秒 | 最後に保存した時刻（ページ再読込後の経過時間計算に使用） |

---

## バリデーション

`settings` の各フィールドは保存・復元時にバリデーションされます。値が不正な場合はデフォルト設定が使用されます。

`remainingSeconds` の復元時、値が `1` 未満または現在フェーズの最大秒数を超える場合は、現在フェーズの最大秒数にリセットされます。

---

## ページ再読込後の状態復元

`status` が `running` だった場合、`updatedAt` と現在時刻の差分（秒）を計算し、その経過時間分だけ状態を進めます。これにより、ページを閉じている間もタイマーが正確に動いていたかのように動作します。

復元中にエラーが発生した場合は、すべてデフォルト値にリセットされます。
