import { CANVAS_HEIGHT, CANVAS_WIDTH, NODE_RADIUS } from "../define";
import * as graph from "../graph";

import Page from "./Page";

const controller = new AbortController();
const signal = controller.signal;

type Input = { cntNode: number };
export type GameOutput = { time: string; cntNode: number };
type Callback = (data: GameOutput) => void;

export class Gamepage extends Page {
    protected callback?: Callback;

    cntNode: number = -1;
    gameScreen?: HTMLCanvasElement;
    textInfo?: HTMLElement;

    constructor(root: HTMLElement) {
        super(root);
    }

    setCallback(callback: Callback): void {
        this.callback = callback;
    }

    changePage(data: Input = { cntNode: 10 }): void {
        this.root.innerHTML = `
            <section class="screen-game">
                <h1>Graph to Plain!</h1>
                <canvas id="game_screen"></canvas>
                <p id="info"></p>
            </section>`;

        this.cntNode = data.cntNode;

        this.gameScreen = document.getElementById("game_screen") as HTMLCanvasElement;
        this.textInfo = document.getElementById("info") as HTMLElement;
        // キャンバスの描画用オブジェクトを取得
        const ctx = this.gameScreen.getContext("2d")!;
        // キャンバスの大きさを設定
        this.gameScreen.height = CANVAS_HEIGHT;
        this.gameScreen.width = CANVAS_WIDTH;

        // 初期描画
        const opeg = new graph.Graph(ctx);
        this.createPlanegraph(opeg, 5); // 平面グラフを作成

        opeg.updateEdgeColor(); // 辺の交差情報を更新
        opeg.draw(); // 全ての要素を描画

        // キャンバスなどにマウスイベントを設定
        this.settingCanvasEvent(opeg);
    }

    /**
     * キャンバス上のマウス操作イベントを設定する。
     * 頂点の選択やドラッグによる移動などを制御する。
     * @param {graph.Graph} opeg グラフ操作オブジェクト
     */
    private settingCanvasEvent(opeg: graph.Graph) {
        if(!this.gameScreen) throw new Error("Property is unsetted");

        let isDragging = false;
        let mouseStartX: number = 0, mouseStartY: number = 0;
        let nodeStartX: number = 0, nodeStartY: number = 0;
        let operatedNode: graph.GraphNode | null = null;

        this.gameScreen.addEventListener("mousedown", (e: MouseEvent) => {
            if(!this.gameScreen) throw new Error("Property is unsetted");

            const rect = this.gameScreen.getBoundingClientRect();
            const x: number = e.clientX - rect.left;
            const y: number = e.clientY - rect.top;

            mouseStartX = x;
            mouseStartY = y;

            operatedNode = opeg.getClosestNode(x, y);
            operatedNode?.setFillColor("red");
            operatedNode?.draw();
            const pos = operatedNode?.getPos();
            if (pos != undefined) {
                nodeStartX = pos[0];
                nodeStartY = pos[1];
            }

            isDragging = true;
        }, { signal: signal });
        this.root.addEventListener("mousemove", (e: MouseEvent) => {
            if (!isDragging) return;
            if(!this.gameScreen) throw new Error("Property is unsetted");

            const rect = this.gameScreen.getBoundingClientRect();
            const x: number = e.clientX - rect.left;
            const y: number = e.clientY - rect.top;
            const processed_x = Math.min(Math.max(x - mouseStartX + nodeStartX, NODE_RADIUS), CANVAS_WIDTH - NODE_RADIUS);
            const processed_y = Math.min(Math.max(y - mouseStartY + nodeStartY, NODE_RADIUS), CANVAS_HEIGHT - NODE_RADIUS);

            operatedNode?.setPos(processed_x, processed_y);
            opeg.updateEdgeColor();
            opeg.draw();
        });
        this.root.addEventListener("mouseup", (e: MouseEvent) => {
            if (!isDragging) return;
            operatedNode?.setFillColor("black");
            operatedNode?.draw();
            isDragging = false;
            if (!opeg.checkCrossedGraph()) {
                this.finishGame(opeg);
            }
        });
    }

    /**
     * 平面グラフを構成する頂点と辺を作成する。
     * @param {graph.Graph} opeg グラフ操作オブジェクト
     * @param {number} cntNode 作成する頂点の数
     */
    createPlanegraph(opeg: graph.Graph, cntNode: number) {
        const ctx = opeg.getCtx();

        // 頂点を作成
        const CNT_NODE = cntNode;
        let preNode = null;
        for (let i = 0; i < CNT_NODE; i++) {
            let x = Math.random() * 460 + 20;
            let y = Math.random() * 460 + 20;
            const node = new graph.GraphNode(ctx, x, y, i);
            opeg.addGraphElement(node);

            if (this.getRandint(0, 2) == 0 && preNode != null) {
                opeg.addGraphElement(new graph.GraphEdge(ctx, preNode, node));
            }
            preNode = node;
        }

        // 辺を作成
        const nodes = opeg.getNodes();
        const edges = this.createPlanegraphEdges(CNT_NODE);
        for (const edge of edges) {
            opeg.addGraphElement(new graph.GraphEdge(ctx, nodes[edge[0]], nodes[edge[1]]));
        }

        if(this.textInfo) this.textInfo.innerText = `node:${CNT_NODE} edge:${edges.length}`;
    }

    /**
     * 平面グラフの辺をランダムに生成する。
     * @param {number} cntNode 頂点数
     * @returns {[number, number][]} 有効な辺のリスト
     */
    createPlanegraphEdges(cntNode: number): [number, number][] {
        let edgesLeft: [number, number][] = [], edgesRight: [number, number][] = [];
        let cntFail = 0;
        while (cntFail < 1000) {
            const addLeft = this.getRandint(0, 2) == 0;
            const start = this.getRandint(0, cntNode - 2);
            const end = this.getRandint(start + 2, cntNode);
            const newEdge: [number, number] = [start, end];
            if (addLeft && this.checkCrossing(edgesLeft, newEdge)) edgesLeft.push(newEdge);
            else if (this.checkCrossing(edgesRight, newEdge)) edgesRight.push(newEdge);
            else {
                cntFail++;
                continue;
            }
            cntFail = 0;
        }

        console.log(edgesLeft.sort());
        console.log("-----");
        console.log(edgesRight.sort());

        const all_edges = edgesLeft.concat(edgesRight);
        return all_edges;
    }

    /**
     * 新たな辺を追加したときの交差判定を行う。
     * @param {[number, number][]} existedEdges 既存の辺集合
     * @param {[number, number]} newEdge 新たに追加する辺
     * @returns {boolean} 交差が起こるかどうか
     */
    checkCrossing(existedEdges: [number, number][], newEdge: [number, number]): boolean {
        for (const edge of existedEdges) {
            const inside = edge[0] <= newEdge[0] && newEdge[1] <= edge[1];
            const outside = newEdge[0] <= edge[0] && edge[1] <= newEdge[1];
            const equal = newEdge[0] == edge[0] && edge[1] == newEdge[1];
            if (equal || !(inside || outside)) return false;
        }
        return true;
    }

    /**
     * 指定した範囲の整数をランダムに生成する。
     * [start, end)の範囲。
     * @param {number} start 範囲の始まり（含む）
     * @param {number} end 範囲の終わり（含まない）
     * @returns ランダムな整数
     */
    getRandint(start: number, end: number): number { // [start, end)
        if (start > end) {
            const tmp = start;
            start = end;
            end = tmp;
        }
        return Math.floor(Math.random() * (end - start)) + start;
    }

    /**
     * ゲーム終了時の処理を行う。
     * @param {graph.Graph} opeg グラフ操作オブジェクト
     */
    finishGame(opeg: graph.Graph) {
        // イベントリスナを削除
        controller.abort();

        opeg.drawClearedGraph();
        // this.textInfo.innerText = "CLEAR!";

        if (this.callback) this.callback({ time: "3:00.00", cntNode: this.cntNode });
        else throw new Error("Property is unsetted");
    }
}