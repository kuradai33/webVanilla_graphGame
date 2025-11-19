// レベル
export const LEVELS = ["easy", "normal", "hard"] as const; // すべて小文字
export type Levels = typeof LEVELS[number];
export const defaultLevel: Levels = "normal";