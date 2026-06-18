# 平面グラフ作成ゲーム

与えられたグラフの頂点を動かして、辺が交差しない **平面グラフ** を完成させるパズルゲームです。

**プレイはこちら** → https://kuradai33.github.io/webVanilla_graphGame/

---

## ゲームについて

グラフ理論における **平面グラフ**（辺が交差しないように描けるグラフ）をテーマにしたパズルです。  
画面上に頂点と辺が散らばった状態でラウンドが始まり、すべての辺の交差がなくなるとクリアになります。

辺が交差している箇所には火花エフェクトが表示されるので、どこを直せばよいかひと目でわかります。

---

## 遊び方

1. 画面上の **頂点（丸い点）をドラッグ** して動かします。
2. 辺（線）が交差しなくなるとラウンドクリアです。
3. タイムアタックモードでは、5 ラウンドの合計タイムを競います。

---

## ゲームモード

| モード | ラウンド数 | 難易度 |
|---|---|---|
| **タイムアタック** | 5 ラウンド（ラウンドごとに頂点数が増加） | easy / normal / hard |
| **アーケード** | 1 ラウンド | 難易度 1〜10（プレイヤーが選択） |

- タイムアタックの結果はローカルストレージに最大 50 件保存されます。
- アーケードモードは一定条件を満たすと解放されます。

---

## 技術スタック

| 種別 | 採用技術 |
|---|---|
| 言語 | TypeScript（strict モード） |
| レンダリング | HTML5 Canvas API |
| ビルド | Webpack 5 + webpack-dev-server |
| テスト | Vitest |
| パッケージマネージャ | pnpm（npm / yarn 不可） |
| フレームワーク | なし（バニラ実装） |

---

## 開発環境のセットアップ

**前提条件**

- Node.js v18 以上（動作確認: v20）
- pnpm（`npm install -g pnpm` でインストール）

```bash
git clone https://github.com/kuradai33/webVanilla_graphGame.git
cd webVanilla_graphGame
pnpm install
pnpm start        # ブラウザが自動で開きます
```

> `preinstall` フックにより npm / yarn は使用できません。必ず `pnpm` を使ってください。

---

## コマンド

```bash
pnpm start        # 開発サーバー起動（ホットリロード、ブラウザ自動オープン）
pnpm build        # プロダクションビルド → docs/main.js
pnpm test         # Vitest 単発実行
pnpm test:watch   # Vitest ウォッチモード
```

ビルド成果物は `docs/` ディレクトリに出力され、GitHub Pages から直接配信されます。

---

## ディレクトリ構造

```
.
├── docs/                        # GitHub Pages 配信ディレクトリ
│   ├── index.html
│   ├── style.css
│   └── main.js                  # ビルド成果物
├── src/
│   ├── index.ts                 # エントリポイント
│   ├── define.ts                # ゲーム定数（頂点数・ラウンド数・FPS など）
│   ├── util.ts                  # 汎用ユーティリティ（ReverseQueue など）
│   ├── pages/
│   │   ├── Page.ts              # ページ基底クラス
│   │   ├── PageManager.ts       # シングルトン・ルーター & AppState 管理
│   │   ├── TitlePage.ts         # タイトル画面
│   │   ├── GamePage.ts          # ゲーム画面
│   │   └── ResultPage.ts        # リザルト画面
│   ├── game/
│   │   ├── GameEngine.ts        # ゲームループ・マウスイベント管理
│   │   └── Timer.ts             # アニメーションループ & フレームタイミング
│   ├── graph/
│   │   ├── Graph.ts             # グラフ本体・Canvas 描画・交差判定
│   │   ├── PlaneGraphGenerator.ts   # グラフ生成基底クラス
│   │   ├── DelaunayPlaneGraphGen.ts # Bowyer–Watson 法によるドロネー三角形分割
│   │   └── LeftRightGen.ts      # 別のグラフ生成アルゴリズム
│   └── render/
│       ├── GameBackground.ts    # 背景グリッド描画
│       ├── NeonStopwatch.ts     # タイマー HUD
│       ├── RoundLamps.ts        # ラウンド進捗インジケーター HUD
│       └── spark.ts             # 辺の交差点へのパーティクルエフェクト
├── tests/                       # Vitest テストファイル
├── CLAUDE.md                    # Claude Code 向けプロジェクト説明
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── webpack.config.js
```

---

## アーキテクチャ概要

### ページシステム

`PageManager`（シングルトン）が `AppState` を保持し、`manager.goto("title" | "game" | "result")` で画面を切り替えます。各ページは `Page` を継承して `display()` を実装し、`root.innerHTML` を書き換えます。

### グラフ生成

`DelaunayPlaneGraphGen` が **Bowyer–Watson 法**（ドロネー三角形分割）で平面グラフを生成します。生成後、エンジンが頂点をランダムに並べ替え、交差点が 3 つ以上になるまで（最大 100 回）シャッフルしてパズルを成立させます。

### 交差判定

`Graph.loop(time)` が毎フレーム呼び出され、線分交差の公式で全辺ペアを検査します。`checkCrossedGraph()` が交差ありのとき `true` を返し、ラウンドのクリアをブロックします。

### レンダラー

すべてのレンダラーは `CanvasRenderingContext2D` とゲーム開始からの経過時間（ms）を受け取ります。`SparkRenderer` が交差点へパーティクルを放出し、`NeonStopwatch` と `RoundLamps` がフレームごとに HUD を描画します。

---

## テスト

コアロジック（交差判定・グラフ生成・ユーティリティ）に対して Vitest によるユニットテストが書かれています。

```bash
pnpm test           # 単発実行
pnpm test:watch     # ファイル変更を監視して自動再実行
```
