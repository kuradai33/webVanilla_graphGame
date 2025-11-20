import { PlaneGraphGenerator } from "./PlaneGraphGenerator";
import { Graph, GraphNode, GraphEdge } from "./Graph";

export default class LeftRightGen implements PlaneGraphGenerator {
    /**
     * 平面グラフを構成する頂点と辺を作成する。
     * @param opeg - グラフ操作オブジェクト
     * @param cntNode - 作成する頂点の数
     */
    public create(canvas: HTMLCanvasElement, cntNode: number): Graph {
        const g = new Graph(canvas);
        const ctx = canvas.getContext("2d")!;

        // 頂点を作成
        const CNT_NODE = cntNode;
        let preNode = null;
        for (let i = 0; i < CNT_NODE; i++) {
            const x = Math.random() * 460 + 20;
            const y = Math.random() * 460 + 20;
            const node = new GraphNode(ctx, x, y, i);
            g.addGraphElement(node);

            if (this.getRandint(0, 2) == 0 && preNode != null) {
                g.addGraphElement(new GraphEdge(ctx, preNode, node));
            }
            preNode = node;
        }

        // 辺を作成
        const nodes = g.getNodes();
        const edges = this.createPlanegraphEdges(CNT_NODE);
        for (const edge of edges) {
            g.addGraphElement(new GraphEdge(ctx, nodes[edge[0]], nodes[edge[1]]));
        }

        // if (this.textInfo) this.textInfo.innerText = `node:${CNT_NODE} edge:${edges.length}`;
        return g;
    }

    /**
     * 平面グラフの辺をランダムに生成する。
     * @param cntNode - 頂点数
     * @returns 有効な辺のリスト
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

        const all_edges = edgesLeft.concat(edgesRight);
        return all_edges;
    }

    /**
     * 新たな辺を追加したときの交差判定を行う。
     * @param existedEdges - 既存の辺集合
     * @param newEdge - 新たに追加する辺
     * @returns 交差が起こるかどうか
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
     * @param start - 範囲の始まり（含む）
     * @param end - 範囲の終わり（含まない）
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
}
