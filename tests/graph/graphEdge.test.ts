import { describe, it, expect } from 'vitest';
import { GraphEdge, GraphNode } from '../../src/graph/Graph';

// checkCrossed 用：getPos() だけ必要なのでスタブノードを使う
function edge(x1: number, y1: number, x2: number, y2: number): GraphEdge {
    const n1 = { getPos: (): [number, number] => [x1, y1] } as unknown as GraphNode;
    const n2 = { getPos: (): [number, number] => [x2, y2] } as unknown as GraphNode;
    return new GraphEdge({} as unknown as CanvasRenderingContext2D, n1, n2);
}

describe('GraphEdge.checkCrossed', () => {
    it('X 字交差で交点を返す', () => {
        const ab = edge(0, 0, 2, 2);
        const cd = edge(0, 2, 2, 0);
        const result = ab.checkCrossed(cd);
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(1);
        expect(result!.y).toBeCloseTo(1);
    });

    it('平行な水平線分は null', () => {
        const ab = edge(0, 0, 4, 0);
        const cd = edge(0, 1, 4, 1);
        expect(ab.checkCrossed(cd)).toBeNull();
    });

    it('同一直線上で重なる線分（coefDeno=0）は null', () => {
        const ab = edge(0, 0, 4, 0);
        const cd = edge(2, 0, 6, 0);
        expect(ab.checkCrossed(cd)).toBeNull();
    });

    it('延長線上で交わるが線分としては交差しない', () => {
        const ab = edge(0, 0, 1, 0);
        const cd = edge(3, -1, 3, 1);
        expect(ab.checkCrossed(cd)).toBeNull();
    });

    it('端点が相手線分の途中にある境界ケース', () => {
        // cd の始点 (1,0) が ab の上にある
        const ab = edge(0, 0, 2, 0);
        const cd = edge(1, 0, 1, 2);
        const result = ab.checkCrossed(cd);
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(1);
        expect(result!.y).toBeCloseTo(0);
    });

    it('非軸平行な斜め交差', () => {
        // (0,0)-(4,2) と (0,2)-(4,0) が (2,1) で交差
        const ab = edge(0, 0, 4, 2);
        const cd = edge(0, 2, 4, 0);
        const result = ab.checkCrossed(cd);
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(2);
        expect(result!.y).toBeCloseTo(1);
    });

    it('端点同士が一致する場合は交点として返す', () => {
        // ab の終点 (2,0) と cd の始点 (2,0) が同じ座標（別ノード）
        // s1*t1=0, s2*t2=0 のため null 条件を通過し、交点を返す
        const ab = edge(0, 0, 2, 0);
        const cd = edge(2, 0, 2, 2);
        const result = ab.checkCrossed(cd);
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(2);
        expect(result!.y).toBeCloseTo(0);
    });

    it('垂直線分と水平線分の T 字（端点が線分の中間）', () => {
        // ab: (0,0)-(4,0) の中点 (2,0) に cd が刺さる
        const ab = edge(0, 0, 4, 0);
        const cd = edge(2, 0, 2, 4);
        const result = ab.checkCrossed(cd);
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(2);
        expect(result!.y).toBeCloseTo(0);
    });

    it('対称性：ab.checkCrossed(cd) と cd.checkCrossed(ab) が同一点', () => {
        const ab = edge(0, 0, 2, 2);
        const cd = edge(0, 2, 2, 0);
        const r1 = ab.checkCrossed(cd);
        const r2 = cd.checkCrossed(ab);
        expect(r1).not.toBeNull();
        expect(r2).not.toBeNull();
        expect(r1!.x).toBeCloseTo(r2!.x);
        expect(r1!.y).toBeCloseTo(r2!.y);
    });
});

describe('GraphEdge.checkNeighbor', () => {
    // checkNeighbor は参照の同一性で判定するため、実際の GraphNode インスタンスを共有する
    // GraphNode のコンストラクタは canvas を必要とするが、ここでは直接使用せず
    // 単純な object + 型キャストで代替する
    function makeNode(): GraphNode {
        return { getPos: (): [number, number] => [0, 0] } as unknown as GraphNode;
    }

    it('始点ノードを共有する場合 true', () => {
        const ctx = {} as unknown as CanvasRenderingContext2D;
        const n1 = makeNode();
        const n2 = makeNode();
        const n3 = makeNode();
        const ab = new GraphEdge(ctx, n1, n2);
        const ac = new GraphEdge(ctx, n1, n3);
        expect(ab.checkNeighbor(ac)).toBe(true);
    });

    it('終点ノードを共有する場合 true', () => {
        const ctx = {} as unknown as CanvasRenderingContext2D;
        const n1 = makeNode();
        const n2 = makeNode();
        const n3 = makeNode();
        const ab = new GraphEdge(ctx, n1, n2);
        const cb = new GraphEdge(ctx, n3, n2);
        expect(ab.checkNeighbor(cb)).toBe(true);
    });

    it('完全に別ノードの辺は false', () => {
        const ctx = {} as unknown as CanvasRenderingContext2D;
        const n1 = makeNode();
        const n2 = makeNode();
        const n3 = makeNode();
        const n4 = makeNode();
        const ab = new GraphEdge(ctx, n1, n2);
        const cd = new GraphEdge(ctx, n3, n4);
        expect(ab.checkNeighbor(cd)).toBe(false);
    });
});
