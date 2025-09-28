import { Titlepage, TitleOutput } from "./pages/TitlePage";
import { Gamepage, GameOutput } from "./pages/GamePage";
import { Resultpage, ResultOutput } from "./pages/ResultPage";
import Page from "./pages/Page";

import { PageLabel } from "./define";

export default class PageManager {
    private _pages: Record<PageLabel, Page>;

    constructor(root: HTMLElement, initPage: PageLabel) {
        // 各ページの生成
        const titlePage = new Titlepage(root);
        const gamePage = new Gamepage(root);
        const resultPage = new Resultpage(root);

        // 各ページの遷移用コールバック関数の登録
        titlePage.setCallback((data: TitleOutput) => {
            gamePage.changePage(data);
        });
        gamePage.setCallback((data: GameOutput) => {
            resultPage.changePage(data);
        });
        resultPage.setCallback((arg: ResultOutput) => {
            switch (arg.page) {
                case "title":
                    titlePage.changePage();
                    break;
                case "game":
                    gamePage.changePage(arg.data);
                    break;
            }
        });

        this._pages = {
            title: titlePage,
            game: gamePage,
            result: resultPage,
        };

        this._pages[initPage].changePage();
    }
};