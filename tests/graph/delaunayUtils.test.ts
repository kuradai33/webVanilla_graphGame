import { describe, it, expect } from 'vitest';
import {
    isCCW,
    inCircumcircle,
    uniqueBoundary,
    makeTri,
    bowyerWatson,
    type Point,
} from '../../src/graph/DelaunayPlaneGraphGen';

function pt(x: number, y: number, id = 0): Point {
    return { x, y, id };
}

describe('isCCW', () => {
    it('反時計回りの三角形は true', () => {
        expect(isCCW(pt(0, 0), pt(1, 0), pt(0, 1))).toBe(true);
    });

    it('時計回りの三角形は false', () => {
        expect(isCCW(pt(0, 0), pt(0, 1), pt(1, 0))).toBe(false);
    });

    it('直線上の3点（退化）は false', () => {
        expect(isCCW(pt(0, 0), pt(1, 0), pt(2, 0))).toBe(false);
    });
});

describe('inCircumcircle', () => {
    it('外接円の内部にある点は true', () => {
        // 正三角形 (0,0),(2,0),(1,√3) → 外接円の中心は (1, 1/√3)
        const work: Point[] = [pt(0, 0), pt(2, 0), pt(1, Math.sqrt(3))];
        const tri = makeTri(0, 1, 2, work);
        expect(inCircumcircle(1, 0.5, tri)).toBe(true);
    });

    it('外接円の外部にある点は false', () => {
        const work: Point[] = [pt(0, 0), pt(2, 0), pt(1, Math.sqrt(3))];
        const tri = makeTri(0, 1, 2, work);
        expect(inCircumcircle(10, 10, tri)).toBe(false);
    });

    it('外接円の境界上（1e-7 の余裕で除外）は false', () => {
        // 直角二等辺三角形 (0,0),(2,0),(0,2) → 外接円の中心は (1,1), 半径 √2
        const work: Point[] = [pt(0, 0), pt(2, 0), pt(0, 2)];
        const tri = makeTri(0, 1, 2, work);
        // 境界点 (2, 2) は中心(1,1) から距離 √2（=r）
        expect(inCircumcircle(2, 2, tri)).toBe(false);
    });
});

describe('uniqueBoundary', () => {
    it('1つの三角形の3辺はすべて残る', () => {
        const edges = [
            { u: 0, v: 1 },
            { u: 1, v: 2 },
            { u: 2, v: 0 },
        ];
        const result = uniqueBoundary(edges);
        expect(result).toHaveLength(3);
    });

    it('2つの三角形が共有する辺は除外される', () => {
        // 三角形 (0,1,2) と (0,1,3) が辺 0-1 を共有
        const edges = [
            { u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 },
            { u: 0, v: 1 }, { u: 1, v: 3 }, { u: 3, v: 0 },
        ];
        const result = uniqueBoundary(edges);
        expect(result).toHaveLength(4);
        const keys = result.map(e => [Math.min(e.u, e.v), Math.max(e.u, e.v)].join(','));
        expect(keys).not.toContain('0,1');
    });

    it('空配列を渡すと空配列を返す', () => {
        expect(uniqueBoundary([])).toHaveLength(0);
    });
});

describe('makeTri', () => {
    it('外接円の中心から 3 頂点が等距離（外接円の定義）', () => {
        const work: Point[] = [pt(0, 0), pt(4, 0), pt(0, 3)];
        const tri = makeTri(0, 1, 2, work);
        const d0 = Math.sqrt((0 - tri.ccx) ** 2 + (0 - tri.ccy) ** 2);
        const d1 = Math.sqrt((4 - tri.ccx) ** 2 + (0 - tri.ccy) ** 2);
        const d2 = Math.sqrt((0 - tri.ccx) ** 2 + (3 - tri.ccy) ** 2);
        expect(d0).toBeCloseTo(d1);
        expect(d1).toBeCloseTo(d2);
    });

    it('ccr2 が外接円の半径^2 と一致する', () => {
        const work: Point[] = [pt(0, 0), pt(4, 0), pt(0, 3)];
        const tri = makeTri(0, 1, 2, work);
        const r2 = (0 - tri.ccx) ** 2 + (0 - tri.ccy) ** 2;
        expect(tri.ccr2).toBeCloseTo(r2);
    });
});

describe('bowyerWatson', () => {
    it('3点から三角形を1つ生成する', () => {
        const pts: Point[] = [pt(0, 0, 0), pt(2, 0, 1), pt(1, 2, 2)];
        const tris = bowyerWatson(pts, 10, 10);
        expect(tris).toHaveLength(1);
    });

    it('4点（正方形）から三角形を2つ生成する', () => {
        const pts: Point[] = [
            pt(0, 0, 0), pt(4, 0, 1), pt(4, 4, 2), pt(0, 4, 3),
        ];
        const tris = bowyerWatson(pts, 10, 10);
        expect(tris).toHaveLength(2);
    });

    it('返却インデックスが [0, n-1] の範囲内', () => {
        const pts: Point[] = [
            pt(0, 0, 0), pt(5, 0, 1), pt(5, 5, 2), pt(0, 5, 3), pt(2, 2, 4),
        ];
        const tris = bowyerWatson(pts, 10, 10);
        const n = pts.length;
        for (const t of tris) {
            expect(t.a).toBeGreaterThanOrEqual(0);
            expect(t.a).toBeLessThan(n);
            expect(t.b).toBeGreaterThanOrEqual(0);
            expect(t.b).toBeLessThan(n);
            expect(t.c).toBeGreaterThanOrEqual(0);
            expect(t.c).toBeLessThan(n);
        }
    });
});
