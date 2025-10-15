import { manager } from "../index";
import { Graph, GraphNode } from "../graph";
import LeftRightGen from "../graph/LeftRightGen";
import { Timer } from "./Timer";
import { NeonStopwatch } from "../render/NeonStopwatch";
import drawBackground from "../render/GameBackground";

type PlaneGraphGenAlgo = "LeftRight";

/**
 * アニメーションのフレームレート
 */
const ANIMATION_FPS = 60;

export default class GameEngine {
    private readonly canvasOrigin: { y: number; x: number };

    private controller: AbortController;
    private signal: AbortSignal;

    /**
     * HTML要素に登録されたイベントのリスト。
     * ページ遷移時のイベント削除用。
     */
    private events: [HTMLElement, keyof HTMLElementEventMap, any, boolean | AddEventListenerOptions | null][] = [];

    private timer: Timer;

    /**
     * ストップウォッチを画面に描画する
     */
    stopwatch?: NeonStopwatch;

    constructor(private canvas: HTMLCanvasElement, private root: HTMLElement) {
        const rect = this.canvas.getBoundingClientRect();
        this.canvasOrigin = { y: rect.top, x: rect.left };

        this.controller = new AbortController();
        this.signal = this.controller.signal;

        const ctx = canvas.getContext("2d")!;

        // ストップウォッチの設定
        const hudW = 180, hudH = 48, pad = 10;
        this.stopwatch = new NeonStopwatch(ctx, canvas.width - hudW - pad, canvas.height - hudH - pad, hudW, hudH);

        // 初期描画
        const cntNode = manager.state.settings.cntNode;
        const opeg = this.createPlaneGraph("LeftRight", canvas, cntNode); // 平面グラフを作成

        opeg.loop(0); // 全ての要素を描画

        // キャンバスなどにマウスイベントを設定
        this.settingCanvasEvent(opeg);

        // タイマーを作成
        this.timer = new Timer(
            ANIMATION_FPS,
            (time: number) => {
                // 再描画
                ctx.clearRect(0, 0, canvas.height, canvas.width);
                drawBackground(ctx, { height: canvas.height, width: canvas.width }); // 背景を描画
                opeg.loop(time); // グラフを更新して描画

                this.stopwatch?.draw(time);
            }
        );
    }

    /**
     * 指定されたアルゴリズムを使用してグラフを作成する。
     * @param algo - 使用するアルゴリズム
     * @param ctx - グラフの描画先
     * @param cntNode - グラフの頂点数
     * @returns 作成されたグラフ
     */
    private createPlaneGraph(algo: PlaneGraphGenAlgo, canvas: HTMLCanvasElement, cntNode: number) {
        switch (algo) {
            case "LeftRight":
                const gen = new LeftRightGen();
                return gen.create(canvas, cntNode);
        }
    }

    /**
     * キャンバス上のマウス操作イベントを設定する。
     * 頂点の選択やドラッグによる移動などを制御する。
     * @param opeg - グラフ操作オブジェクト
     */
    private settingCanvasEvent(opeg: Graph) {
        const eventMousedown = (e: MouseEvent) => {
            const x: number = e.clientX - this.canvasOrigin.x;
            const y: number = e.clientY - this.canvasOrigin.y;

            opeg.setNodePos("down", { x: x, y: y });
        };
        this.setEvent(this.canvas, "mousedown", eventMousedown, { signal: this.signal });

        const eventMousemove = (e: MouseEvent) => {
            const x: number = e.clientX - this.canvasOrigin.x;
            const y: number = e.clientY - this.canvasOrigin.y;
            opeg.setNodePos("move", { x: x, y: y });
        };
        this.setEvent(this.root, "mousemove", eventMousemove);

        const eventMouseup = () => {
            opeg.setNodePos("up", { x: -1, y: -1 });
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
    private finishGame(opeg: Graph) {
        // イベントリスナを削除
        this.controller.abort();

        // アニメーションを停止
        this.timer?.abort();

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