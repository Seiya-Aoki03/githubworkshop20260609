---
emoji: 📝
name: Sync copilotWebRelay Docs
description: copilotWebRelay 配下のコードが更新された際にドキュメンテーションを自動更新する
on:
  push:
    branches: [main]
    paths:
      - "2.copilotWebRelay/**"
      - "!2.copilotWebRelay/docs/**"
permissions:
  contents: read
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
network:
  allowed: [defaults, github]
safe-outputs:
  create-pull-request:
    title-prefix: "[docs] "
    labels: [documentation]
    draft: true
    allowed-files:
      - "2.copilotWebRelay/docs/**"
---

# copilotWebRelay ドキュメント自動同期

## タスク

`2.copilotWebRelay/` 配下のソースコードが更新されました。ソースコードの内容を分析し、`2.copilotWebRelay/docs/` 配下のドキュメンテーションを最新の状態に更新してください。

## 手順

1. `2.copilotWebRelay/` 配下の全ソースコードファイル（`docs/` を除く）を読み込む
2. 既存の `2.copilotWebRelay/docs/` 配下のドキュメントを確認する
3. ソースコードとドキュメントを比較し、差分を特定する
4. ドキュメントを更新または新規作成して、ソースコードの内容を正確に反映する

## ドキュメント更新ルール

- 関数、クラス、モジュールの説明を正確に記述する
- API エンドポイントがある場合は、リクエスト/レスポンスの仕様を記載する
- 設定ファイルの変更があれば、設定項目の説明を更新する
- 新しいファイルが追加された場合は、対応するドキュメントを新規作成する
- 削除されたファイルに対応するドキュメントは、その旨を明記する
- ドキュメントは日本語で記述する

## 出力

- `create-pull-request` を使用して、ドキュメントの更新をプルリクエストとして作成する
- 変更がない場合は `noop` を使用し、「ドキュメントは最新です」と報告する
