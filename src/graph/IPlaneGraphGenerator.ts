import { Graph } from "../graph";

export interface IPlaneGraphGenerator {
    create( ctx: CanvasRenderingContext2D, cntNode: number ): Graph;
}