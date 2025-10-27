/**
 * ゲーム画面背景の色
 */
const bgColor = "#0b0f1a";
/**
 * ゲーム画面背景のグリッドのスタイル
 */
const bgGridStyle = {
    /**
     * グリッドのサイズ
     */
    grid: { height: 80, width: 80 },
    /**
     * グリッドの線の色
     */
    color: "#111829",
    /**
     * グリッドの線の幅
     */
    lineWidth: 1,
};

/**
 * 背景を描画する。
 */
export default function drawBackground(ctx: CanvasRenderingContext2D, canvasSize: { height: number; width: number }) {
    const origin = { y: canvasSize.height / 2, x: canvasSize.width / 2 };
    const { height, width } = canvasSize;
    const { grid, color, lineWidth } = bgGridStyle;
    if (!ctx) throw new Error("Property is unsetted");

    // 背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // グリッドの描画
    // 縦線
    for (let i = 0; origin.x + grid.width * i <= width; i++) {
        drawVerticalLine(origin.x + grid.width * i, color, lineWidth, height, ctx);
    }
    for (let i = 1; origin.x - grid.width * i >= 0; i++) {
        drawVerticalLine(origin.x - grid.width * i, color, lineWidth, height, ctx);
    }

    // 横線
    for (let i = 0; origin.y + grid.height * i <= height; i++) {
        drawHorizontalLine(origin.y + grid.height * i, color, lineWidth, width, ctx);
    }
    for (let i = 1; origin.y - grid.height * i >= 0; i++) {
        drawHorizontalLine(origin.y - grid.height * i, color, lineWidth, width, ctx);
    }
}

/**
 * 縦線をキャンバスに描画する。
 * @param x - 縦線を引くx座標
 * @param color - 線の色
 * @param lineWidth - 線の幅
 * @param ctx - 線の描画対象
 */
function drawVerticalLine(
    x: number,
    color: string,
    lineWidth: number,
    canvasHeight: number,
    ctx: CanvasRenderingContext2D
) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
}

/**
 * 横線をキャンバスに描画する。
 * @param y - 横線を引くy座標
 * @param color - 線の色
 * @param lineWidth - 線の幅
 * @param ctx - 線の描画対象
 */
function drawHorizontalLine(
    y: number,
    color: string,
    lineWidth: number,
    canvasWidth: number,
    ctx: CanvasRenderingContext2D
) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
}