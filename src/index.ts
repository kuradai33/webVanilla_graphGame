import * as graph from "./graph";
import * as define from "./define";
import PageManager from "./page";

const controller = new AbortController();
const signal = controller.signal;

const body = document.getElementsByTagName("body")[0];
const page = document.getElementById("page") as HTMLElement;
// キャンバスを取得
let gameScreen: HTMLCanvasElement;
let textInfo: HTMLElement;

// ページ読み込み時の処理
document.addEventListener("DOMContentLoaded", () => {
    // onGamePage();

    // onTitlePage();
    const buttonLD = document.getElementById("switch_mode") as HTMLButtonElement;
    buttonLD?.addEventListener("click", switchLightDarkMode);

    const pm = new PageManager(page, "title");
});

function switchLightDarkMode() {
    const mode = document.documentElement.getAttribute("data-theme") || "light";
    document.documentElement.setAttribute("data-theme", mode === "light" ? "dark" : "light"); // モードを設定
}