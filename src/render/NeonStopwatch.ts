export class NeonStopwatch {
    x: number;
    y: number;
    w: number;
    h: number;
    ctx: CanvasRenderingContext2D;
    private off: HTMLCanvasElement;
    private offCtx: CanvasRenderingContext2D;

    private readonly stopwatchStyle = {
        textSize: 56,
        bgColor: "rgba(0, 45, 63, 0.6)",
        bgStrokeColor: "rgba(81, 238, 255, 0.95)",
        bgStrokeColorDim: "rgba(0, 229, 255, 0.25)",
        textColor: "rgba(81, 238, 255, 0.95)",
        glareColor: "rgba(255,255,255,0.08)",
        gridColor: "rgba(0, 229, 255, 0.06)",
    }

    constructor(
        ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number
    ) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.ctx = ctx;
        // グロー用オフスクリーン
        this.off = document.createElement("canvas");
        this.off.width = 2 * w; this.off.height = 2 * h;
        const g = this.off.getContext("2d", { alpha: true })!;
        this.offCtx = g;
    }

    static format(elapsedMs: number): [string, string, string] {
        const cs = Math.floor(elapsedMs / 10) % 100; // centiseconds
        const s = Math.floor(elapsedMs / 1000) % 60;
        const m = Math.floor(elapsedMs / 60000);
        if (m > 99) return ["99", "99", "99"];

        const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n);
        return [pad2(m), pad2(s), pad2(cs)];
    }

    draw(elapsedMs: number, t = performance.now()) {
        const ctx = this.ctx;
        const { textSize, bgColor, bgStrokeColor, textColor } = this.stopwatchStyle;
        // // 背景グリッド（薄く）
        // this.drawGrid(ctx, x, y, w, h, 16);

        // // 枠
        // this.drawFrame(ctx, x, y, w, h, r);

        // 1) オフスクリーンに文字を描く（毎フレーム更新：文字が変わるため）
        const g = this.offCtx;
        const gw = this.off.width, gh = this.off.height;
        g.clearRect(0, 0, this.off.width, this.off.height);

        // 背景グリッド（薄く）
        this.drawGrid(g, 0, 0, gw, gh, 16);
        // 枠
        const r = Math.min(gh * 0.45, 18); // 枠角丸
        this.drawFrame(g, 0, 0, gw, gh, r);

        g.save();
        g.font = `400 ${textSize}px "Quadaptor", ui-monospace, monospace`;
        g.fillStyle = textColor;
        const cx = gw / 2;
        const cy = gh / 2;
        this.drawTimerDigits(g, NeonStopwatch.format(elapsedMs), cx, cy, textSize * 0.7);
        
        // 3) 本体文字（シャープ）
        // ctx.save();
        // ctx.font = `700 ${textSize}px "JetBrains Mono", ui-monospace, monospace`;
        // ctx.textBaseline = "middle";
        // ctx.textAlign = "center";
        // ctx.fillStyle = textColor;
        // ctx.fillText(text, x + w / 2, y + h / 2 + 0.5); // 微妙に下げて視覚センタ調整
        // ctx.restore();
        
        // 4) 走査線＆ハイライト
        // this.drawScanline(g, 0, 0, gw, gh, t);
        // this.drawTopGlare(g, 0, 0, gw, gh);

        const { x, y, w, h } = this;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(this.off, x, y, w, h);
        ctx.restore();
    }

    private drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pitch: number) {
        const { gridColor } = this.stopwatchStyle;
        ctx.save();
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = Math.floor(x / pitch) * pitch; gx < x + w; gx += pitch) {
            ctx.moveTo(gx + 0.5, y);
            ctx.lineTo(gx + 0.5, y + h);
        }
        for (let gy = Math.floor(y / pitch) * pitch; gy < y + h; gy += pitch) {
            ctx.moveTo(x, gy + 0.5);
            ctx.lineTo(x + w, gy + 0.5);
        }
        ctx.stroke();
        ctx.restore();
    }

    private drawScanline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
        ctx.save();
        ctx.beginPath();
        this.drawFrame(ctx, x, y, w, h, Math.min(h * 0.45, 18));
        ctx.clip();

        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0.0, "rgba(255,255,255,0.00)");
        grad.addColorStop(0.15, "rgba(255,255,255,0.02)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.06)");
        grad.addColorStop(0.85, "rgba(255,255,255,0.02)");
        grad.addColorStop(1.0, "rgba(255,255,255,0.00)");

        // 緩やかに上下に揺れる
        const phase = (t / 1000) * 20;
        const offset = Math.sin(phase) * (h * 0.1);

        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = grad;
        ctx.fillRect(x, y + offset, w, h);
        ctx.restore();
    }

    private drawTopGlare(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        const { glareColor } = this.stopwatchStyle;
        ctx.save();
        this.drawFrame(ctx, x, y, w, h, Math.min(h * 0.45, 18));
        ctx.clip();

        const gh = Math.max(2, h * 0.16);
        const grad = ctx.createLinearGradient(0, y, 0, y + gh);
        grad.addColorStop(0, glareColor);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, gh);
        ctx.restore();
    }

    private drawFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        const { bgColor, bgStrokeColor, bgStrokeColorDim } = this.stopwatchStyle;
        ctx.save();
        // 外側太枠
        const outerFramePad = 4;
        this.drawRoundRect(ctx, x + outerFramePad, y + outerFramePad, w - 2 * outerFramePad, h - 2 * outerFramePad, r);
        ctx.strokeStyle = bgStrokeColorDim;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 内側太枠
        const innerFramePad = 8;
        this.drawRoundRect(ctx, x + innerFramePad, y + innerFramePad, w - 2 * innerFramePad, h - 2 * innerFramePad, r);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.strokeStyle = bgStrokeColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // 細枠
        const linePad = 20;
        this.drawRoundRect(ctx, x + linePad, y + linePad, w - 2 * linePad, h - 2 * linePad, r - 6);
        ctx.strokeStyle = bgStrokeColorDim;
        ctx.lineWidth = 0.75;
        ctx.stroke();

        ctx.restore();
    }

    private drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr - 2, y - 2);
        ctx.lineTo(x + w - rr, y - 2);
        ctx.arcTo(x + w + 2, y - 2, x + w + 2, y + 2 + rr, rr);
        ctx.lineTo(x + w + 2, y + h + 2 - rr);
        ctx.arcTo(x + w + 2, y + h + 2, x + w + 2 - rr, y + h + 2, rr);
        ctx.lineTo(x + rr, y + h + 2);
        ctx.arcTo(x - 2, y + h + 2, x - 2, y + h + 2 - rr, rr);
        ctx.lineTo(x - 2, y - 2 + rr);
        ctx.arcTo(x - 2, y - 2, x - 2 + rr, y - 2, rr);
    }

    drawTimerDigits(
        ctx: CanvasRenderingContext2D,
        mmssff: [string, string, string], cx: number, cy: number, numberCellW: number
    ) {
        const colon = ":", period = ".";
        const colonW = ctx.measureText(colon).width, periodW = ctx.measureText(period).width;
        const totalW = numberCellW * 6 + colonW + periodW;

        ctx.save();
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        let x = cx - totalW / 2 + numberCellW / 2;
        // 描画
        ctx.fillText(mmssff[0][0], x, cy);
        x += numberCellW;
        ctx.fillText(mmssff[0][1], x, cy);
        x += (numberCellW + colonW) / 2;
        ctx.fillText(colon, x, cy);
        x += (numberCellW + colonW) / 2;
        ctx.fillText(mmssff[1][0], x, cy);
        x += numberCellW;
        ctx.fillText(mmssff[1][1], x, cy);
        x += (numberCellW + periodW) / 2;
        ctx.fillText(period, x, cy);
        x += (numberCellW + periodW) / 2;
        ctx.fillText(mmssff[2][0], x, cy);
        x += numberCellW;
        ctx.fillText(mmssff[2][1], x, cy);
        ctx.restore();
    }
}
