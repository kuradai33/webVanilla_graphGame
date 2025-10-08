import PageManager from "./pages/PageManager";

const page = document.getElementById("page") as HTMLElement;
export const manager = new PageManager(page, "title");

// ページ読み込み時の処理
// document.addEventListener("DOMContentLoaded", () => {

// });

function switchLightDarkMode() {
    const mode = document.documentElement.getAttribute("data-theme") || "light";
    document.documentElement.setAttribute("data-theme", mode === "light" ? "dark" : "light"); // モードを設定
}