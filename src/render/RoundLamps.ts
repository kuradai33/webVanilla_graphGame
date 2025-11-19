type RoundLampsOptions = {
  x: number;                 // 左上のX座標（CSSピクセル）
  y: number;                 // 左上のY座標
  gap: number;               // ランプ間の距離
  size: number;              // ランプの直径
  color: string;             // 点灯色（例: "#00e5ff"）
  offColor?: string;         // 消灯色（デフォ: colorの低彩度版）
  count?: number;            // ランプ数（デフォ: 5）
  animMs?: number;           // 点灯アニメの時間（ms, デフォ: 420）
};

export class RoundLamps {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opt: Required<RoundLampsOptions>;
  private current = 0;                 // 0..count
  private lastLitIndex = -1;           // 直近で点灯したインデックス
  private lastLitAt = 0;               // 点灯開始時刻
  private glowCanvas: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement, options: RoundLampsOptions) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not available");
    this.ctx = ctx;

    const off = options.offColor ?? "rgba(255,255,255,0.18)";
    this.opt = {
      x: options.x,
      y: options.y,
      gap: options.gap,
      size: options.size,
      color: options.color,
      offColor: off,
      count: options.count ?? 5,
      animMs: options.animMs ?? 420,
    };
    this.buildGlow();
  }

  /** ラウンド数を設定（1..count）。0で全消灯。増えた分だけ点灯アニメ。 */
  setRound(round: number, time: number) {
    const clamped = Math.max(0, Math.min(this.opt.count, round | 0));
    if (clamped > this.current) {
      this.lastLitIndex = clamped - 1;
      this.lastLitAt = time;
    } else if (clamped < this.current) {
      // 減る場合はアニメなしでそのまま
      this.lastLitIndex = -1;
    }
    this.current = clamped;
  }

  /** 即座に全消灯/全点灯したい場合のショートカット */
  reset() { this.current = 0; this.lastLitIndex = -1; }
  fill() { this.current = this.opt.count; this.lastLitIndex = -1; }

  /** 描画（毎フレーム呼ぶか、必要時に呼ぶ） */
  draw(now: number = performance.now()) {
    const { x, y, gap, size, count, color, offColor, animMs } = this.opt;
    const r = size * 0.5;

    for (let i = 0; i < count; i++) {
      const cx = x + r + i * (size + gap);
      const cy = y + r;

      const lit = i < this.current;
      const isNext = (i === this.current) && (this.current < count);

      // 点灯アニメ（直近で点いたものだけ）
      let scale = 1.0;
      let glowAlpha = 0.0;
      if (i === this.lastLitIndex) {
        const t = Math.min(1, (now - this.lastLitAt) / animMs);
        // easeOutBack風：軽くバウンスしてから収束
        const s = 1.70158;
        const eased = 1 + s * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
        scale = 0.85 + 0.25 * eased;       // 0.85→1.10→1.0 くらいの感じ
        glowAlpha = 0.6 * (1 - t);         // 最初に強く光って消える
        if (t >= 1) this.lastLitIndex = -1;
      }

      // 下地のリング（薄い）
      this.ctx.save();
      this.ctx.lineWidth = Math.max(1, size * 0.07);
      this.ctx.strokeStyle = "rgba(255,255,255,0.15)";
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      if (isNext) {
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.008); // 0..1 ゆっくり
        this.ctx.save();
        this.ctx.globalCompositeOperation = "lighter";
        this.ctx.lineWidth = Math.max(1, size * 0.10);
        this.ctx.globalAlpha = 0.18 + 0.22 * pulse;       // 薄く→やや強く
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.71)";            // ランプ色系で発光
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 1.18 * scale, 0, Math.PI * 2); // コアより少し外側
        this.ctx.stroke();
        this.ctx.restore();
      }

      // 発光（点灯時＋アニメ中）
      if (lit || glowAlpha > 0) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = "lighter";
        this.ctx.globalAlpha = (lit ? 0.35 : 0) + glowAlpha;
        const gr = r * 1.8 * scale;
        this.drawGlow(cx - gr, cy - gr, gr * 2, gr * 2);
        this.ctx.restore();
      }

      // コア（本体）
      this.drawDecoratedCore(cx, cy, r * 0.74 * scale, lit ? this.opt.color : offColor, lit);
    }
  }

  private drawDecoratedCore(cx: number, cy: number, rr: number, base: string, lit: boolean) {
    const ctx = this.ctx;

    // 1) 放射グラデ（中心寄りを明るく、外周をやや暗く）
    const g = ctx.createRadialGradient(
      cx - rr * 0.25, cy - rr * 0.25, rr * 0.15, // 斜め上にハイライト寄せ
      cx, cy, rr
    );
    const baseRGB = parseColor(base);
    const cBright = rgbaStr(mix(baseRGB, { r: 255, g: 255, b: 255, a: 1 }, lit ? 0.35 : 0.15), 1);
    const cDark = rgbaStr(mix(baseRGB, { r: 0, g: 0, b: 0, a: 1 }, lit ? 0.35 : 0.15), 1);
    g.addColorStop(0.0, cBright);
    g.addColorStop(0.6, base);
    g.addColorStop(1.0, cDark);

    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();

    // 2) 内リング（発光体っぽい縁取り）
    ctx.lineWidth = Math.max(1, rr * 0.18);
    ctx.strokeStyle = rgbaStr(mix(baseRGB, { r: 255, g: 255, b: 255, a: 1 }, 0.5), lit ? 0.55 : 0.35);
    ctx.beginPath(); ctx.arc(cx, cy, rr * 0.82, 0, Math.PI * 2); ctx.stroke();

    // 3) 斜めハイライト（反射っぽい帯）
    ctx.globalCompositeOperation = "lighter";
    const w = rr * 1.4, h = rr * 0.7;
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 6); // 反射角
    const lg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    lg.addColorStop(0.0, "rgba(255,255,255,0)");
    lg.addColorStop(0.45, "rgba(255,255,255,0.10)");
    lg.addColorStop(0.55, "rgba(255,255,255,0.22)");
    lg.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); ctx.fill();

    // 4) 小さなグリント（点ハイライト）
    // ctx.globalAlpha = 0.9;
    // ctx.fillStyle = "rgba(255,255,255,0.9)";
    // ctx.beginPath(); ctx.arc(-rr * 0.35, -rr * 0.35, rr * 0.10, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  /** 内部: グロー用のオフスクリーンを一度だけ作る */
  private buildGlow() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 56);
    // 中心は白っぽく、外縁を透明に
    grad.addColorStop(0.0, "rgba(255,255,255,0.95)");
    grad.addColorStop(1.0, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill();
    this.glowCanvas = c;
  }

  private drawGlow(dx: number, dy: number, w: number, h: number) {
    if (!this.glowCanvas) return;
    this.ctx.drawImage(this.glowCanvas, dx, dy, w, h);
  }
}

// ───────────────────────── 色ユーティリティ
type RGBA = { r: number; g: number; b: number; a: number };
function parseColor(c: string): RGBA {
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    const v = hex.length === 3
      ? parseInt(hex.split("").map(ch => ch + ch).join(""), 16)
      : parseInt(hex, 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    return { r, g, b, a: 1 };
  }
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const [r, g, b, a = "1"] = m[1].split(",").map(s => s.trim());
    return { r: +r, g: +g, b: +b, a: +a };
  }
  // フォールバック：白
  return { r: 255, g: 255, b: 255, a: 1 };
}
function mix(a: RGBA, b: RGBA, t: number): RGBA {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
    a: a.a + (b.a - a.a) * t,
  };
}
function rgbaStr(c: RGBA, alpha = c.a) { return `rgba(${c.r},${c.g},${c.b},${alpha})`; }