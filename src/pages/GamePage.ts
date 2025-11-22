import Page from "./Page";
import GameEngine from "../game/GameEngine";
import { NeonStopwatch } from "../render/NeonStopwatch";
import { manager } from "..";

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
                    <dialog id="game_modal_totitle">
                        <article>
                            <p>ゲームをやめてタイトルに戻りますか？</p>
                            <footer>
                                <button id="game_btn_totitle_yes">はい</button>
                                <button id="game_btn_totitle_no" class="secondary">いいえ</button>
                            </footer>
                        </article>
                    </dialog>
                    <div>
                        <button id="game_btn_back" class="game-button" data-tooltip="一手戻る">←</button>
                        <button id="game_btn_totitle" class="game-button" data-tooltip="ゲームをやめる">×</button>
                    </div>
                    <canvas id="game_playground"></canvas>
                </div>
            </section>`;

        this.gameScreen = document.getElementById("game_playground") as HTMLCanvasElement;

        // キャンバスの大きさを設定
        const { height, width } = this.canvasSize;
        this.gameScreen.height = height;
        this.gameScreen.width = width;

        // ゲームエンジンを作成
        const gameEngine = new GameEngine(this.gameScreen, this.root);

        const modalToTitle = document.getElementById("game_modal_totitle") as HTMLDialogElement;
        const btnToTitle = document.getElementById("game_btn_totitle") as HTMLButtonElement;
        btnToTitle.addEventListener("click", () => {
            modalToTitle.open = true;
            gameEngine.stopTimer();
        });
        const btnToTitleYes = document.getElementById("game_btn_totitle_yes") as HTMLButtonElement;
        btnToTitleYes.addEventListener("click", () => {
            modalToTitle.open = false;
            manager.goto("title");
        });
        const btnToTitleNo = document.getElementById("game_btn_totitle_no") as HTMLButtonElement;
        btnToTitleNo.addEventListener("click", () => {
            modalToTitle.open = false;
            gameEngine.startTimer();
        });

        const btnBack = document.getElementById("game_btn_back") as HTMLButtonElement;
        btnBack.addEventListener("click", () => {
            gameEngine.backOneStep();
        });
    }
}
