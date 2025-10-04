import { PageLabel } from "../define";

/**
 * 画面の表示を行う抽象クラス
 */
export default abstract class Page {
    /**
     * 次のページに遷移するためのコールバック関数
     */
    protected _callback?: (data?: any, page?: PageLabel) => void;

    /**
     * コンストラクタ
     * @param root - ページを描画するルートとなるHTML要素
     */
    constructor(protected root: HTMLElement) { }

    abstract set callback(callback: any);

    /**
     * ページの表示を行う。
     * @param data - ページを表示するためのデータ
     */
    abstract display(data?: any): void;
}