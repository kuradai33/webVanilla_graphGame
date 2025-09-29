import PageManager from "./page";

const page = document.getElementById("page") as HTMLElement;

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