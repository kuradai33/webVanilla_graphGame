import * as define from "./define";

/**
 * 図形の基本クラス。
 * 継承先で描画処理を実装する。
 */
class Shape {
    /** 図形の描画を行うメソッド（オーバーライド前提） */
    draw() { };
}

/**
 * グラフ上の頂点を表すクラス。
 */
export class GraphNode extends Shape {
    public id: number;
    private center_x: number;
    private center_y: number;
    private ctx: CanvasRenderingContext2D;
    private fill_color: "black" | "red" = "black";

    /**
     * 頂点のインスタンスを生成する。
     * @param {CanvasRenderingContext2D} ctx 描画に使用するCanvasのコンテキスト
     * @param {number} cx 頂点のX座標
     * @param {number} cy 頂点のY座標
     * @param {number} id 頂点の識別子
     */
    constructor(ctx: CanvasRenderingContext2D, cx: number, cy: number, id: number) {
        super();
        this.ctx = ctx;
        this.center_x = cx;
        this.center_y = cy;
        this.id = id;
    }

    /**
     * 頂点の現在位置を返す。
     * @returns {[number, number]} [x, y] 形式の座標
     */
    getPos(): [number, number] { return [this.center_x, this.center_y] }

    /**
     * 指定座標との距離を返す。
     * @param {number} x 対象X座標
     * @param {number} y 対象Y座標
     * @returns {number} ユークリッド距離
     */
    getDist(x: number, y: number): number {
        return Math.sqrt((this.center_x - x) ** 2 + (y - this.center_y) ** 2);
    }

    /**
     * 頂点の塗りつぶし色を変更する。
     * @param {"black" | "red"} c 色（"black" または "red"）
     */
    setFillColor(c: "black" | "red") {
        this.fill_color = c;
    }

    /**
     * 頂点の位置を設定する。
     * @param {number} x 新しいX座標
     * @param {number} y 新しいY座標
     */
    setPos(x: number, y: number) {
        this.center_x = x;
        this.center_y = y;
    }

    /**
     * ノードをキャンバスに描画する。
     */
    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.center_x, this.center_y, define.NODE_RADIUS, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.fill_color;
        this.ctx.fill();
        this.ctx.closePath();
    }
};

export class GraphEdge extends Shape {
    private node1: GraphNode;
    private node2: GraphNode;
    private ctx: CanvasRenderingContext2D;

    private color: "black" | "red" | "yellow" = "black";

    /**
     * 辺のインスタンスを生成する。
     * @param {CanvasRenderingContext2D} ctx 描画に使用するCanvasのコンテキスト
     * @param {number} node1 辺の始点ノード
     * @param {number} node2 辺の終点ノード
     */
    constructor(ctx: CanvasRenderingContext2D, n1: GraphNode, n2: GraphNode) {
        super();
        this.ctx = ctx;
        this.node1 = n1;
        this.node2 = n2;
    }

    /**
     * 辺の色を設定する。
     * @param {"black" | "red" | "yellow"} color 色（"black" または "red" または "yellow"）
     */
    setColor(c: "black" | "red" | "yellow") { this.color = c; }

    /**
     * 辺をキャンバスに描画する。
     */
    draw() {
        const lineWidth = this.ctx.lineWidth;
        const pre_color = this.ctx.strokeStyle;
        const [x1, y1] = this.node1.getPos(), [x2, y2] = this.node2.getPos();

        this.ctx.lineWidth = define.EDGE_WIDTH;
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.closePath();

        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = pre_color;
    }

    /**
     * 与えられた辺との交差を判定する。
     * @param {GraphEdge} edge 判定する辺
     * @returns {bool} 交差しているかどうか
     */
    checkCrossed(edge: GraphEdge) {
        // https://qiita.com/zu_rin/items/e04fdec4e3dec6072104
        const [a1x, a1y] = this.node1.getPos();
        const [a2x, a2y] = this.node2.getPos();
        const [b1x, b1y] = edge.node1.getPos();
        const [b2x, b2y] = edge.node2.getPos();

        const s1 = (a1x - a2x) * (b1y - a1y) - (a1y - a2y) * (b1x - a1x);
        const t1 = (a1x - a2x) * (b2y - a1y) - (a1y - a2y) * (b2x - a1x);
        if (s1 * t1 > 0) return false;

        const s2 = (b1x - b2x) * (a1y - b1y) - (b1y - b2y) * (a1x - b1x);
        const t2 = (b1x - b2x) * (a2y - b1y) - (b1y - b2y) * (a2x - b1x);
        if (s2 * t2 > 0) return false;

        return true;
    }

    /**
     * 辺が隣接するかどうかを判定する。
     * @param {GraphEdge} edge 判定する辺
     * @returns {bool} 隣接しているかどうか
     */
    checkNeighbor(edge: GraphEdge) {
        return this.node1 == edge.node1 || this.node1 == edge.node2 || this.node2 == edge.node1 || this.node2 == edge.node2;
    }
};

export class Graph {
    private graphNodes: GraphNode[] = [];
    private graphEdges: GraphEdge[] = [];
    private ctx: CanvasRenderingContext2D;

    /**
     * グラフ操作用のインスタンスを生成する。
     * @param {CanvasRenderingContext2D} ctx 描画に使用するCanvasのコンテキスト
     */
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * 頂点のみを取得する。
     * @returns {GraphNode[]} GraphNodeの配列
     */
    public getNodes(): GraphNode[] { return this.graphNodes; }

    /**
     * Canvasのコンテキストを返す。
     * @returns {CanvasRenderingContext2D} Canvasのコンテキスト
     */
    public getCtx(): CanvasRenderingContext2D { return this.ctx; }

    /**
     * グラフ要素を追加する。
     * @param {Shape} elem ノードまたは辺
     */
    public addGraphElement(e: Shape) {
        if (e instanceof GraphNode) this.graphNodes.push(e);
        else if (e instanceof GraphEdge) this.graphEdges.push(e);
    }

    /**
     * 辺の色を更新（交差に応じて赤色に）
     */
    public updateEdgeColor(): boolean {
        const crossed = this.checkCrossedEdges();
        const len = this.graphEdges.length;

        let crossed_graph = false;
        for (let i = 0; i < len; i++) {
            this.graphEdges[i].setColor(crossed[i] ? "red" : "black");
            crossed_graph ||= crossed[i];
        }

        return crossed_graph;
    }

    /**
     * グラフが交差していないか判定する。
     * @returns {boolean} 全ての辺が交差していなければ true
     */
    public checkCrossedGraph(): boolean {
        const crossed = this.checkCrossedEdges();
        return !(crossed.every((e) => !e));
    }

    /**
     * 各辺について隣接した辺以外と交差しているかを判定する。
     * @returns {boolean[]} 辺が交差しているかの結果
     */
    private checkCrossedEdges(): boolean[] {
        const len = this.graphEdges.length;
        let crossed: boolean[] = Array(len).fill(false);
        for (let i = 0; i < len; i++) for (let j = i + 1; j < len; j++) {
            if (this.graphEdges[i].checkNeighbor(this.graphEdges[j])) continue;
            if (this.graphEdges[i].checkCrossed(this.graphEdges[j])) {
                crossed[i] = true;
                crossed[j] = true;
            }
        }
        return crossed;
    }

    /**
     * グラフを描画する。
     */
    public draw() {
        this.ctx.clearRect(0, 0, define.CANVAS_HEIGHT, define.CANVAS_WIDTH);
        for (const e of this.graphEdges) e.draw();
        for (const e of this.graphNodes) e.draw();
    }

    /**
     * 与えられた座標に最も近い頂点を取得する。
     * @param {number} x x座標
     * @param {number} y y座標
     * @returns {GraphNode | null} 最も近い頂点 頂点がなければnull
     */
    public getClosestNode(x: number, y: number): GraphNode | null {
        let min_dist: number = Infinity;
        let closest_node: GraphNode | null = null;
        for (const node of this.graphNodes) {
            const dist = node.getDist(x, y);
            console.log(`${node.id} ${dist}`);
            if (min_dist > dist) {
                min_dist = dist;
                closest_node = node;
            }
        }
        return closest_node;
    }

    /**
     * グラフクリア時の描画処理を行う。
     */
    public drawClearedGraph() {
        for (const edge of this.graphEdges) edge.setColor("yellow");
        console.log("fin");
        this.draw();
    }
};