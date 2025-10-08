import { manager } from "../index";
import * as graph from "../graph";
import { NeonStopwatch } from "../render/NeonStopwatch";

import LeftRightGen from "../graph/LeftRightGen";

import Page from "./Page";

type PlaneGraphGenAlgo = "LeftRight";

/**
 * ゲーム画面を表示する。
 */
export default class Gamepage extends Page {
    /**
     * ゲーム画面描画用キャンバス
     */
    private gameScreen?: HTMLCanvasElement;
    private ctx?: CanvasRenderingContext2D;

    /**
     * デバッグ用テキスト要素
     */
    private textInfo?: HTMLElement;

    /**
     * アニメーション開始時刻
     */
    private animationStartTime: number = -1;
    /**
     * アニメーション現在時刻
     */
    private animationCurTime: number = -1;
    /**
     * 現在のアニメーションのid。
     * requestAnimationFrame関数によって返される。
     */
    private animationFrameId: number = -1;

    /**
     * ストップウォッチを画面に描画する
     */
    stopwatch?: NeonStopwatch;

    controller: AbortController;
    signal: AbortSignal;

    /**
     * HTML要素に登録されたイベントのリスト。
     * ページ遷移時のイベント削除用。
     */
    private events: [HTMLElement, keyof HTMLElementEventMap, any, boolean | AddEventListenerOptions | null][] = [];

    /* これ以降は定数 */
    /**
     * アニメーションのフレームレート
     */
    private readonly animationFPS = 60;

    /**
     * ゲーム画面描画用のキャンバスのサイズ
     */
    private readonly canvasSize = {
        height: 500,
        width: 500,
    };

    /**
     * ゲーム画面背景の色
     */
    private readonly bgColor = "#0b0f1a";
    /**
     * ゲーム画面背景のグリッドのスタイル
     */
    private readonly bgGridStyle = {
        /**
         * グリッドの原点座標
         */
        origin: { y: this.canvasSize.height / 2, x: this.canvasSize.width / 2 },
        /**
         * グリッドのサイズ
         */
        grid: { height: 80, width: 80 },
        /**
         * グリッドの線の色
         */
        color: "#111829",
        /**
         * グリッドの線の幅
         */
        lineWidth: 1,
    };

    constructor(root: HTMLElement) {
        super(root);
        this.controller = new AbortController();
        this.signal = this.controller.signal;
    }

    /**
     * ページをゲームページに書き換える。
     * @param data - ページ生成のために渡される情報
     */
    override display(): void {
        this.root.innerHTML = `
            <section class="screen-game">
                <h1>Graph to Plain!</h1>
                <canvas id="game_playground"></canvas>
                <p id="info"></p>
            </section>`;

        this.gameScreen = document.getElementById("game_playground") as HTMLCanvasElement;
        this.textInfo = document.getElementById("info") as HTMLElement;

        this.controller = new AbortController();
        this.signal = this.controller.signal;

        this.events = [];
        // キャンバスの描画用オブジェクトを取得
        const ctx = this.gameScreen.getContext("2d")!;
        this.ctx = ctx;
        // キャンバスの大きさを設定
        const { height, width } = this.canvasSize;
        this.gameScreen.height = height;
        this.gameScreen.width = width;

        // ストップウォッチの設定
        const hudW = 180, hudH = 48, pad = 10;
        this.stopwatch = new NeonStopwatch(ctx, width - hudW - pad, height - hudH - pad, hudW, hudH);

        // 初期描画
        const cntNode = manager.state.settings.cntNode;
        const opeg = this.createPlaneGraph("LeftRight", ctx, cntNode); // 平面グラフを作成

        opeg.loop(0); // 全ての要素を描画

        // キャンバスなどにマウスイベントを設定
        this.settingCanvasEvent(opeg);

        this.animationStartTime = performance.now(); // スタート時刻を記録

        // アニメーションを設定
        const loop = (time: number) => {
            const nextTime = time;
            if (this.animationCurTime == -1) this.animationCurTime = nextTime;

            if (nextTime - this.animationCurTime > 1000 / this.animationFPS) {
                this.animationCurTime = nextTime;

                // 再描画
                ctx.clearRect(0, 0, this.canvasSize.height, this.canvasSize.width);
                this.drawBackground(); // 背景を描画
                opeg.loop(this.animationCurTime); // グラフを更新して描画

                this.stopwatch?.draw(time - this.animationStartTime);
            }
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    /**
     * 指定されたアルゴリズムを使用してグラフを作成する。
     * @param algo - 使用するアルゴリズム
     * @param ctx - グラフの描画先
     * @param cntNode - グラフの頂点数
     * @returns 作成されたグラフ
     */
    private createPlaneGraph(algo: PlaneGraphGenAlgo, ctx: CanvasRenderingContext2D, cntNode: number) {
        switch (algo) {
            case "LeftRight":
                const gen = new LeftRightGen();
                return gen.create(ctx, cntNode);
        }
    }

    /**
     * 背景を描画する。
     */
    private drawBackground() {
        const { height, width } = this.canvasSize;
        const { origin, grid, color, lineWidth } = this.bgGridStyle;
        const ctx = this.ctx;
        if (!ctx) throw new Error("Property is unsetted");

        // 背景
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, width, height);

        // グリッドの描画
        // 縦線
        for (let i = 0; origin.x + grid.width * i <= width; i++) {
            this.drawVerticalLine(origin.x + grid.width * i, color, lineWidth, ctx);
        }
        for (let i = 1; origin.x - grid.width * i >= 0; i++) {
            this.drawVerticalLine(origin.x - grid.width * i, color, lineWidth, ctx);
        }

        // 横線
        for (let i = 0; origin.y + grid.height * i <= height; i++) {
            this.drawHorizontalLine(origin.y + grid.height * i, color, lineWidth, ctx);
        }
        for (let i = 1; origin.y - grid.height * i >= 0; i++) {
            this.drawHorizontalLine(origin.y - grid.height * i, color, lineWidth, ctx);
        }
    }

    /**
     * 縦線をキャンバスに描画する。
     * @param x - 縦線を引くx座標
     * @param color - 線の色
     * @param lineWidth - 線の幅
     * @param ctx - 線の描画対象
     */
    private drawVerticalLine(x: number, color: string, lineWidth: number, ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasSize.height);
        ctx.stroke();
    }

    /**
     * 横線をキャンバスに描画する。
     * @param y - 横線を引くy座標
     * @param color - 線の色
     * @param lineWidth - 線の幅
     * @param ctx - 線の描画対象
     */
    private drawHorizontalLine(y: number, color: string, lineWidth: number, ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasSize.width, y);
        ctx.stroke();
    }

    /**
     * キャンバス上のマウス操作イベントを設定する。
     * 頂点の選択やドラッグによる移動などを制御する。
     * @param opeg - グラフ操作オブジェクト
     */
    private settingCanvasEvent(opeg: graph.Graph) {
        if (!this.gameScreen) throw new Error("Property is unsetted");

        let isDragging = false;
        let mouseStartX: number = 0, mouseStartY: number = 0;
        let nodeStartX: number = 0, nodeStartY: number = 0;
        let operatedNode: graph.GraphNode | null = null;

        const eventMousedown = (e: MouseEvent) => {
            if (!this.gameScreen) throw new Error("Property is unsetted");

            const rect = this.gameScreen.getBoundingClientRect();
            const x: number = e.clientX - rect.left;
            const y: number = e.clientY - rect.top;

            mouseStartX = x;
            mouseStartY = y;

            operatedNode = opeg.getClosestNode(x, y);
            if (operatedNode) operatedNode.status = "drag";
            const pos = operatedNode?.getPos();
            if (pos != undefined) {
                nodeStartX = pos[0];
                nodeStartY = pos[1];
            }

            isDragging = true;
        };
        this.setEvent(this.gameScreen, "mousedown", eventMousedown, { signal: this.signal });

        const eventMousemove = (e: MouseEvent) => {
            if (!isDragging) return;
            if (!this.gameScreen) throw new Error("Property is unsetted");

            const rect = this.gameScreen.getBoundingClientRect();
            const x: number = e.clientX - rect.left;
            const y: number = e.clientY - rect.top;
            const processed_x = Math.min(
                Math.max(
                    x - mouseStartX + nodeStartX,
                    18
                ),
                this.canvasSize.width - 18
            );
            const processed_y = Math.min(
                Math.max(
                    y - mouseStartY + nodeStartY,
                    18
                ),
                this.canvasSize.height - 18
            );

            operatedNode?.setPos(processed_x, processed_y);
        };
        this.setEvent(this.root, "mousemove", eventMousemove);

        const eventMouseup = (e: MouseEvent) => {
            if (!isDragging) return;
            if (operatedNode) operatedNode.status = "normal";
            isDragging = false;
            if (!opeg.checkCrossedGraph()) {
                this.finishGame(opeg);
            }
        };
        this.setEvent(this.root, "mouseup", eventMouseup);
    }

    /**
     * HTML要素にイベントを登録し、その情報をリストに追加する。
     * @param domElement - 登録先のHTML要素
     * @param event - 登録するイベント名
     * @param func - 登録する処理
     * @param options - 登録するイベントについてのオプション
     */
    private setEvent<K extends keyof HTMLElementEventMap>(
        domElement: HTMLElement,
        event: K,
        func: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ) {
        if (options) {
            domElement.addEventListener(event, func, options);
            this.events.push([domElement, event, func, options]);
        }
        else {
            domElement.addEventListener(event, func);
            this.events.push([domElement, event, func, null]);
        }
    }

    /**
     * ゲーム終了時の処理を行う。
     * @param opeg - グラフ操作オブジェクト
     */
    private finishGame(opeg: graph.Graph) {
        // イベントリスナを削除
        this.controller.abort();

        // アニメーションを停止
        cancelAnimationFrame(this.animationFrameId);

        opeg.drawClearedGraph();

        for (const eventInfo of this.events) {
            if (eventInfo[3]) eventInfo[0].removeEventListener(eventInfo[1], eventInfo[2], eventInfo[3]);
            else eventInfo[0].removeEventListener(eventInfo[1], eventInfo[2]);
        }

        // データ共有オブジェクトに時間を登録
        manager.state.result.timeMs = -1;

        // タイトル画面に遷移
        manager.goto("result");
    }
}
