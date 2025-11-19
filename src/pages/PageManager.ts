import Titlepage from "./TitlePage";
import Gamepage from "./GamePage";
import Resultpage from "./ResultPage";
import Page from "./Page";

import { Levels } from "../define";

type PageLabel = "title" | "game" | "result";

export type AppState = {
    settings: { cntNode: number; name: string; level: Levels };
    /**
     * ゲームの結果
     * @property id
     * @property name - プレイヤー名
     * @property timeMsByRound - ラウンド毎の終了時の現在時刻
     */
    results: { id: number; name: string, totalTimeMs: number; timeMsByRound: number[] }[];
};

export default class PageManager {
    private resultNextId = 1;

    /**
     * ページ間のデータ共有用オブジェクト
     */
    public state: AppState = {
        settings: { cntNode: 10, name: "Player", level: "normal" },
        results: [],
    };

    /**
     * 現在のページ
     */
    private curPage: Page;

    /**
     * コンストラクタ
     * @param root - ページを描画するルートとなるHTML要素
     * @param [initPage] - 初期ページ
     */
    constructor(private root: HTMLElement, initPage?: PageLabel) {
        this.curPage = new Page(root);
        
        if (initPage) this.goto(initPage);
    }

    /**
     * ページ遷移。
     * @param page - 遷移先のページ
     */
    public goto(page: PageLabel) {
        switch (page) {
            case "title":
                this.curPage = new Titlepage(this.root);
                break;
            case "game":
                this.curPage = new Gamepage(this.root);
                break;
            case "result":
                this.curPage = new Resultpage(this.root);
                break;
        }
        this.curPage.display();
    }

    public addResult(name: string, totalTimeMs: number, timeMsByRound: number[]) {
        this.state.results.push({
            id: this.resultNextId,
            name: name,
            totalTimeMs: totalTimeMs,
            timeMsByRound: timeMsByRound,
        });
        this.resultNextId++;
    }
};