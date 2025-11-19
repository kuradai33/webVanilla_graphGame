import { SparkRenderer } from "../render/spark";

/**
 * 図形の基本クラス。
 * 継承先で描画処理を実装する。
 */
class Shape {
    /** 図形の描画を行うメソッド（オーバーライド前提） */
    public loop(time: number): void { };
}

type NodeStatus = "normal" | "hover" | "drag";

/**
 * 頂点の半径
 */
const nodeRadius = 18;

/**
 * グラフ上の頂点を表すクラス。
 */
export class GraphNode extends Shape {
    public readonly id: number;
    private center_x: number;
    private center_y: number;
    private ctx: CanvasRenderingContext2D;
    private lastDragedTime: number = -1;

    private prevStatus: NodeStatus = "normal";
    public status: NodeStatus = "normal";

    private readonly graphicGlow: HTMLCanvasElement = document.createElement('canvas');
    private readonly graphicShadow: HTMLCanvasElement = document.createElement('canvas');

    private readonly nodeColor = {
        core: "#00e5ff",
        ring: "#0083c4",
        glowInner: "rgba(0,229,255,0.85)",
        glowOuter: "rgba(0,229,255,0.0)",
    }

    private readonly nodeStyle = {
        radius: nodeRadius,
        ringWidth: 5,
        glowRadius: 30,
        pulse: true,
        pulsePeriodMS: 2000,
    }

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

        // グロースプライトの作成
        const { glowInner, glowOuter } = this.nodeColor;
        const { radius, glowRadius } = this.nodeStyle;

        this.graphicGlow.height = 2 * glowRadius;
        this.graphicGlow.width = 2 * glowRadius;
        const x = glowRadius, y = glowRadius;

        const ctxGG = this.graphicGlow.getContext('2d')!;
        const gradGG = ctxGG.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradGG.addColorStop(0, glowInner);
        gradGG.addColorStop(1, glowOuter);
        ctxGG.fillStyle = gradGG;
        ctxGG.beginPath();
        ctxGG.arc(x, y, glowRadius, 0, 2 * Math.PI);
        ctxGG.fill();

        // シャドースプライトの作成
        this.graphicShadow.height = 2 * glowRadius;
        this.graphicShadow.width = 2 * glowRadius;
        const ctxGS = this.graphicShadow.getContext('2d')!;
        const grad = ctxGS.createRadialGradient(x, y, 0, x, y, glowRadius);
        grad.addColorStop(0, "rgba(255,225,255,0)");
        grad.addColorStop(0.15, "rgba(255,225,255,0.02)");
        grad.addColorStop(1, "rgba(255,225,255,0.7)");
        ctxGS.fillStyle = grad;
        ctxGS.beginPath();
        ctxGS.arc(x, y, radius, 0, 2 * Math.PI);
        ctxGS.fill();
    }

    /**
     * 頂点の現在位置を返す。
     * @returns {[number, number]} [x, y] 形式の座標
     */
    public getPos(): [number, number] { return [this.center_x, this.center_y] }

    /**
     * 頂点の位置を設定する。
     * @param {number} x 新しいX座標
     * @param {number} y 新しいY座標
     */
    public setPos(x: number, y: number) {
        this.center_x = x;
        this.center_y = y;
    }

    /**
     * 指定座標との距離を返す。
     * @param {number} x 対象X座標
     * @param {number} y 対象Y座標
     * @returns {number} ユークリッド距離
     */
    public getDist(x: number, y: number): number {
        return Math.sqrt((this.center_x - x) ** 2 + (y - this.center_y) ** 2);
    }

    /**
     * 繰り返される処理。主に描画。
     * @param {number} time - ゲーム開始からの経過時間(ms) 
     */
    public override loop(time: number) {
        // 直前にドラッグが終了した時刻を記録
        if (this.prevStatus == "drag" && this.status == "normal") {
            this.lastDragedTime = time;
        }
        this.prevStatus = this.status;

        // 描画
        this.draw(time);
    }

    /**
     * ノードをキャンバスに描画する。
     * @param {number} time - ゲーム開始からの経過時間(ms) 
     */
    private draw(time: number) {
        // this.ctx.beginPath();
        // this.ctx.arc(this.center_x, this.center_y, define.NODE_RADIUS, 0, 2 * Math.PI);
        // this.ctx.fillStyle = "white";
        // this.ctx.fill();
        // this.ctx.closePath();

        const ctx = this.ctx;
        const cx = this.center_x, cy = this.center_y;
        const { core, ring } = this.nodeColor;
        const { radius, ringWidth, glowRadius, pulse, pulsePeriodMS } = this.nodeStyle;

        const pulseScale =
            pulse ?
                1.0 + 0.1 * Math.cos(((time - this.lastDragedTime) / pulsePeriodMS) * Math.PI * 2) :
                1.0;
        const scale = this.status === "drag" ? 1.1 : pulseScale;
        const drawGlowR = glowRadius * scale;

        // グロー
        ctx.save(); // 情報を保存
        ctx.globalCompositeOperation = 'lighter'; // 加算合成に設定
        ctx.drawImage( // グローを描画
            this.graphicGlow,
            cx - drawGlowR,
            cy - drawGlowR,
            2 * drawGlowR,
            2 * drawGlowR,
        );
        ctx.restore();

        // コア
        ctx.fillStyle = core;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        this.ctx.fill();

        // リング
        ctx.strokeStyle = ring;
        ctx.lineWidth = ringWidth;
        ctx.beginPath();
        ctx.arc(cx, cy, 0.375 * radius + ringWidth, 0, Math.PI * 2);
        ctx.stroke();

        // シャドー
        ctx.save(); // 情報を保存
        ctx.globalCompositeOperation = 'lighter'; // 加算合成に設定
        ctx.drawImage( // グローを描画
            this.graphicShadow,
            cx - glowRadius,
            cy - glowRadius,
            2 * glowRadius,
            2 * glowRadius,
        );
        ctx.restore();
    }
};

type EdgeStatus = "normal" | "alert" | "solved";
/**
 * グラフの辺を表すクラス。
 */
export class GraphEdge extends Shape {
    private node1: GraphNode;
    private node2: GraphNode;
    private ctx: CanvasRenderingContext2D;

    public status: EdgeStatus = "normal";

    private readonly normalStyle = {
        coreAlpha: 0.3,
        coreWidth: 1,
        colorWidth: 3,
        solvedBoost: 1.2,
        dash: {
            pattern: [7, 7],
            speed: 10,
        },
        bright: {
            span: 200,
            speed: 100,
            colorBright: "#40efffff",
            colorDim: "#00262bff",
        },
    };

    private readonly alertStyle = {
        coreAlpha: 0.3,
        coreWidth: 1,
        colorWidth: 3,
        solvedBoost: 1.2,
        dash: {
            pattern: [7, 7],
            speed: 0,
        },
        bright: {
            span: 200,
            speed: 0,
            colorBright: "#926900ff",
            colorDim: "#926900ff",
        },
    };

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

    public override loop(time: number) {
        this.draw(time);
    }

    /**
     * 辺をキャンバスに描画する。
     * @param {number} time - ゲーム開始からの経過時間(ms) 
     */
    private draw(time: number) {
        // const lineWidth = this.ctx.lineWidth;
        // const pre_color = this.ctx.strokeStyle;
        const [x1, y1] = this.node1.getPos(), [x2, y2] = this.node2.getPos();

        // this.ctx.lineWidth = define.EDGE_WIDTH;
        // this.ctx.strokeStyle = this.color;
        // this.ctx.beginPath();
        // this.ctx.moveTo(x1, y1);
        // this.ctx.lineTo(x2, y2);
        // this.ctx.stroke();
        // this.ctx.closePath();

        // this.ctx.lineWidth = lineWidth;
        // this.ctx.strokeStyle = pre_color;

        const {
            coreAlpha,
            coreWidth,
            colorWidth,
            solvedBoost,
            dash,
            bright,
        } = this.status == "alert" ? this.alertStyle : this.normalStyle;
        const ctx = this.ctx;

        // カラー外層
        ctx.save();
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.globalCompositeOperation = "lighter";

        ctx.translate(x1, y1);
        ctx.rotate(ang);

        const len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        const grad = ctx.createLinearGradient(0, 0, len, 0);

        // グラデーションの設定（0と1と最小、最大の部分に設定）
        const rawOffset = (time / 1000) * bright.speed;
        const brightOffset = rawOffset - Math.floor(rawOffset / bright.span) * bright.span; // 0 ~ spanに加工
        for (let i = 0; ; i++) {
            if (bright.span / 2 * i - brightOffset > len) { // 終了判定
                const maxi = i - 1;
                const percentage = Math.round((1 - (bright.span / 2 * maxi - brightOffset) / len) / (bright.span / 2 / len) * 100);
                if (maxi % 2 == 0) grad.addColorStop(1, `color-mix(in srgb, ${bright.colorBright} ${percentage}%, ${bright.colorDim})`);
                else grad.addColorStop(1, `color-mix(in srgb, ${bright.colorDim} ${percentage}%, ${bright.colorBright})`);
                break;
            }

            if (bright.span / 2 * i - brightOffset < 0) {
                if (0 <= bright.span / 2 * (i + 1) - brightOffset) {
                    const percentage = Math.round((-(bright.span / 2 * i - brightOffset) / len) / (bright.span / 2 / len) * 100);
                    if (i % 2 == 0) grad.addColorStop(0, `color-mix(in srgb, ${bright.colorBright} ${percentage}%, ${bright.colorDim})`);
                    else grad.addColorStop(0, `color-mix(in srgb, ${bright.colorDim} ${percentage}%, ${bright.colorBright})`);
                }
                continue;
            }
            grad.addColorStop(
                (bright.span / 2 * i - brightOffset) / len,
                i % 2 == 0 ?
                    bright.colorDim :
                    bright.colorBright
            );
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, -colorWidth * solvedBoost / 2, len, colorWidth * solvedBoost);
        ctx.restore();


        // 後から点線の線でない部分を描画
        ctx.save();
        ctx.strokeStyle = "#0b0f1a";
        ctx.lineWidth = colorWidth * solvedBoost * 1.2;
        ctx.lineDashOffset = -(time / 1000) * dash.speed;
        ctx.setLineDash(dash.pattern);
        this.strokeLine(ctx, x1, y1, x2, y2);
        ctx.restore();

        // 芯
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = `rgba(255,255,255,${coreAlpha})`;
        ctx.lineWidth = coreWidth;
        this.strokeLine(ctx, x1, y1, x2, y2);
        ctx.restore();
    }

    /**
     * ２点を結ぶ線を描画する
     * @param {CanvasRenderingContext2D} ctx - 線の描画先
     * @param {number} x1 - 始点のx座標
     * @param {number} y1 - 始点のy座標
     * @param {number} x2 - 終点のx座標
     * @param {number} y2 - 終点のy座標
     */
    private strokeLine(
        ctx: CanvasRenderingContext2D,
        x1: number, y1: number, x2: number, y2: number
    ) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    /**
     * 与えられた辺との交差を判定する。
     * 交差している場合はその座標、していない場合はnullを返す。
     * @param {GraphEdge} edge - 判定する辺
     * @returns {{y: number; x: number} | null} - 交差点の座標またはnull
     */
    checkCrossed(edge: GraphEdge): { y: number; x: number } | null {
        // 交差判定
        // https://qiita.com/zu_rin/items/e04fdec4e3dec6072104
        const [a1x, a1y] = this.node1.getPos();
        const [a2x, a2y] = this.node2.getPos();
        const [b1x, b1y] = edge.node1.getPos();
        const [b2x, b2y] = edge.node2.getPos();

        const s1 = (a1x - a2x) * (b1y - a1y) - (a1y - a2y) * (b1x - a1x);
        const t1 = (a1x - a2x) * (b2y - a1y) - (a1y - a2y) * (b2x - a1x);
        if (s1 * t1 > 0) return null;

        const s2 = (b1x - b2x) * (a1y - b1y) - (b1y - b2y) * (a1x - b1x);
        const t2 = (b1x - b2x) * (a2y - b1y) - (b1y - b2y) * (a2x - b1x);
        if (s2 * t2 > 0) return null;

        // 交差点の導出
        const coefNume = (a1y - b2y) * (b1x - b2x) - (a1x - b2x) * (b1y - b2y);
        const coefDeno = (a1y - a2y) * (b1x - b2x) - (a1x - a2x) * (b1y - b2y);

        const coef = coefNume / coefDeno;

        return { y: coef * (a2y - a1y) + a1y, x: coef * (a2x - a1x) + a1x };
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

    private readonly spackRenderer = new SparkRenderer();
    private readonly canvasSize: { h: number; w: number };

    /**
     * グラフ操作用のインスタンスを生成する。
     * @param canvas - 描画に使用するCanvas
     */
    constructor(private canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d")!;
        this.ctx = ctx;
        this.spackRenderer.ctx = ctx;

        this.canvasSize = { h: canvas.height, w: canvas.width };
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
     * @param {Shape} e ノードまたは辺
     */
    public addGraphElement(e: Shape) {
        if (e instanceof GraphNode) this.graphNodes.push(e);
        else if (e instanceof GraphEdge) this.graphEdges.push(e);
    }

    private mouseStartX: number = 0;
    private mouseStartY: number = 0;
    private nodeStartX: number = 0;
    private nodeStartY: number = 0;
    private operatedNode: GraphNode | null = null;
    private isDrag = false;
    /**
     * 
     * @param mouseStatus 
     * @param mousePos 
     */
    public setNodePos(mouseStatus: "down" | "move" | "up", mousePos: { x: number; y: number }) {
        const mx = mousePos.x, my = mousePos.y;
        switch(mouseStatus) {
            case "down":
                this.mouseStartX = mx;
                this.mouseStartY = my;
                this.operatedNode = this.getClosestNode(mx, my);
                if (this.operatedNode) this.operatedNode.status = "drag";
                else return;
                const pos = this.operatedNode?.getPos();
                if (pos != undefined) {
                    this.nodeStartX = pos[0];
                    this.nodeStartY = pos[1];
                }
                
                this.isDrag = true;
                break;
            case "move":
                if(!this.isDrag) return;
                const processed_x = Math.min(
                    Math.max(
                        mx - this.mouseStartX + this.nodeStartX,
                        nodeRadius
                    ),
                    this.canvasSize.w - nodeRadius
                );
                const processed_y = Math.min(
                    Math.max(
                        my - this.mouseStartY + this.nodeStartY,
                        nodeRadius
                    ),
                    this.canvasSize.h - nodeRadius
                );

                this.operatedNode?.setPos(processed_x, processed_y);
                break;
            case "up":
                if(!this.isDrag) return;
                if (this.operatedNode) this.operatedNode.status = "normal";
                this.isDrag = false;
                break;
        }
    }

    /**
     * 辺の状態を更新。
     */
    public updateEdgeStatus() {
        const crossed = this.checkCrossedEdges();
        const len = this.graphEdges.length;

        for (let i = 0; i < len; i++) {
            this.graphEdges[i].status = crossed[i] ? "alert" : "normal";
        }
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
     * グラフ内の交差点の数を計算する。
     * @returns グラフの中の交差点の数
     */
    public culCntCrossedPoint(): number {
        const len = this.graphEdges.length;
        let cnt = 0;
        for (let i = 0; i < len; i++) for (let j = i + 1; j < len; j++) {
            if (this.graphEdges[i].checkNeighbor(this.graphEdges[j])) continue;
            if (this.graphEdges[i].checkCrossed(this.graphEdges[j])) {
                cnt++;
            }
        }
        return cnt;
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
     * グラフ全体における座標を計算する。
     * @returns {{y: number; x: number}[]} - 交差点の座標
     */
    private culEdgeIntersection(): { y: number; x: number }[] {
        const len = this.graphEdges.length;
        let crossedPoints: { y: number; x: number }[] = [];
        for (let i = 0; i < len; i++) for (let j = i + 1; j < len; j++) {
            if (this.graphEdges[i].checkNeighbor(this.graphEdges[j])) continue;
            const intersect = this.graphEdges[i].checkCrossed(this.graphEdges[j]);
            if (intersect) crossedPoints.push(intersect);
        }
        return crossedPoints;
    }

    /**
     * 辺の更新と再描画を行う。
     * @param {number} time - 経過時間(ms)
     */
    public loop(time: number) {
        this.updateEdgeStatus();
        this.draw(time);
    }

    /**
     * グラフの頂点と辺、辺の交差点のスパークを描画する。
     * @param {number} time - 経過時間(ms)
     */
    private draw(time: number) {
        for (const e of this.graphEdges) e.loop(time);
        this.drawSpark(time);
        for (const n of this.graphNodes) n.loop(time);
    }

    /**
     * 辺の交差点にスパークを描画する。
     * @param {number} time - 経過時間(ms)
     */
    private drawSpark(time: number) {
        // TODO: 未完成
        const crossedPoints = this.culEdgeIntersection();
        for (const point of crossedPoints) {
            const { x, y } = point;
            // const r = 10;
            // this.ctx.drawImage(this.graphicGlow, x - r, y - r, r * 2, r * 2);
            this.spackRenderer.emit(x, y);
        }

        this.spackRenderer.update(time / 1000);
        this.spackRenderer.draw();
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
        console.log("fin");
    }
};