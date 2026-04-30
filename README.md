# Stella Civil Newsroom

LINEオープンチャットの空国家運営向けに作った、民営システム用の静的サイトです。

## できること

- ニュースの閲覧、検索、カテゴリ絞り込み
- ニュース投稿
- 外交マトリクス閲覧
- GAS URL設定によるスプレッドシート連携
- GAS未設定時のサンプルデータ表示とローカル投稿保存

## ファイル

- `index.html`: 画面構造
- `styles.css`: デザイン
- `app.js`: データ取得、投稿、マトリクス描画
- `sample-data.json`: 初期サンプルデータ
- `gas-example.gs`: Google Apps Scriptの雛形

## スプレッドシート構成

`News` シートの列:

```text
id, date, nation, author, category, title, body
```

`Diplomacy` シートの列:

```text
from, to, status, score, note
```

## GAS接続

1. Googleスプレッドシートに `News` と `Diplomacy` シートを作ります。
2. Apps Scriptに `gas-example.gs` の内容を貼ります。
3. `SPREADSHEET_ID` を自分のスプレッドシートIDに変えます。
4. ウェブアプリとしてデプロイします。
5. サイト右上の `GAS設定` にウェブアプリURLを保存します。

GitHub Pagesに置く場合は、このフォルダのファイルをそのまま公開できます。
