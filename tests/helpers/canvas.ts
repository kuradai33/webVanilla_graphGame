export function makeCtx(): CanvasRenderingContext2D {
    const c = document.createElement('canvas');
    c.width = 500;
    c.height = 500;
    return c.getContext('2d') as CanvasRenderingContext2D;
}

export function makeCanvas(w = 500, h = 500): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}
