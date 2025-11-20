import { PlaneGraphGenerator } from "./PlaneGraphGenerator";
import { Graph, GraphNode, GraphEdge } from "./Graph";

/**
 * Delaunay（三角形分割）から辺集合を取り出して平面グラフを作る
 *  - Bowyer–Watson 法の素朴実装（依存なし）
 *  - super-triangle を使い、最後にそれに接する辺を取り除く
 */
export default class DelaunayPlaneGraphGenerator implements PlaneGraphGenerator {
    /**
     * 平面グラフを構成する頂点と辺を作成する。
     * @param canvas - 描画先キャンバス
     * @param cntNode - 作成する頂点の数
     */
    public create(canvas: HTMLCanvasElement, cntNode: number): Graph {
        const g = new Graph(canvas);
        const ctx = canvas.getContext("2d")!;
        const W = canvas.clientWidth || canvas.width;
        const H = canvas.clientHeight || canvas.height;

        // 1) ランダム点生成（少しマージン）
        const margin = Math.max(16, Math.min(W, H) * 0.04);
        const pts: Point[] = [];
        for (let i = 0; i < cntNode; i++) {
            pts.push({
                x: margin + Math.random() * (W - margin * 2),
                y: margin + Math.random() * (H - margin * 2),
                id: i,
            });
        }

        // 2) Bowyer–Watson による Delaunay
        const tris = bowyerWatson(pts, W, H);

        // 3) ノードを作成・登録
        const nodes: GraphNode[] = pts.map(
            (p) => new GraphNode(ctx, p.x, p.y, p.id)
        );
        for (const n of nodes) g.addGraphElement(n);

        // 4) 三角形→ユニーク辺集合へ
        const edgeSet = new Set<string>();
        const pushEdge = (a: number, b: number) => {
            if (a === b) return;
            const [u, v] = a < b ? [a, b] : [b, a];
            edgeSet.add(`${u},${v}`);
        };
        for (const t of tris) {
            // super-triangle の仮想点（id<0）は無視されるよう、生成側で除外済み
            pushEdge(t.a, t.b);
            pushEdge(t.b, t.c);
            pushEdge(t.c, t.a);
        }

        // 5) エッジをGraphに登録
        for (const key of edgeSet) {
            const [u, v] = key.split(",").map((s) => parseInt(s, 10));
            console.log(key);
            const e = new GraphEdge(ctx, nodes[u], nodes[v]);
            console.log(e);
            g.addGraphElement(e);
        }

        return g;
    }
}

/* =========================== Delaunay実装（Bowyer–Watson） =========================== */

type Point = { x: number; y: number; id: number }; // id >= 0
type Tri = { a: number; b: number; c: number; ccx: number; ccy: number; ccr2: number }; // 頂点は pts の index

/** メイン：Bowyer–Watson */
function bowyerWatson(pts: Point[], W: number, H: number): Tri[] {
    // super-triangle を十分大きく作成
    const big = 1e6;
    const pA: Point = { x: -big, y: -big, id: -1 };
    const pB: Point = { x: +big, y: -big, id: -2 };
    const pC: Point = { x: 0, y: +big, id: -3 };

    // 作業用の点配列（先頭3つが仮想点）
    const work: Point[] = [pA, pB, pC, ...pts];

    // 初期三角形（super）
    let triangles: Tri[] = [
        makeTri(0, 1, 2, work),
    ];

    // 各点を追加
    for (let pi = 3; pi < work.length; pi++) {
        const p = work[pi];

        // (1) circumcircle に点 p を内包する三角形を取り除く
        const bad: Tri[] = [];
        for (const t of triangles) {
            if (inCircumcircle(p.x, p.y, t)) bad.push(t);
        }
        // (2) "穴" の境界辺（多重でない辺＝1回だけ現れる辺）を収集
        type Edge = { u: number; v: number };
        const edges: Edge[] = [];
        const addEdge = (u: number, v: number) => edges.push({ u, v });
        for (const t of bad) {
            addEdge(t.a, t.b);
            addEdge(t.b, t.c);
            addEdge(t.c, t.a);
        }
        triangles = triangles.filter((t) => bad.indexOf(t) === -1);
        const boundary = uniqueBoundary(edges);

        // (3) 境界と p で再三角形化
        for (const e of boundary) {
            const nt = makeTri(e.u, e.v, pi, work);
            triangles.push(nt);
        }
    }

    // super-triangle に関わる三角形を削除（id < 0 が含まれるもの）
    triangles = triangles.filter((t) => t.a >= 3 && t.b >= 3 && t.c >= 3);

    // work配列の先頭3つは仮想点だったので、以後は元 pts に対する index に戻す
    // この実装では t.a/t.b/t.c は元々 work の index。仮想点を取り除いたのでそのまま 0..(pts.length-1) に一致
    // （仮想点は 0,1,2。実点は 3..）
    const shift = 3;
    return triangles.map((t) => ({
        a: t.a - shift,
        b: t.b - shift,
        c: t.c - shift,
        ccx: t.ccx,
        ccy: t.ccy,
        ccr2: t.ccr2,
    }));
}

/** 3点から三角形＋外接円情報を作る（work は先頭に仮想点が入っている点配列） */
function makeTri(a: number, b: number, c: number, work: Point[]): Tri {
    // 反時計回りに整える（安定のため）
    if (!isCCW(work[a], work[b], work[c])) [b, c] = [c, b];
    const { x: ax, y: ay } = work[a];
    const { x: bx, y: by } = work[b];
    const { x: cx, y: cy } = work[c];

    // 外接円の中心と半径^2
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) || 1e-12;
    const ux =
        ((ax * ax + ay * ay) * (by - cy) +
            (bx * bx + by * by) * (cy - ay) +
            (cx * cx + cy * cy) * (ay - by)) /
        d;
    const uy =
        ((ax * ax + ay * ay) * (cx - bx) +
            (bx * bx + by * by) * (ax - cx) +
            (cx * cx + cy * cy) * (bx - ax)) /
        d;
    const dx = ux - ax;
    const dy = uy - ay;
    const r2 = dx * dx + dy * dy;

    return { a, b, c, ccx: ux, ccy: uy, ccr2: r2 };
}

/** p が三角形 t の外接円の内部（≒中心からの距離^2 < r^2 + ε）にあるか */
function inCircumcircle(px: number, py: number, t: Tri): boolean {
    const dx = px - t.ccx;
    const dy = py - t.ccy;
    return dx * dx + dy * dy <= t.ccr2 - 1e-7; // ちょい厳しめ（退化対策）
}

/** 反時計回り判定 */
function isCCW(a: Point, b: Point, c: Point): boolean {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
}

/**
 * 穴の境界を構成する辺だけを取り出す
 * - bad 三角形群の辺を集め、同じ辺が2回現れたものは内部辺として打ち消す
 */
function uniqueBoundary(edges: Array<{ u: number; v: number }>) {
    const key = (u: number, v: number) => (u < v ? `${u},${v}` : `${v},${u}`);
    const map = new Map<string, { u: number; v: number; cnt: number }>();
    for (const e of edges) {
        const k = key(e.u, e.v);
        const m = map.get(k);
        if (m) m.cnt++;
        else map.set(k, { u: e.u, v: e.v, cnt: 1 });
    }
    const boundary: Array<{ u: number; v: number }> = [];
    for (const kv of map.values()) {
        if (kv.cnt === 1) boundary.push({ u: kv.u, v: kv.v });
    }
    return boundary;
}
