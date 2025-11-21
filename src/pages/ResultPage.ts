import { manager } from "../index";
import Page from "./Page";

/**
 * 結果画面を表示する。
 */
export default class Resultpage extends Page {
    constructor(root: HTMLElement) {
        super(root);
    }

    override display(): void {
        const gameMode = manager.state.settings.mode;
        this.root.innerHTML = `
            <section class="screen-result">
                <h2>結果</h2>

                <!-- 概要カード -->
                <!-- <article id="result-summary" aria-busy="true">
                    タイトル・要約などを動的に挿入
                </article> -->

                <!-- タイムアタックランキング -->
                ${gameMode == "timeattack" ? `<table class="result-metrics">
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
                    <tbody>` +
                        Resultpage.createTimeattackResultHTML() +
                    `</tbody>
                </table>` : ""}

                <!-- アーケード結果 -->
                ${gameMode == "arcade" ? `<table id="result_metrics_arcade">
                    <thead>
                        <tr>
                            <th>レベル</th>
                            <th>名前</th>
                            <th>タイム</th>
                        </tr>
                    </thead>
                    <tbody id="result_metrics_arcade_body">` +
                        Resultpage.createArcadeResultHTML() +
                    `</tbody>
                </table>` : ""}

                <footer style="margin-top:1rem;">
                    <button type="button" id="btn_retry">もう一度</button>
                    <button type="button" id="btn_backtitle" class="secondary">タイトルへ</button>
                </footer>
            </section>`;

        // 「もう一度」ボタンにイベントを登録
        const actionRetry = () => {
            manager.goto("game");
        };
        const btnRetry = document.getElementById("btn_retry") as HTMLButtonElement;
        btnRetry.addEventListener("click", actionRetry);

        // 「タイトルへ」ボタンにイベントを登録
        const actionBackTitle = () => {
            manager.goto("title");
        };
        const btnBackTitle = document.getElementById("btn_backtitle") as HTMLButtonElement;
        btnBackTitle.addEventListener("click", actionBackTitle);

        if (manager.state.settings.advMode) {
            // ストレージに保存
            if (!window.localStorage) return;
            window.localStorage.setItem("resultsTime", JSON.stringify(manager.state.resultsTimeattack));
            window.localStorage.setItem("resultsArcade", JSON.stringify(manager.state.resultsArcade));
        }
    }

    public static createTimeattackResultHTML() {
        const results = [...manager.state.resultsTimeattack].sort((resultX, resultY) => resultX.totalTimeMs - resultY.totalTimeMs);
        const tbhtml = results.map((result, idx) => {
            let detailTime = "";
            const len = result.timeMsByRound.length;
            for (let i = 0; i < 5; i++) {
                detailTime += `<td>${i < len ? Resultpage.format(result.timeMsByRound[i]) : ""}</td>`;
            }
            return `<tr ${result.id == results.length ? "style='background: rgba(160, 240, 255, 0.28);'" : ""}>` +
                `<td>${idx + 1}</td>` +
                `<td>${result.name}</td>` +
                `<td>${Resultpage.format(result.totalTimeMs)}</td>` +
                `${detailTime}` +
                `</tr>`;
        });
        return tbhtml.join("");
    }

    public static createArcadeResultHTML() {
        const results = manager.state.resultsArcade;
        const tbhtml = results.range().map((result, idx) => {
            return `<tr ${idx == 0 ? "style='background: rgba(160, 240, 255, 0.28);'" : ""}>` +
                `<td>${result.level}</td>` +
                `<td>${result.name}</td>` +
                `<td>${Resultpage.format(result.timeMs)}</td>` +
                `</tr>`;
        });
        return tbhtml.join("");
    }

    static format(elapsedMs: number): string {
        const cs = Math.floor(elapsedMs / 10) % 100; // centiseconds
        const s = Math.floor(elapsedMs / 1000) % 60;
        const m = Math.floor(elapsedMs / 60000);
        if (m > 99) return "99:99.99";

        const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n);
        return m + ":" + pad2(s) + "." + pad2(cs);
    }
}