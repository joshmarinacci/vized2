import {JSONExporter} from "./exporters/json";

export type Callback = (arg:any) => void
export type EVENT_TYPES = "refresh" | "selection-change" | "prop-change" | "object-changed"

export class GlobalState {
    renderers: RenderingSystem[]
    jsonexporters:JSONExporter[]
    powerups: Powerup[]
    pickers: PickingSystem[]
    active_handles: Handle[]
    selection: SelectionSystem
    private listeners: Map<string, Callback[]>
    private root: TreeNode
    // props_renderers:PropRenderingSystem[]

    constructor() {
        this.renderers = []
        this.jsonexporters = []
        this.powerups = []
        this.pickers = []
        this.active_handles = []
        this.selection = new SelectionSystem()
        this.listeners = new Map<string, Callback[]>()
        // @ts-ignore
        this.root = null
        // this.props_renderers = []
    }
    set_root(tree: TreeNode) {
        this.root = tree
    }
    get_root(): TreeNode {
        return this.root
    }
    on(type: EVENT_TYPES, cb: Callback) {
        this._get_listeners(type).push(cb)
    }
    off(type: EVENT_TYPES, cb:Callback) {
        let list = this._get_listeners(type)
        let n = list.indexOf(cb)
        if(n > 0) list.splice(n,1)
    }

    private _get_listeners(type: string):Callback[] {
        if (!this.listeners.has(type)) this.listeners.set(type, [])
        // @ts-ignore
        return this.listeners.get(type)
    }

    dispatch(type: EVENT_TYPES, payload: any) {
        // this.log("dispatching",type,payload)
        this._get_listeners(type).forEach(cb => cb(payload))
    }

    private log(...args:any[]) {
        console.log("GLOBAL:", ...args)
    }
}

export interface Powerup {
    init(state: GlobalState):void
}

export class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    from_object(obj:any) {
        this.x = obj.x
        this.y = obj.y
        return this
    }

    subtract(pt: Point) {
        return new Point(this.x-pt.x, this.y-pt.y)
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    multiply(scale: number) {
        return new Point(this.x*scale,this.y*scale)
    }
}

export class Rect {
    constructor(x: number, y: number, w: number, h: number) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }

    x: number
    y: number
    w: number
    h: number

    contains(pt: Point):boolean {
        if(pt.x < this.x) return false
        if(pt.y < this.y) return false
        if(pt.x > this.x+this.w) return false
        if(pt.y > this.y+this.h) return false
        return true
    }
}

export interface Component {
    name: string,
}

export type TreeNode = {
    id: string,
    parent: TreeNode,
    children: TreeNode[],
    components: Component[],
    has_component(name:string):boolean
    get_component(name:string):Component
}

export interface FilledShape extends Component {
    get_color(): string
    set_color(color:string):void
}

//indicates shape can be moved
export const MovableName = "MovableName"
export interface Movable extends Component {
    moveBy(pt:Point):void
}

export const ResizableName = "ResizableName"
export interface Resizable extends Component {
    get_handle(): Handle,
}

export interface System {
    name: string
}

export interface RenderingSystem extends System {
    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void
}
export interface PickingSystem extends System {
    pick(pt:Point, state:GlobalState): TreeNode[]
}
// export interface PropRenderingSystem extends System {
//     supports(name: string): any;
    // render_view(comp: Component): HTMLElement;
// }

export interface SVGExporter extends System {
    canExport(node:TreeNode):boolean
    toSVG(node:TreeNode):string
}


export class TreeNodeImpl implements TreeNode {
    id: string
    // @ts-ignore
    parent: TreeNode
    children: TreeNode[]
    components: Component[]
    constructor() {
        this.id = "tree_node_" + Math.floor(Math.random() * 1000000)
        this.children = []
        this.components = []
    }


    get_component(name:string): Component {
        // @ts-ignore
        return this.components.find(comp => comp && comp.name === name)
    }

    has_component(name:string): boolean {
        let comps = this.components.find(comp => comp && comp.name === name)
        if (comps) return true
        return false
    }
}

export const FilledShapeName = "FilledShapeName"

export class FilledShapeObject implements FilledShape {
    name: string;
    private color: string;

    constructor(color: string) {
        this.name = FilledShapeName
        this.color = color
    }

    get_color(): string {
        return this.color
    }
    set_color(color: string) {
        this.color = color
    }
}

const SelectionSystemName = 'SelectionSystemName'

export class SelectionSystem {
    private selection: Set<TreeNode>;

    constructor() {
        this.selection = new Set<TreeNode>()
    }

    add(nodes: TreeNode[]) {
        nodes.forEach(n => this.selection.add(n))
    }

    set(nodes: TreeNode[]) {
        this.selection.clear()
        nodes.forEach(n => this.selection.add(n))
    }

    clear() {
        this.selection.clear()
    }

    get(): TreeNode[] {
        return Array.from(this.selection.values())
    }

    has(nd: TreeNode) {
        return this.selection.has(nd)
    }

    isEmpty() {
        return (this.selection.size<=0)
    }
}

export abstract class Handle extends Rect {
    protected constructor(x:number, y:number) {
        super(x,y,10,10);
    }
    update_from_node() {

    }

    moveBy(diff: Point) {

    }
}

export interface MouseGestureDelegate {
    press(e: MouseEvent, pt:Point):void
    move(e: MouseEvent, pt:Point):void
    release(e: MouseEvent, pt:Point):void
}

// export class FilledShapePropRenderer implements PropRenderingSystem {
//     name: string;
//     private state:GlobalState
//     private colors: string[];
//
//     constructor(state:GlobalState) {
//         this.name = "FilledShapePropRenderer"
//         this.state = state
//         this.colors = [
//             '#ff00ff','#ff0000',
//             '#ffff00','#00ff00',
//             '#00ffff','#0000ff',
//             '#ffffff','#000000']
//     }
//
//     render_view(comp: Component): HTMLElement {
//         let size = 20
//         let w = 100
//         let wrap = Math.floor(w/size)
//         const n2xy = (n) => ({
//             x:n%wrap * size,
//             y:Math.floor(n/wrap) * 20
//         })
//         const xy2n = (xy) => {
//             let x = Math.floor(xy.x/size)
//             let y = Math.floor(xy.y/size)
//             return x + y*wrap
//         }
//         let fill:FilledShape = comp as FilledShape
//         let canvas = document.createElement('canvas')
//         canvas.width = w
//         canvas.height = w
//
//         const redraw = () => {
//             let ctx = canvas.getContext('2d')
//             ctx.fillStyle = 'white'
//             ctx.fillRect(0,0,canvas.width,canvas.height)
//             this.colors.forEach((color,i)=>{
//                 ctx.fillStyle = color
//                 let pt = n2xy(i)
//                 ctx.fillRect(pt.x,pt.y,20,20)
//                 if(color === fill.get_color()) {
//                     ctx.strokeStyle = 'black'
//                     ctx.strokeRect(pt.x,pt.y,20,20)
//                 }
//             })
//         }
//         canvas.addEventListener('click',(e)=>{
//             let target: HTMLElement = <HTMLElement>e.target
//             let bounds = target.getBoundingClientRect()
//             let pt = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
//             let n = xy2n(pt)
//             if(n >= 0 && n < this.colors.length) {
//                 let color = this.colors[n]
//                 fill.set_color(color)
//                 this.state.dispatch("prop-change", {})
//                 redraw()
//             }
//         })
//         redraw()
//         return canvas
//     }
//
//     supports(name: string): any { return name === FilledShapeName }
// }

// export function COLOR_PICKER(colors:string[],cb:(v)=>void) {
//
// }
//
export function forceDownloadBlob(title:string, blob:Blob) {
    console.log("forcing download of",title)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = title
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

export interface PDFExporter extends System {
    canExport(node:TreeNode):boolean
    toPDF(node:TreeNode,doc:any):void
}
