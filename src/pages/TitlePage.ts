import { manager } from "../index";
import Page from "./Page";

/**
 * タイトル画面を表示する。
 */
export default class Titlepage extends Page {
    constructor(root: HTMLElement) {
        super(root);
    }

    override display(): void {
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
                            <input
                                id="vcount"
                                type="number"
                                min="6"
                                max="60"
                                value="${manager ? manager.state.settings.cntNode : 10}"
                                required
                            />
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
            // 頂点数をデータ共有オブジェクトに登録
            const cntNode = Number((document.getElementById("vcount") as HTMLInputElement).value);
            manager.state.settings.cntNode = cntNode;
            // ゲーム画面に遷移
            manager.goto("game");
        });
    }
}