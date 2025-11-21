import { manager } from "../index";
import { LEVELS, Levels, defaultTimeattackLevel } from "../define";
import Page from "./Page";
import Resultpage from "./ResultPage";

/**
 * タイトル画面を表示する。
 */
export default class Titlepage extends Page {
    constructor(root: HTMLElement) {
        super(root);
    }

    override display(): void {
        const gameMode = "arcade";
        this.root.innerHTML = `
            <section class="screen-title" data-screen>
                <h1>Planarize!</h1>
                <p>
                    ランダムに生成された <strong>平面的グラフ</strong> を乱した配置から開始します。<br />
                    ノードをドラッグして <strong>辺の交差をなくす</strong> ことを目指しましょう。
                </p>

                <input id="switch_advance" aria-invalid="true" type="checkbox" role="switch"/>

                <dialog id="modal_advance">
                    <article>
                        <h2>Warning!</h2>
                        <p>過去の結果データが削除されます。続けますか？</p>
                        <footer>
                            <button id="advence_continue">続ける</button>
                            <button id="advence_cancel" class="secondary">キャンセル</button>
                        </footer>
                    </article>
                </dialog>

                <form id="title-form" autocomplete="off">
                    <fieldset>
                        <label for="name">
                            ニックネーム（10文字以内）
                            <input id="name" type="text" value="Player" maxlength="10" placeholder="ニックネームを入れてください">
                        </label>
                        <div class="mode-tabs-wrap" role="tablist" aria-label="ゲームモード">
                            <div class="mode-tabs">
                                <input type="radio" id="tab_time" name="mode" class="mode-tab" value="time" ${manager.state.settings.mode == "timeattack" ? "checked" : ""}>
                                <label for="tab_time" role="tab" aria-controls="panel_time" aria-selected="true">タイムアタック</label>

                                <input type="radio" id="tab_arcade" name="mode" class="mode-tab" value="arcade" ${manager.state.settings.mode == "arcade" ? "checked" : ""}>
                                <label for="tab_arcade" role="tab" aria-controls="panel_arcade" aria-selected="false">アーケード</label>
                            </div>

                            <section id="panel_time" role="tabpanel">
                                <label for="level">
                                    レベル
                                    <select id="level_time" class="dropdown">
                                        ${LEVELS.map(level => `
                                            <option value="${level}" ${level == manager.state.settings.timeattackLevel ? "selected" : ""}>
                                                ${level[0].toUpperCase()}${level.slice(1, level.length)}
                                            </option>`).join("")
                                        }
                                    </select>
                                </label>
                            </section>
                            <section id="panel_arcade" role="tabpanel">
                                <label for="vcount">
                                    <p id="display_level">レベル：${manager.state.settings.arcadeLevel}</p>
                                    <input
                                        id="level_arcade"
                                        type="range"
                                        min="1"
                                        max="10"
                                        value="${manager.state.settings.arcadeLevel}"
                                        required
                                    />
                                </label>
                            </section>
                        </div>
                    </fieldset>

                    <button type="button" id="btn_gamestart">ゲーム開始</button>
                </form>

                <!-- <details id="howto">
                    <summary>遊び方</summary>
                    <ul>
                        <li>ノードをドラッグして位置を調整します。</li>
                        <li>レーザーどうしの交差数が <strong>0</strong> になればクリア！</li>
                    </ul>
                </details> -->
            </section>
            <section class="screen-result">
                <h2>結果</h2>

                <input type="radio" id="resulttab_time" name="result" class="result-tab" ${manager.state.settings.mode == "timeattack" ? "checked" : ""}>
                <label for="resulttab_time" role="tab" aria-controls="result_metrics" aria-selected="true">タイムアタック</label>

                <input type="radio" id="resulttab_arcade" name="result" class="result-tab" ${manager.state.settings.mode == "arcade" ? "checked" : ""}>
                <label for="resulttab_arcade" role="tab" aria-controls="result_metrics_arcade" aria-selected="false">アーケード</label>
                <!-- タイムアタックランキング -->
                <section id="panel_result_time" role="tabpanel">
                    <table class="result-metrics">
                        <thead>
                            <tr>
                                <th>順位</th>
                                <th>名前</th>
                                <th colspan="6">タイム</th>
                            </tr>
                            <tr>
                                <th></th>
                                <th></th>
                                <th>合計</th>
                                <th>ラウンド１</th>
                                <th>ラウンド２</th>
                                <th>ラウンド３</th>
                                <th>ラウンド４</th>
                                <th>ラウンド５</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Resultpage.createTimeattackResultHTML()}
                        </tbody>
                    </table>
                </section>

                <!-- アーケード結果 -->
                <section id="panel_result_arcade" role="tabpanel">
                    <table class="result-metrics-arcade">
                        <thead>
                            <tr>
                                <th>レベル</th>
                                <th>名前</th>
                                <th>タイム</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Resultpage.createArcadeResultHTML()}
                        </tbody>
                    </table>
                </section>
            </section>`;

        const switchAdvance = document.getElementById("switch_advance") as HTMLInputElement;
        if (manager.state.settings.advMode) switchAdvance.checked = true;
        const advModal = document.getElementById("modal_advance") as HTMLDialogElement;
        let isAdvanceMode = manager.state.settings.advMode;
        switchAdvance.addEventListener("change", () => {
            if (switchAdvance.checked) {
                if (!window.localStorage) {
                    switchAdvance.checked = false;
                    return;
                }
                isAdvanceMode = true;
                window.localStorage.setItem("adv", "true");
            }
            else advModal.open = true;
        });

        const btnAdvContinue = document.getElementById("advence_continue") as HTMLButtonElement;
        btnAdvContinue.addEventListener("click", () => {
            advModal.open = false;
            isAdvanceMode = false;
            window.localStorage.clear();
        });
        const btnAdvCancel = document.getElementById("advence_cancel") as HTMLButtonElement;
        btnAdvCancel.addEventListener("click", () => {
            advModal.open = false;
            switchAdvance.checked = true;
        });

        const displayLevel = document.getElementById("display_level") as HTMLParagraphElement;
        const levelArcade = document.getElementById("level_arcade") as HTMLInputElement;
        levelArcade.addEventListener("change", () => {
            displayLevel.innerText = "レベル：" + levelArcade.value;
        });

        const btnGamestart = document.getElementById("btn_gamestart") as HTMLButtonElement;
        btnGamestart.addEventListener("click", () => {
            // 頂点数をデータ共有オブジェクトに登録
            const nickname = (document.getElementById("name") as HTMLInputElement).value;
            if (nickname.length == 0) return; // ニックネームがない
            const levelTime = ((document.getElementById("level_time") as HTMLSelectElement).value) as Levels;
            const levelArcade = Number((document.getElementById("level_arcade") as HTMLSelectElement).value);

            const eles = document.getElementsByName("mode") as NodeListOf<HTMLInputElement>;;
            for (const ele of eles) {
                if (ele.checked) {
                    switch (ele.value) {
                        case "timeattack":
                            manager.state.settings.mode = "timeattack";
                            break;
                        case "arcade":
                            manager.state.settings.mode = "arcade";
                            break;
                    }
                }
            }

            manager.state.settings.name = nickname;
            manager.state.settings.timeattackLevel = levelTime;
            manager.state.settings.arcadeLevel = levelArcade;


            // ゲーム画面に遷移
            manager.goto("game");
        });
    }
}