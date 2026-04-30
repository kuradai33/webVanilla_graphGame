import PageManager from "./pages/PageManager";
import { ReverseQueue } from "./util";

const page = document.getElementById("page") as HTMLElement;
export const manager = new PageManager(page);

// ページ読み込み時の処理
document.addEventListener("DOMContentLoaded", () => {
    try {
        const dataAdv = window.localStorage.getItem("adv");
        if (dataAdv) {
            manager.state.settings.advMode = true;

            const resultsTimeJson = window.localStorage.getItem("resultsTime");
            if (resultsTimeJson) manager.loadTimeattackResults(JSON.parse(resultsTimeJson));
            const resultsArcadeJson = window.localStorage.getItem("resultsArcade");
            if (resultsArcadeJson) {
                const datas = JSON.parse(resultsArcadeJson);
                manager.state.resultsArcade =
                    new ReverseQueue<{ name: string; level: number; timeMs: number }>(datas._queue, datas._size);
            }
        }
    } catch {
        console.log("localstorage非対応です");
    }
    manager.goto("title");
});