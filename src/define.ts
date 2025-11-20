/**
 * ラウンド数
 */
export const MAX_ROUND = 5;

// レベル
export const LEVELS = ["easy", "normal", "hard"] as const; // すべて小文字
export type Levels = typeof LEVELS[number];
export const defaultLevel: Levels = "normal";

/**
 * レベル,ラウンドごと頂点数
 */
export const CNT_NODE_ROUND_BY_LEVEL: Record<string, number[]> = {
    "easy": [6, 6, 7, 7, 8],
    "normal": [7, 7, 8, 8, 9],
    "hard": [8, 8, 9, 9, 10],
};

export const ANIMATION_FPS = 60;

// 平面グラフ作成アルゴリズム
const ALGOS = ["LeftRight", "Delaunay"];
export type PlaneGraphGenAlgo = typeof ALGOS[number];

/* --- 以下、定義のチェック --- */
(() => {
    for (let level of LEVELS) {
        if (CNT_NODE_ROUND_BY_LEVEL[level] == undefined) throw Error("定義が不十分です");
    }
})();