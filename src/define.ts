/**
 * ラウンド数
 */
export const MAX_TIMEATTACK_ROUND = 5;

// レベル
export const LEVELS = ["easy", "normal", "hard"] as const; // すべて小文字
export type Levels = typeof LEVELS[number];
export const DEFAULT_TIMEATTACK_LEVEL: Levels = "normal";

/**
 * タイムアタックモードでのレベル,ラウンドごと頂点数
 * ラウンドごとについては1ベースインデックス
 */
export const CNT_NODE_TIMEATTACK: Record<string, number[]> = {
    "easy": [-1, 5, 5, 6, 6, 7],
    "normal": [-1, 7, 7, 8, 8, 9],
    "hard": [-1, 8, 8, 9, 9, 10],
};

export const MAX_ARCADE_LEVEL = 10;
/**
 * アーケードモードでのレベルごとの頂点数
 * 1ベースインデックス
 */
export const CNT_NODE_ARCADE: number[] = [-1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const ANIMATION_FPS = 60;

// 平面グラフ作成アルゴリズム
const ALGOS = ["LeftRight", "Delaunay"];
export type PlaneGraphGenAlgo = typeof ALGOS[number];

/* --- 以下、定義のチェック --- */
(() => {
    for (let level of LEVELS) {
        if (CNT_NODE_TIMEATTACK[level] == undefined) throw Error("定義が不十分です");
    }

    if (CNT_NODE_ARCADE.length < MAX_ARCADE_LEVEL + 1) throw Error("定義が不十分です");
})();