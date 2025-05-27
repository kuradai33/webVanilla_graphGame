import * as define from "./define";

class Shape{
    draw(){};
}

export class GraphNode extends Shape{
    public id: number;
    private center_x: number;
    private center_y: number;
    private ctx: CanvasRenderingContext2D;
    private fill_color: "black" | "red" = "black";

    constructor(ctx: CanvasRenderingContext2D, cx: number, cy: number, id: number){
        super();
        this.ctx = ctx;
        this.center_x = cx;
        this.center_y = cy;
        this.id = id;
    }

    get_pos(): [number, number]{ return [this.center_x, this.center_y] }

    get_distance(x: number, y: number): number{
        return Math.sqrt((this.center_x - x) ** 2 + (y - this.center_y) ** 2);
    }

    set_fillcolor(c: "black" | "red") {
        this.fill_color = c;
    }

    set_pos(x: number, y: number){
        this.center_x = x;
        this.center_y = y;
    }

    draw(){
        this.ctx.beginPath();
        this.ctx.arc(this.center_x, this.center_y, define.NODE_RADIUS, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.fill_color;
        this.ctx.fill();
        this.ctx.closePath();
    }
};

export class GraphEdge extends Shape{
    private node1: GraphNode;
    private node2: GraphNode;
    private ctx: CanvasRenderingContext2D;

    private color: "black" | "red" | "yellow" = "black";

    constructor(ctx: CanvasRenderingContext2D, n1: GraphNode, n2: GraphNode){
        super();
        this.ctx = ctx;
        this.node1 = n1;
        this.node2 = n2;
    }

    set_color(c: "black" | "red" | "yellow") { this.color = c; }

    draw(){
        const lineWidth = this.ctx.lineWidth;
        const pre_color = this.ctx.strokeStyle;
        const [x1, y1] = this.node1.get_pos(), [x2, y2] = this.node2.get_pos();

        this.ctx.lineWidth = define.EDGE_WIDTH;
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.closePath();

        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = pre_color;
    }

    check_crossed(edge: GraphEdge){
        // https://qiita.com/zu_rin/items/e04fdec4e3dec6072104
        const [a1x, a1y] = this.node1.get_pos();
        const [a2x, a2y] = this.node2.get_pos();
        const [b1x, b1y] = edge.node1.get_pos();
        const [b2x, b2y] = edge.node2.get_pos();

        const s1 = (a1x - a2x) * (b1y - a1y) - (a1y - a2y) * (b1x - a1x);
        const t1 = (a1x - a2x) * (b2y - a1y) - (a1y - a2y) * (b2x - a1x);
        if(s1 * t1 > 0) return false;

        const s2 = (b1x - b2x) * (a1y - b1y) - (b1y - b2y) * (a1x - b1x);
        const t2 = (b1x - b2x) * (a2y - b1y) - (b1y - b2y) * (a2x - b1x);
        if(s2 * t2 > 0) return false;

        return true;
    }

    check_neighbor(edge: GraphEdge){
        return this.node1 == edge.node1 || this.node1 == edge.node2 || this.node2 == edge.node1 || this.node2 == edge.node2;
    }
};

export class OperateGraph{
    private graph_nodes: GraphNode[] = [];
    private graph_edges: GraphEdge[] = [];
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D){
        this.ctx = ctx;
    }

    public get_nodes(): GraphNode[]{ return this.graph_nodes; }
    public get_ctx(): CanvasRenderingContext2D{ return this.ctx; }

    public add_graph_ele(e: Shape){
        if(e instanceof GraphNode) this.graph_nodes.push(e);
        else if(e instanceof GraphEdge) this.graph_edges.push(e);
    }

    public update_edge_color(): boolean{
        const crossed = this.check_crossed_edges();
        const len = this.graph_edges.length;

        let crossed_graph = false;
        for(let i = 0; i < len; i++){
            this.graph_edges[i].set_color(crossed[i] ? "red" : "black");
            crossed_graph ||= crossed[i];
        }

        return crossed_graph;
    }

    public check_crossed_graph(): boolean{
        const len = this.graph_edges.length;
        const crossed = this.check_crossed_edges();

        return !(crossed.every((e) => !e));
    }

    private check_crossed_edges(): boolean[]{
        const len = this.graph_edges.length;
        let crossed: boolean[] = Array(len).fill(false);
        for(let i = 0; i < len; i++) for(let j = i + 1; j < len; j++){
            if(this.graph_edges[i].check_neighbor(this.graph_edges[j])) continue;
            if(this.graph_edges[i].check_crossed(this.graph_edges[j])){
                crossed[i] = true;
                crossed[j] = true;
            }
        }
        return crossed;
    }

    public draw_all(){
        this.ctx.clearRect(0, 0, define.CANVAS_HEIGHT, define.CANVAS_WIDTH);
        for(const e of this.graph_edges) e.draw();
        for(const e of this.graph_nodes) e.draw();
    }

    public get_closest_shape(x: number, y: number): GraphNode | null{
        let min_dist: number = Infinity;
        let closest_node: GraphNode | null = null;
        for(const node of this.graph_nodes){
            const dist = node.get_distance(x, y);
            console.log(`${node.id} ${dist}`);
            if(min_dist > dist){
                min_dist = dist;
                closest_node = node;
            }
        }
        return closest_node;
    }

    public draw_cleared_graph(){
        for(const edge of this.graph_edges) edge.set_color("yellow");
        console.log("fin");
        this.draw_all();
    }
};