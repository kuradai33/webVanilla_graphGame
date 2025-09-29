import * as graph from "../graph";

import Page from "./Page";

const controller = new AbortController();
const signal = controller.signal;

type Input = { cntNode: number };
export type GameOutput = { time: string; cntNode: number };
type Callback = (data: GameOutput) => void;

export class Gamepage extends Page {
    protected callback?: Callback;
    private ctx?: CanvasRenderingContext2D;

    cntNode: number = -1;
    gameScreen?: HTMLCanvasElement;
    textInfo?: HTMLElement;

    animationFrameId: number = -1;
    animationTime: number = -1;

    private readonly animationFPS = 120;

    private readonly canvasSize = {
        height: 500,
        width: 500,
    };

    private readonly bgColor = "#0b0f1a";

    private readonly bgGridStyle = {
        origin: { y: this.canvasSize.width / 2, x: this.canvasSize.height / 2 },
        grid: { height: 80, width: 80 },
        color: "#111829",
        lineWidth: 1,
    };

    constructor(root: HTMLElement) {
        super(root);
    }

    setCallback(callback: Callback): void {
        this.callback = callback;
    }

    /**
     * ページをゲームページに書き換える。
     * @param {Input} data - ページ生成のために渡される情報
     */
    changePage(data: Input = { cntNode: 10 }): void {
        this.root.innerHTML = `
            <section class="screen-game">
                <h1>Graph to Plain!</h1>
                <canvas id="game_playground"></canvas>
                <p id="info"></p>
            </section>`;

        this.cntNode = data.cntNode;

        this.gameScreen = document.getElementById("game_playground") as HTMLCanvasElement;
        this.textInfo = document.getElementById("info") as HTMLElement;
        // キャンバスの描画用オブジェクトを取得
        const ctx = this.gameScreen.getContext("2d")!;
        this.ctx = ctx;
        // キャンバスの大きさを設定
        this.gameScreen.height = this.canvasSize.height;
        this.gameScreen.width = this.canvasSize.width;

        // 初期描画
        const opeg = new graph.Graph(ctx);
        this.createPlanegraph(opeg, 5); // 平面グラフを作成

        opeg.updateEdgeColor(); // 辺の交差情報を更新
        opeg.loop(0); // 全ての要素を描画

        // キャンバスなどにマウスイベントを設定
        this.settingCanvasEvent(opeg);

        // アニメーションを設定
        const loop = (time: number) => {
            const nextTime = time;
            if(this.animationTime == -1) this.animationTime = nextTime;

            if(nextTime - this.animationTime > 1000 / this.animationFPS) {
                this.animationTime = nextTime;

                // 再描画
                ctx.clearRect(0, 0, this.canvasSize.height, this.canvasSize.width);
                this.drawBackground();
                opeg.loop(this.animationTime); // グラフを更新
            }
            requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    /**
     * 背景を描画する。
     */
    private drawBackground() {
        const { height, width } = this.canvasSize;
        const { origin, grid, color, lineWidth } = this.bgGridStyle;
        const ctx = this.ctx;
        if(!ctx) throw new Error("Property is unsetted");

        // 背景
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, width, height);

        // グリッドの描画
        // 縦線
        for(let i = 0; origin.x + grid.width * i <= width; i++) {
            this.drawVerticalLine(origin.x + grid.width * i, color, lineWidth, ctx);
        }
        for(let i = 1; origin.x - grid.width * i >= 0; i++) {
            this.drawVerticalLine(origin.x - grid.width * i, color, lineWidth, ctx);
        }

        // 横線
        for(let i = 0; origin.y + grid.height * i <= height; i++) {
            this.drawHorizontalLine(origin.y + grid.height * i, color, lineWidth, ctx);
        }
        for(let i = 1; origin.y - grid.height * i >= 0; i++) {
            this.drawHorizontalLine(origin.y - grid.height * i, color, lineWidth, ctx);
        }
    }

    /**
     * 縦線をキャンバスに描画する。
     * @param {number} x - 縦線を引くx座標
     * @param {string} color - 線の色
     * @param {number} lineWidth - 線の幅
     * @param {CanvasRenderingContext2D} ctx - 線の描画対象
     */
    private drawVerticalLine(x: number, color: string, lineWidth: number, ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasSize.height);
        ctx.stroke();
    }

    /**
     * 横線をキャンバスに描画する。
     * @param {number} y - 横線を引くy座標
     * @param {string} color - 線の色
     * @param {number} lineWidth - 線の幅
     * @param {CanvasRenderingContext2D} ctx - 線の描画対象
     */
    private drawHorizontalLine(y: number, color: string, lineWidth: number, ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasSize.width, y);
        ctx.stroke();
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
            if(operatedNode) operatedNode.status = "drag";
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
            const processed_x = Math.min(
                Math.max(
                    x - mouseStartX + nodeStartX,
                    18
                ),
                this.canvasSize.width - 18
            );
            const processed_y = Math.min(
                Math.max(
                    y - mouseStartY + nodeStartY,
                    18
                ),
                this.canvasSize.height - 18
            );

            operatedNode?.setPos(processed_x, processed_y);
            opeg.updateEdgeColor();
        });
        this.root.addEventListener("mouseup", (e: MouseEvent) => {
            if (!isDragging) return;
            if(operatedNode) operatedNode.status = "normal";
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
    private createPlanegraph(opeg: graph.Graph, cntNode: number) {
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
    private createPlanegraphEdges(cntNode: number): [number, number][] {
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
    private checkCrossing(existedEdges: [number, number][], newEdge: [number, number]): boolean {
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
    private getRandint(start: number, end: number): number { // [start, end)
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
    private finishGame(opeg: graph.Graph) {
        // イベントリスナを削除
        controller.abort();

        // アニメーションを停止
        cancelAnimationFrame(this.animationFrameId);

        opeg.drawClearedGraph();
        // this.textInfo.innerText = "CLEAR!";

        if (this.callback) this.callback({ time: "3:00.00", cntNode: this.cntNode });
        else throw new Error("Property is unsetted");
    }
}