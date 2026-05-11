import { describe, it, expect } from 'vitest';
import { makeCtx } from '../helpers/canvas';
import { GraphNode } from '../../src/graph/Graph';

describe('GraphNode', () => {
    it('コンストラクタが canvas モック環境でエラーなく完了する', () => {
        const ctx = makeCtx();
        expect(() => new GraphNode(ctx, 100, 200, 0)).not.toThrow();
    });

    it('getDist(cx, cy) が 0 を返す', () => {
        const ctx = makeCtx();
        const node = new GraphNode(ctx, 100, 200, 0);
        expect(node.getDist(100, 200)).toBe(0);
    });

    it('getDist が 3-4-5 直角三角形で 5 を返す', () => {
        const ctx = makeCtx();
        const node = new GraphNode(ctx, 0, 0, 0);
        expect(node.getDist(3, 4)).toBeCloseTo(5);
    });

    it('getDist が負のオフセットでも正の距離を返す', () => {
        const ctx = makeCtx();
        const node = new GraphNode(ctx, 0, 0, 0);
        expect(node.getDist(-3, -4)).toBeCloseTo(5);
    });

    it('getPos がコンストラクタに渡した座標を返す', () => {
        const ctx = makeCtx();
        const node = new GraphNode(ctx, 150, 250, 1);
        expect(node.getPos()).toEqual([150, 250]);
    });

    it('setPos 後に getDist が新座標基準で計算される', () => {
        const ctx = makeCtx();
        const node = new GraphNode(ctx, 0, 0, 0);
        node.setPos(10, 10);
        expect(node.getDist(10, 10)).toBe(0);
        expect(node.getDist(13, 14)).toBeCloseTo(5);
    });
});
