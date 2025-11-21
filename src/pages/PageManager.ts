import Titlepage from "./TitlePage";
import Gamepage from "./GamePage";
import Resultpage from "./ResultPage";
import Page from "./Page";

import { Levels, defaultTimeattackLevel } from "../define";
import { ReverseQueue } from "../util";

type PageLabel = "title" | "game" | "result";
type GameMode = "timeattack" | "arcade";

export type AppState = {
    settings: { advMode: boolean; name: string; mode: GameMode; timeattackLevel: Levels; arcadeLevel: number };
    /**
     * ゲームの結果
     * @property id
     * @property name - プレイヤー名
     * @property timeMsByRound - ラウンド毎の終了時の現在時刻
     */
    resultsTimeattack: { id: number; name: string; totalTimeMs: number; timeMsByRound: number[] }[];
    resultsArcade: ReverseQueue<{ name: string; level: number; timeMs: number }>;
};

export default class PageManager {
    private resultNextId = 1;

    /**
     * ページ間のデータ共有用オブジェクト
     */
    public state: AppState = {
        settings: { advMode: false, name: "Player", mode: "timeattack", timeattackLevel: defaultTimeattackLevel, arcadeLevel: 5 },
        resultsTimeattack: [],
        resultsArcade: new ReverseQueue(undefined, 50),
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
    constructor(private root: HTMLElement) {
        this.curPage = new Page(root);
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

    public addTimeattackResult(name: string, totalTimeMs: number, timeMsByRound: number[]) {
        this.state.resultsTimeattack.push({
            id: this.resultNextId,
            name: name,
            totalTimeMs: totalTimeMs,
            timeMsByRound: timeMsByRound,
        });
        this.resultNextId++;
    }

    public addArcadeResult(name: string, level: number, timeMs: number) {
        this.state.resultsArcade.push({
            name: name,
            level: level,
            timeMs: timeMs,
        });
    }
};