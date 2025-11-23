/**
 * 中身は最新のものが先頭にくるように保持される
 */
export class ReverseQueue<T> {
    private _queue: T[];
    private _size: number | undefined = undefined;

    constructor(queue?: T[], size?: number) {
        this._size = size;
        this._queue = (queue ? queue : []);
    }

    public push(x: T) {
        this._queue.unshift(x);

        if (this._size && this._queue.length > this._size) {
            this.pop();
        }
    }

    public pop() {
        this._queue.pop();
    }

    public length() {
        return this._queue.length;
    }

    public back() {
        if (this._queue.length == 0) return undefined;
        return this._queue[this._queue.length - 1];
    }

    /**
     * 先頭から最新→最古の順に並んだキューを返す
     * @returns キューの中身
     */
    public range(): ReadonlyArray<T> {
        const result: ReadonlyArray<T> = [...this._queue];
        return result;
    }
}