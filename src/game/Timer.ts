export class Timer {
    /**
     * アニメーション開始時刻
     */
    private time: number = 0;
    /**
     * 
     */
    private globalCurTime: number = -1;

    /**
     * 現在のアニメーションのid。
     * requestAnimationFrame関数によって返される。
     */
    private animationFrameId: number = -1;

    /**
     * タイマーが動いているか
     */
    private isOn = false;

    /**
     * コンストラクタ。定期実行を開始。
     * @param fps - 定期実行のFPS
     * @param fn - 定期的に実行する処理
     */
    constructor(private _fps: number, private _loopFn: (time: number) => void) {}

    public getTime(): number {
        return this.time;
    }

    public start() {
        if (this.isOn) return;

        this.isOn = true;
        const loop = (time: number) => {
            const nextTime = time;

            if (nextTime - this.globalCurTime > 1000 / this._fps) {
                this.time += nextTime - this.globalCurTime;
                this.globalCurTime = nextTime;
                this._loopFn(this.time); // 渡された処理を実行
            }
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.globalCurTime = performance.now();
        this.animationFrameId = requestAnimationFrame(loop);
    }

    public stop() {
        if (!this.isOn) return;
        this.isOn = false;
        cancelAnimationFrame(this.animationFrameId);
    }
}