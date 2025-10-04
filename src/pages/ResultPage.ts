import Page from "./Page";


type Input = { time: string; cntNode: number };

export type ResultOutput = { page: "title" } | { page: "game", data: { cntNode: number } };
type Callback = (data: ResultOutput) => void;

/**
 * 結果画面を表示する。
 */
export class Resultpage extends Page {
    protected _callback?: Callback;

    /**
     * グラフの頂点数。
     * 前ページからのデータを保持するために使用する。
     */
    private cntNode: number = -1;

    constructor(root: HTMLElement) {
        super(root);
    }

    set callback(callback: Callback) {
        this._callback = callback;
    }

    display(data: Input = { time: "--:--.--", cntNode: 10 }): void {
        this.root.innerHTML = `
            <section class="screen-result">
                <h2>結果</h2>

                <!-- 概要カード -->
                <article id="result-summary" aria-busy="true">
                    <!-- タイトル・要約などを動的に挿入 -->
                </article>

                <!-- メトリクス（任意数のKPIを自由に表示） -->
                <h3>メトリクス</h3>
                <table id="result-metrics">
                    <thead>
                        <tr><th>項目</th><th>値</th></tr>
                    </thead>
                    <tbody>
                        <!-- 動的に挿入 -->
                    </tbody>
                </table>

                <!-- セクション（任意数、配列で増減可能） -->
                <div id="result-sections">
                    <!-- 動的に <article> や <details> を追加 -->
                </div>

                <footer style="margin-top:1rem;">
                    <button type="button" id="btn_retry">もう一度</button>
                    <button type="button" id="btn_backtitle" class="secondary">タイトルへ</button>
                </footer>
            </section>`;

        this.cntNode = data.cntNode; // リトライ時の頂点数保持用

        // 「もう一度」ボタンにイベントを登録
        const actionRetry = () => {
            if (this._callback) {
                this._callback({
                    page: "game",
                    data: {
                        cntNode: this.cntNode,
                    },
                });
            }
            else throw new Error("Property is unsetted");
        };
        const btnRetry = document.getElementById("btn_retry") as HTMLButtonElement;
        btnRetry.addEventListener("click", actionRetry);

        // 「タイトルへ」ボタンにイベントを登録
        const actionBackTitle = () => {
            if (this._callback) this._callback({ page: "title" });
            else throw new Error("Property is unsetted");
        };
        const btnBackTitle = document.getElementById("btn_backtitle") as HTMLButtonElement;
        btnBackTitle.addEventListener("click", actionBackTitle);
    }
}