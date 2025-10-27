import { Graph } from "./graph";

export interface PlaneGraphGenerator {
    create(canvas: HTMLCanvasElement, cntNode: number): Graph;
}