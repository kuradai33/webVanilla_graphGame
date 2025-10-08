import Titlepage from "./TitlePage";
import Gamepage from "./GamePage";
import Resultpage from "./ResultPage";
import Page from "./Page";

type PageLabel = "title" | "game" | "result";

export type AppState = {
    settings: { cntNode: number };
    result: { timeMs: number };
};

export default class PageManager {
    /**
     * ページ間のデータ共有用オブジェクト
     */
    public state: AppState = {
        settings: { cntNode: -1 },
        result: { timeMs: -1 },
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
};