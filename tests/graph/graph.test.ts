import { describe, it, expect, beforeEach } from 'vitest';
import { makeCanvas } from '../helpers/canvas';
import { Graph, GraphNode, GraphEdge } from '../../src/graph/Graph';

// テスト用グラフ構築ヘルパー
function makeGraph() {
    const canvas = makeCanvas();
    const g = new Graph(canvas);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { g, ctx };
}

function addNode(g: Graph, ctx: CanvasRenderingContext2D, x: number, y: number, id: number): GraphNode {
    const n = new GraphNode(ctx, x, y, id);
    g.addGraphElement(n);
    return n;
}

function addEdge(g: Graph, ctx: CanvasRenderingContext2D, n1: GraphNode, n2: GraphNode): GraphEdge {
    const e = new GraphEdge(ctx, n1, n2);
    g.addGraphElement(e);
    return e;
}

// ボックス形状（4頂点）を持つグラフを返すファクトリ
//
//  n0(0,0) ---e01--- n1(4,0)
//    |                  |
//   e03               e12
//    |                  |
//  n3(0,4) ---e23--- n2(4,4)
//
// 対角線 e02: n0-n2 と e13: n1-n3 は交差する
function makeBoxGraph() {
    const { g, ctx } = makeGraph();
    const n0 = addNode(g, ctx, 0, 0, 0);
    const n1 = addNode(g, ctx, 4, 0, 1);
    const n2 = addNode(g, ctx, 4, 4, 2);
    const n3 = addNode(g, ctx, 0, 4, 3);
    const e01 = addEdge(g, ctx, n0, n1); // 上辺
    const e12 = addEdge(g, ctx, n1, n2); // 右辺
    const e23 = addEdge(g, ctx, n2, n3); // 下辺
    const e03 = addEdge(g, ctx, n0, n3); // 左辺
    return { g, ctx, n0, n1, n2, n3, e01, e12, e23, e03 };
}

// ===== culCntCrossedPoint =====

describe('Graph.culCntCrossedPoint', () => {
    it('辺がないグラフは 0 を返す', () => {
        const { g } = makeGraph();
        expect(g.culCntCrossedPoint()).toBe(0);
    });

    it('非交差の外周4辺は 0 を返す', () => {
        const { g } = makeBoxGraph();
        expect(g.culCntCrossedPoint()).toBe(0);
    });

    it('隣接する辺の交点はカウントしない', () => {
        // n0-n1-n2 のパス（2辺は n1 を共有）
        const { g, ctx } = makeGraph();
        const n0 = addNode(g, ctx, 0, 0, 0);
        const n1 = addNode(g, ctx, 2, 4, 1);
        const n2 = addNode(g, ctx, 4, 0, 2);
        addEdge(g, ctx, n0, n1);
        addEdge(g, ctx, n1, n2);
        expect(g.culCntCrossedPoint()).toBe(0);
    });

    it('交差する2辺は 1 を返す', () => {
        const { g, ctx } = makeGraph();
        const n0 = addNode(g, ctx, 0, 0, 0);
        const n1 = addNode(g, ctx, 4, 4, 1);
        const n2 = addNode(g, ctx, 4, 0, 2);
        const n3 = addNode(g, ctx, 0, 4, 3);
        addEdge(g, ctx, n0, n1); // 対角線 \
        addEdge(g, ctx, n2, n3); // 対角線 /
        expect(g.culCntCrossedPoint()).toBe(1);
    });

    it('交差が2組ある場合は 2 を返す', () => {
        // 外周4辺 + 対角線2本（2本が交差）
        const { g, ctx, n0, n1, n2, n3 } = makeBoxGraph();
        addEdge(g, ctx, n0, n2); // 対角線 \
        addEdge(g, ctx, n1, n3); // 対角線 /（上と交差）
        expect(g.culCntCrossedPoint()).toBe(1);
    });
});

// ===== checkCrossedGraph =====

describe('Graph.checkCrossedGraph', () => {
    it('辺がないグラフは false を返す', () => {
        const { g } = makeGraph();
        expect(g.checkCrossedGraph()).toBe(false);
    });

    it('交差のないグラフは false を返す', () => {
        const { g } = makeBoxGraph();
        expect(g.checkCrossedGraph()).toBe(false);
    });

    it('交差が1つでもあれば true を返す', () => {
        const { g, ctx } = makeGraph();
        const n0 = addNode(g, ctx, 0, 0, 0);
        const n1 = addNode(g, ctx, 4, 4, 1);
        const n2 = addNode(g, ctx, 4, 0, 2);
        const n3 = addNode(g, ctx, 0, 4, 3);
        addEdge(g, ctx, n0, n1);
        addEdge(g, ctx, n2, n3);
        expect(g.checkCrossedGraph()).toBe(true);
    });
});

// ===== updateEdgeStatus =====

describe('Graph.updateEdgeStatus', () => {
    it('交差しない辺はすべて "normal" のまま', () => {
        const { g, e01, e12, e23, e03 } = makeBoxGraph();
        g.updateEdgeStatus();
        expect(e01.status).toBe('normal');
        expect(e12.status).toBe('normal');
        expect(e23.status).toBe('normal');
        expect(e03.status).toBe('normal');
    });

    it('交差する辺は "alert" になり、非交差辺は "normal" のまま', () => {
        const { g, ctx, n0, n1, n2, n3, e01, e12, e23, e03 } = makeBoxGraph();
        const eDiag1 = addEdge(g, ctx, n0, n2); // 対角線 \
        const eDiag2 = addEdge(g, ctx, n1, n3); // 対角線 /
        g.updateEdgeStatus();
        expect(eDiag1.status).toBe('alert');
        expect(eDiag2.status).toBe('alert');
        // 外周辺は交差していない
        expect(e01.status).toBe('normal');
        expect(e12.status).toBe('normal');
        expect(e23.status).toBe('normal');
        expect(e03.status).toBe('normal');
    });

    it('交差が解消されると "normal" に戻る', () => {
        const { g, ctx } = makeGraph();
        const n0 = addNode(g, ctx, 0, 0, 0);
        const n1 = addNode(g, ctx, 4, 4, 1);
        const n2 = addNode(g, ctx, 4, 0, 2);
        const n3 = addNode(g, ctx, 0, 4, 3);
        const e1 = addEdge(g, ctx, n0, n1);
        const e2 = addEdge(g, ctx, n2, n3);

        g.updateEdgeStatus();
        expect(e1.status).toBe('alert');

        // n3 を動かして交差を解消
        n3.setPos(5, 5);
        g.updateEdgeStatus();
        expect(e1.status).toBe('normal');
        expect(e2.status).toBe('normal');
    });
});

// ===== getClosestNode =====

describe('Graph.getClosestNode', () => {
    it('ノードがないグラフは null を返す', () => {
        const { g } = makeGraph();
        expect(g.getClosestNode(0, 0)).toBeNull();
    });

    it('ノードが1つの場合そのノードを返す', () => {
        const { g, ctx } = makeGraph();
        const n = addNode(g, ctx, 10, 20, 0);
        expect(g.getClosestNode(0, 0)).toBe(n);
    });

    it('複数ノードの中から最近傍を返す', () => {
        const { g, ctx } = makeGraph();
        const near = addNode(g, ctx, 1, 1, 0);
        addNode(g, ctx, 10, 10, 1);
        addNode(g, ctx, 20, 20, 2);
        expect(g.getClosestNode(0, 0)).toBe(near);
    });

    it('クエリ座標がノード上にある場合そのノードを返す', () => {
        const { g, ctx } = makeGraph();
        addNode(g, ctx, 5, 5, 0);
        const exact = addNode(g, ctx, 3, 3, 1);
        addNode(g, ctx, 8, 8, 2);
        expect(g.getClosestNode(3, 3)).toBe(exact);
    });
});
