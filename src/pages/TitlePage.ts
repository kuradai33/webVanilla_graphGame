import { PageLabel } from "../define";
import Page from "./Page";

export type TitleOutput = { cntNode: number };
type Callback = (data: TitleOutput) => void;

export class Titlepage extends Page {
    protected callback?: Callback;

    constructor(root: HTMLElement) {
        super(root);
    }

    setCallback(callback: Callback): void {
        this.callback = callback;
    }

    changePage(): void {
        this.root.innerHTML = `
<section id="screen-title" data-screen>
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
                <input id="vcount" type="number" min="6" max="60" value="18" required />
            </label>

            <!-- <label for="edgeRatio">
                辺密度（0〜1）
                <input id="edgeRatio" type="range" min="0.1" max="1" step="0.05" value="0.6" />
                <output id="edgeRatioOut">0.60</output>
            </label>

            <label for="scramble">
                初期シャッフル強度
                <input id="scramble" type="range" min="0" max="1" step="0.05" value="0.7" />
                <output id="scrambleOut">0.70</output>
            </label>

            <label for="seed">
                乱数シード（任意）
                <input id="seed" type="text" placeholder="例: my-seed-123" />
                <button type="button" data-action="random-seed">乱数生成</button>
            </label>

            <label>
                <input id="autoSnap" type="checkbox" checked />
                頂点スナップ補助を有効にする
            </label> -->
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
            if (this.callback) this.callback({ cntNode: cntNode });
            else throw new Error("Property is unsetted");
        });
    }
}