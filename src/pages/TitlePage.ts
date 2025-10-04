import Page from "./Page";

export type TitleOutput = { cntNode: number };
type Callback = (data: TitleOutput) => void;

/**
 * タイトル画面を表示する。
 */
export class Titlepage extends Page {
    protected _callback?: Callback;

    constructor(root: HTMLElement) {
        super(root);
    }

    set callback(callback: Callback) {
        this._callback = callback;
    }

    display(): void {
        this.root.innerHTML = `
            <section class="screen-title" data-screen>
                <h1>Planarity Challenge</h1>
                <p>
                    ランダムに生成された <strong>平面的グラフ</strong> を乱した配置から開始します。<br />
                    頂点をドラッグして <em>辺の交差をなくす</em> ことを目指しましょう。
                </p>

                <form id="title-form" autocomplete="off">
                    <fieldset>
                        <legend>ゲーム設定</legend>

                        <label for="vcount">
                            頂点数
                            <input id="vcount" type="number" min="6" max="60" value="10" required />
                        </label>
                    </fieldset>

                    <button type="button" id="btn_gamestart">ゲーム開始</button>
                </form>

                <details id="howto">
                    <summary>遊び方</summary>
                    <ul>
                        <li>頂点をドラッグして位置を調整します。</li>
                        <li>辺どうしの交差数が <strong>0</strong> になればクリアです。</li>
                        <li>常に「元は平面的なグラフ」を使用しますが、配置を乱して開始します。</li>
                    </ul>
                </details>
            </section>`;

        const btnGamestart = document.getElementById("btn_gamestart") as HTMLButtonElement;
        btnGamestart.addEventListener("click", () => {
            const cntNode = Number((document.getElementById("vcount") as HTMLInputElement).value);
            if (this._callback) this._callback({ cntNode: cntNode });
            else throw new Error("Property is unsetted");
        });
    }
}