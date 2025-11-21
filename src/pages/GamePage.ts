import Page from "./Page";
import GameEngine from "../game/GameEngine";
import { NeonStopwatch } from "../render/NeonStopwatch";

/**
 * ゲーム画面を表示する。
 */
export default class Gamepage extends Page {
    /**
     * ゲーム画面描画用キャンバス
     */
    private gameScreen?: HTMLCanvasElement;

    /**
     * デバッグ用テキスト要素
     */
    private textInfo?: HTMLElement;

    /**
     * ストップウォッチを画面に描画する
     */
    stopwatch?: NeonStopwatch;

    controller: AbortController;
    signal: AbortSignal;

    /* これ以降は定数 */
    /**
     * ゲーム画面描画用のキャンバスのサイズ
     */
    private readonly canvasSize = {
        height: 500,
        width: 500,
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
                <div>
                    <h1>Planarize!</h1>
                    <canvas id="game_playground"></canvas>
                </div>
            </section>`;

        this.gameScreen = document.getElementById("game_playground") as HTMLCanvasElement;
        // this.textInfo = document.getElementById("info") as HTMLElement;

        // キャンバスの大きさを設定
        const { height, width } = this.canvasSize;
        this.gameScreen.height = height;
        this.gameScreen.width = width;

        // ゲームエンジンを作成
        new GameEngine(this.gameScreen, this.root);
    }
}
