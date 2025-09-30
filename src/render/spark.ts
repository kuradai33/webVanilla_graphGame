type Spark = {
    x: number; y: number;
    vx: number; vy: number;
    t: number;         // 経過時間(s)
    life: number;      // 総寿命(s)
};

export class SparkRenderer {
    private sparks: Spark[] = [];
    private tmpGradCanvas: HTMLCanvasElement | null = null;
    private tmpShadowCanvas: HTMLCanvasElement | null = null;
    private prevTime = -1;

    private _ctx?: CanvasRenderingContext2D = undefined;

    private readonly sparkStyle = {
        color: "#ffdd00",
        glow: "rgba(255, 255, 255, 0.95)",
        count: 2,
        speedMin: 15,
        speedMax: 20,
        lifeMin: 0.1,
        lifeMax: 0.3,
        drag: 0.9,
        width: 2,
        glowRadius: 3,
        shadowRadius: 25,
        len: 8,
    };

    set ctx(ctx: CanvasRenderingContext2D) {
        this._ctx = ctx;
    }

    /** 交差が起きた座標でスパークを発生 */
    emit(x: number, y: number) {
        const p = this.sparkStyle;
        for (let i = 0; i < p.count; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = rand(p.speedMin, p.speedMax);
            this.sparks.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                t: 0,
                life: rand(p.lifeMin, p.lifeMax),
            });
        }

        if(this._ctx) this.drawShadow(this._ctx, x, y, p.shadowRadius);
    }

    /** 更新（dt: 秒） */
    update(time: number) {
        if (this.prevTime == -1) {
            this.prevTime = time;
            return;
        }
        const dt = time - this.prevTime;
        this.prevTime = time;
        const p = this.sparkStyle;
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.t += dt;
            if (s.t >= s.life) { this.sparks.splice(i, 1); continue; }

            // 速度減衰
            s.vx *= p.drag;
            s.vy *= p.drag;
            // 重力を少し（好みで）
            // s.vy += 20 * dt;

            s.x += s.vx * dt;
            s.y += s.vy * dt;
        }
    }

    /** 描画（加算合成でストリーク＋先端グロー） */
    draw() {
        const ctx = this._ctx;
        if (!ctx) throw new Error("描画先が設定されていません");
        if (this.sparks.length === 0) return;
        const p = this.sparkStyle;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        ctx.lineWidth = p.width;

        for (const s of this.sparks) {
            const a = 1 - s.t / s.life;           // 残存率（0..1）
            const len = Math.min(p.len, s.life * 60); // ストリーク長さ（px）
            const bx = s.x - (s.vx !== 0 || s.vy !== 0
                ? (s.vx / (Math.hypot(s.vx, s.vy) || 1)) * len
                : 0);
            const by = s.y - (s.vy !== 0 || s.vx !== 0
                ? (s.vy / (Math.hypot(s.vx, s.vy) || 1)) * len
                : 0);

            // ストリーク（色＋フェード）
            ctx.strokeStyle = withAlpha(p.color, 0.8 * a);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();

            // 先端グロー（小さな円グラデ）
            this.drawGlow(ctx, s.x, s.y, p.glowRadius, Math.min(1, 1.2 * a));
        }

        ctx.restore();
    }

    /** 先端の小グロー（オフスクリーンで軽く） */
    private drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
        // オフスクリーン生成（1度だけ）
        if (!this.tmpGradCanvas) {
            const c = document.createElement("canvas");
            c.width = c.height = 64;
            const g = c.getContext("2d")!;
            const grad = g.createRadialGradient(32, 32, 0, 32, 32, 24);
            grad.addColorStop(0, "rgba(255,255,255,1)");
            grad.addColorStop(1, "rgba(255,255,255,0)");
            g.fillStyle = grad;
            g.beginPath(); g.arc(32, 32, 24, 0, Math.PI * 2); g.fill();
            this.tmpGradCanvas = c;
        }
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha;
        ctx.drawImage(this.tmpGradCanvas, x - r, y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    private drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
        // オフスクリーン生成（1度だけ）
        if (!this.tmpShadowCanvas) {
            const c = document.createElement("canvas");
            c.width = c.height = 64;
            const g = c.getContext("2d")!;
            const grad = g.createRadialGradient(32, 32, 0, 32, 32, 24);
            grad.addColorStop(0, "rgba(22, 22, 22, 0.8)");
            // grad.addColorStop(0.1, "rgba(0, 0, 0, 0.8)");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");
            g.fillStyle = grad;
            g.beginPath(); g.arc(32, 32, 24, 0, Math.PI * 2); g.fill();
            this.tmpShadowCanvas = c;
        }
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(this.tmpShadowCanvas, x - r, y - r, r * 2, r * 2);
        ctx.restore();
    }
}

function rand(a: number, b: number) {
    return a + Math.random() * (b - a);
}

function withAlpha(hexOrRgba: string, alpha: number): string {
    if (hexOrRgba.startsWith("#")) {
        const hex = hexOrRgba.substring(1);
        const bigint = parseInt(hex.length === 3
            ? hex.split("").map(c => c + c).join("")
            : hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    }
    // rgba指定ならそのまま上書き
    return hexOrRgba.replace(/rgba?\(([^)]+)\)/, (_m, inner: string) => {
        const parts = inner.split(",").map((s: string) => s.trim());
        const [r, g, b] = parts;
        return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    });
}
