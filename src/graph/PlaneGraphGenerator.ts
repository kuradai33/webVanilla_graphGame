import { Graph } from "./Graph";

export interface PlaneGraphGenerator {
    create(canvas: HTMLCanvasElement, cntNode: number): Graph;
}