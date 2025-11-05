export class Timer {
    /**
     * アニメーション開始時刻
     */
    private startTime: number = -1;
    /**
     * アニメーション現在時刻
     */
    private curTime: number = -1;
    /**
     * 現在のアニメーションのid。
     * requestAnimationFrame関数によって返される。
     */
    private animationFrameId: number = -1;

    /**
     * インスタンスが廃棄済みか
     */
    private isAborted = false;

    /**
     * コンストラクタ。定期実行を開始。
     * @param fps - 定期実行のFPS
     * @param fn - 定期的に実行する処理
     */
    constructor(fps: number, fn: (time: number) => void) {
        this.startTime = performance.now();

        // fpsの頻度でfnを繰り返し実行
        const loop = (time: number) => {
            const nextTime = time;
            if (this.curTime == -1) this.curTime = nextTime;

            if (nextTime - this.curTime > 1000 / fps) {
                this.curTime = nextTime;
                fn(nextTime - this.startTime); // 渡された処理を実行
            }
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    public getTime(): number {
        if (this.isAborted) throw new ReferenceError("This instance has already been aborted.");
        return this.curTime - this.startTime;
    }

    /**
     * アニメーションを停止し、インスタンスを廃棄する。
     */
    public abort() {
        if (this.isAborted) throw new ReferenceError("This instance has already been aborted.");
        // アニメーションを停止
        cancelAnimationFrame(this.animationFrameId);
        this.isAborted = true;
    }
}