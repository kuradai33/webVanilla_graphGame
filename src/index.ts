import * as graph from "./graph";
import * as define from "./define";

const controller = new AbortController();
const signal = controller.signal;

let ele_body: HTMLBodyElement;
let ele_canvas: HTMLCanvasElement;
let ele_pos: HTMLElement;
let ele_info: HTMLElement;

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
    game_screen.height = define.CANVAS_HEIGHT;
    game_screen.width = define.CANVAS_WIDTH;
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
    const opeg = new graph.OperateGraph(ctx);
    create_planegraph(ctx, opeg);

    opeg.update_edge_color();
    opeg.draw_all();

    setting_canvas_event(opeg);

}

function setting_canvas_event(opeg: graph.OperateGraph){
    let is_dragging = false;
    let mouse_startX: number, mouse_startY: number;
    let node_startX: number, node_startY: number;
    let operated_node: graph.GraphNode | null;

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
        const processed_x = Math.min(Math.max(x - mouse_startX + node_startX, define.NODE_RADIUS), define.CANVAS_WIDTH - define.NODE_RADIUS);
        const processed_y = Math.min(Math.max(y - mouse_startY + node_startY, define.NODE_RADIUS), define.CANVAS_HEIGHT - define.NODE_RADIUS);

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

function create_planegraph(ctx: CanvasRenderingContext2D, opeg: graph.OperateGraph){
    // 頂点を作成
    const CNT_NODE = 8;
    for(let i = 0; i < CNT_NODE; i++){
        let x = Math.random() * 460 + 20;
        let y = Math.random() * 460 + 20;
        const node = new graph.GraphNode(ctx, x, y, i);
        opeg.add_graph_ele(node);
    }

    // 辺を作成
    const nodes = opeg.get_nodes();
    const edges_num = create_planegraph_edges(CNT_NODE);
    for(const edge_num of edges_num){
        opeg.add_graph_ele(new graph.GraphEdge(ctx, nodes[edge_num[0]], nodes[edge_num[1]]));
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

function process_fingame(opeg: graph.OperateGraph){
    // イベントリスナを削除
    controller.abort();

    opeg.draw_cleared_graph();
    ele_info.innerText = "CLEAR!";
}