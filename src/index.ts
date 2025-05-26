const CANVAS_HEIGHT: number = 500, CANVAS_WIDTH: number = 500;
const NODE_RADIUS = 10, EDGE_WIDTH = 5;

const controller = new AbortController();
const signal = controller.signal;

let ele_body: HTMLBodyElement;
let ele_canvas: HTMLCanvasElement;
let ele_pos: HTMLElement;
let ele_info: HTMLElement;

class Shape{
    draw(){};
}

class GraphNode extends Shape{
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
        this.ctx.arc(this.center_x, this.center_y, NODE_RADIUS, 0, 2 * Math.PI);
        this.ctx.fillStyle = this.fill_color;
        this.ctx.fill();
        this.ctx.closePath();
    }
};

class GraphEdge extends Shape{
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

        this.ctx.lineWidth = EDGE_WIDTH;
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

class OperateGraph{
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
        this.ctx.clearRect(0, 0, CANVAS_HEIGHT, CANVAS_WIDTH);
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

init_process();
function init_process(){
    // キャンバスを取得
    const game_screen = document.getElementById("game_screen");
    if(game_screen == null || !(game_screen instanceof HTMLCanvasElement)){
        console.error("キャンバスが存在しません");
        return;
    }
    const ctx = game_screen.getContext("2d");
    if(ctx == null){
        console.error("キャンバスのコンテキストの取得に失敗しました");
        return;
    }
    // キャンバスの大きさを設定
    game_screen.height = CANVAS_HEIGHT;
    game_screen.width = CANVAS_WIDTH;
    ele_canvas = game_screen;

    const body = document.getElementsByTagName("body")[0];
    ele_body = body;

    const pos = document.getElementById("pos");
    if(pos == null){
        console.error("存在しません");
        return;
    }
    ele_pos = pos;
    ele_pos.innerText = `x:0 y:0 drag:false`;

    const info = document.getElementById("info");
    if(info == null){
        console.error("存在しません");
        return;
    }
    ele_info = info;

    // 描画
    const opeg = new OperateGraph(ctx);
    create_planegraph(ctx, opeg);

    opeg.update_edge_color();
    opeg.draw_all();

    setting_canvas_event(opeg);

}

function setting_canvas_event(opeg: OperateGraph){
    let is_dragging = false;
    let mouse_startX: number, mouse_startY: number;
    let node_startX: number, node_startY: number;
    let operated_node: GraphNode | null;

    ele_canvas.addEventListener("mousedown", (e: MouseEvent) => {
        const rect = ele_canvas.getBoundingClientRect();
        const x: number = e.clientX - rect.left;
        const y: number = e.clientY - rect.top;

        mouse_startX = x;
        mouse_startY = y;

        operated_node = opeg.get_closest_shape(x, y);
        operated_node?.set_fillcolor("red");
        operated_node?.draw();
        const pos = operated_node?.get_pos();
        if(pos != undefined){
            node_startX = pos[0];
            node_startY = pos[1];
        }
        
        is_dragging = true;
        ele_pos.innerText = `x:${x} y:${y} drag:${is_dragging}`;
    }, {signal: signal});
    ele_body.addEventListener("mousemove", (e: MouseEvent) => {
        if(!is_dragging) return;
        const rect = ele_canvas.getBoundingClientRect();
        const x: number = e.clientX - rect.left;
        const y: number = e.clientY - rect.top;
        const processed_x = Math.min(Math.max(x - mouse_startX + node_startX, NODE_RADIUS), CANVAS_WIDTH - NODE_RADIUS);
        const processed_y = Math.min(Math.max(y - mouse_startY + node_startY, NODE_RADIUS), CANVAS_HEIGHT - NODE_RADIUS);

        operated_node?.set_pos(processed_x, processed_y);
        opeg.update_edge_color();
        opeg.draw_all();
        ele_pos.innerText = `x:${x} y:${y} drag:${is_dragging}`;
    });
    ele_body.addEventListener("mouseup", (e: MouseEvent) => {
        if(!is_dragging) return;
        operated_node?.set_fillcolor("black");
        operated_node?.draw();
        is_dragging = false;
        if(!opeg.check_crossed_graph()){
            process_fingame(opeg);
        }

        const rect = ele_canvas.getBoundingClientRect();
        const x: number = e.clientX - rect.left;
        const y: number = e.clientY - rect.top;
        ele_pos.innerText = `x:${x} y:${y} drag:${is_dragging}`;
    });
}

function create_planegraph(ctx: CanvasRenderingContext2D, opeg: OperateGraph){
    // 頂点を作成
    const CNT_NODE = 8;
    for(let i = 0; i < CNT_NODE; i++){
        let x = Math.random() * 460 + 20;
        let y = Math.random() * 460 + 20;
        const node = new GraphNode(ctx, x, y, i);
        opeg.add_graph_ele(node);
    }

    // 辺を作成
    const nodes = opeg.get_nodes();
    const edges_num = create_planegraph_edges(CNT_NODE);
    for(const edge_num of edges_num){
        opeg.add_graph_ele(new GraphEdge(ctx, nodes[edge_num[0]], nodes[edge_num[1]]));
    }

    ele_info.innerText = `node:${CNT_NODE} edge:${edges_num.length}`;
}

function create_planegraph_edges(cnt_node: number): [number, number][]{
    let left_edges: [number, number][] = [], right_edges: [number, number][] = [];
    let cnt_fail = 0;
    while(cnt_fail < 1000){
        const add_left = get_randint(0, 2) == 0;
        const start = get_randint(0, cnt_node - 1);
        const end = get_randint(start + 1, cnt_node);
        const new_edge: [number, number] = [start, end];
        if(add_left && check_crossing(left_edges, new_edge)) left_edges.push(new_edge);
        else if(check_crossing(right_edges, new_edge)) right_edges.push(new_edge);
        else{
            cnt_fail++;
            continue;
        }
        cnt_fail = 0;
    }

    console.log(left_edges.sort());
    console.log("-----");
    console.log(right_edges.sort());

    const all_edges = left_edges.concat(right_edges);
    return all_edges;
}

function check_crossing(existed_edges: [number, number][], new_edge: [number, number]): boolean{
    for(const edge of existed_edges){
        const inside = edge[0] <= new_edge[0] && new_edge[1] <= edge[1];
        const outside = new_edge[0] <= edge[0] && edge[1] <= new_edge[1];
        const equal = new_edge[0] == edge[0] && edge[1] == new_edge[1];
        if(equal || !(inside || outside)) return false;
    }
    return true;
}

function get_randint(start: number, end: number): number{ // [start, end)
    if(start > end){
        const tmp = start;
        start = end;
        end = tmp;
    }
    return Math.floor(Math.random() * (end - start)) + start;
}

function process_fingame(opeg: OperateGraph){
    // イベントリスナを削除
    controller.abort();

    opeg.draw_cleared_graph();
    ele_info.innerText = "CLEAR!";
}