# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Slack Custom Emoji Manager — Slackのカスタム絵文字管理ページに一括追加・一括削除・一括ダウンロード(zip)機能を追加するChrome拡張機能（Manifest V3）。

## 開発コマンド

```bash
npm ci                  # 依存インストール
npm run dev             # 開発モード（HMR付き）
npm run build           # 本番ビルド
npm run zip             # 配布用zip作成
npm run lint            # oxlint によるリント
npm run fmt             # oxfmt によるフォーマット
npm run fmt:check       # フォーマットチェック
```

ビルド成果物は `.output/chrome-mv3/` に出力される。Chrome の「パッケージ化されていない拡張機能を読み込む」で `.output/chrome-mv3/` を指定して動作確認する。

## 技術スタック

- **ビルド:** WXT (Vite ベース Chrome 拡張フレームワーク)
- **言語:** TypeScript (strict mode)
- **UI:** Svelte 5（ポップアップ画面、Runes 使用）
- **スタイル:** SCSS (`@use` を使用、`@import` は非推奨)
- **Lint:** oxlint
- **Format:** oxfmt (singleQuote, printWidth: 100)
- **i18n:** Chrome Extension i18n API (`public/_locales/` に en/ja)

## アーキテクチャ

### エントリポイント（WXT）

| エントリ | 出力 | 役割 |
|---|---|---|
| `entrypoints/content.ts` | content-scripts/content.js | Slackページに注入。メインUI・絵文字操作ロジック |
| `entrypoints/background.ts` | background.js | Service Worker。Slack APIリクエスト監視・絵文字数リアルタイム更新 |
| `entrypoints/popup/` | popup.html + popup.js | 拡張ポップアップ。Svelteアプリ（ワークスペース選択・設定） |

### 主要モジュール

- **lib/slack.ts** — Slack API ラッパー。ページ埋め込みスクリプトからトークン抽出、emoji.list / emoji.add / emoji.remove を fetch で呼び出す
- **lib/jobQueue.ts** — 並行数制限付き非同期ジョブキュー（ダウンロード: 5並行、アップロード/削除: 1並行）
- **lib/storage.ts** — `chrome.storage.local` の型安全ラッパー
- **lib/element.ts** — `public/index.html` からHTMLテンプレートを動的ロード・キャッシュ（i18n変数置換）
- **lib/util.ts** — sleep / retry（HTTP 429対応） / formatDate / downloadBlob
- **lib/handleAddRemoveEmoji.ts** — 絵文字追加・削除リクエストの監視（background から呼ばれる）
- **components/** — 共有 Svelte コンポーネント（Option.svelte, Toggle.svelte）

### 設定ファイル

- **wxt.config.ts** — WXT設定 + manifest定義（`public/manifest.json` は不要、WXTが自動生成）
- **.oxlintrc.json** — oxlint 設定
- **.oxfmtrc.json** — oxfmt 設定

### データフロー

```
content.ts ←→ lib/slack.ts (fetch API呼び出し)
content.ts ←→ lib/element.ts (UI生成)
content.ts ← chrome.runtime.onMessage ← background.ts (cem:add / cem:remove)
popup (Svelte) ←→ lib/storage.ts ←→ chrome.storage.local
```

### CORS対応

`public/rules.json` で Declarative Net Request を使い、`emoji.slack-edge.com` のレスポンスに `Access-Control-Allow-Origin: *` を付与。

### レート制限戦略

- HTTP 429 に対して HttpError を throw し、retry で 3回・3000ms間隔でリトライ
- 削除・アップロードは並行数1で逐次実行
