import { manager } from "../index";
import { LEVELS, Levels, defaultLevel } from "../define";
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
                <h1>Planarize!</h1>
                <p>
                    ランダムに生成された <strong>平面的グラフ</strong> を乱した配置から開始します。<br />
                    頂点をドラッグして <em>辺の交差をなくす</em> ことを目指しましょう。
                </p>

                <form id="title-form" autocomplete="off">
                    <fieldset>
                        <label for="name">
                            ニックネーム（10文字以内）
                            <input id="name" type="text" value="Player" maxlength="10" placeholder="ニックネームを入れてください">
                        </label>
                        <label for="vcount">
                            頂点数
                            <input
                                id="vcount"
                                type="number"
                                min="6"
                                max="20"
                                value="${manager ? manager.state.settings.cntNode : 10}"
                                required
                            />
                        </label>
                        <label for="level">
                            難易度
                            <select id="level" class="dropdown">
                                ${LEVELS.map(level => `
                                    <option value="${level}" ${level == defaultLevel ? "selected" : ""}>
                                        ${level[0].toUpperCase()}${level.slice(1, level.length)}
                                    </option>`).join("")
                                }
                            </select>
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
            const nickname = (document.getElementById("name") as HTMLInputElement).value;
            const level = ((document.getElementById("level") as HTMLSelectElement).value) as Levels;
            if (nickname.length == 0) return; // ニックネームがない

            manager.state.settings.cntNode = cntNode;
            manager.state.settings.name = nickname;
            manager.state.settings.level = level;
            // ゲーム画面に遷移
            manager.goto("game");
        });
    }
}