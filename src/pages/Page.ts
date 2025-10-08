/**
 * 画面の表示を行う抽象クラス
 */
export default class Page {
    /**
     * コンストラクタ
     * @param root - ページを描画するルートとなるHTML要素
     */
    constructor(protected root: HTMLElement) {}

    /**
     * ページの表示を行う。
     */
    public display(): void {
        this.root.innerText = "DEFAULT PAGE";
    };
}