import {JSONExporter} from "./exporters/json";
import {Action} from "./actions";
import React from "react";

export type Callback = (arg:any) => void
export type EVENT_TYPES = "refresh" | "selection-change" | "prop-change" | "object-changed" | "document-change"

export interface FontDef {
    name:string
}

class FontDefImpl implements FontDef {
    name: string;
    constructor(name: string) {
        this.name = name
    }
}

const PALETTE_URL = "https://api.silly.io/api/list/color-palettes"

export class GlobalState {
    renderers: RenderingSystem[]
    jsonexporters:JSONExporter[]
    pdfexporters: PDFExporter[]
    svgexporters: SVGExporter[]
    powerups: Powerup[]
    pickers: PickingSystem[]
    active_handles: Handle[]
    selection: SelectionSystem
    fonts: FontDef[]
    palettes:any[]
    private listeners: Map<string, Callback[]>
    private root: TreeNode

    constructor() {
        this.renderers = []
        this.jsonexporters = []
        this.pdfexporters = []
        this.svgexporters = []
        this.powerups = []
        this.pickers = []
        this.active_handles = []
        this.selection = new SelectionSystem()
        this.fonts = [
            new FontDefImpl('serif'),
            new FontDefImpl('sans-serif'),
            new FontDefImpl('monospace'),
            new FontDefImpl('Montserrat'),
            new FontDefImpl('Oswald'),
            new FontDefImpl('Lobster'),
            new FontDefImpl('Zilla Slab'),
        ]
        this.listeners = new Map<string, Callback[]>()
        // @ts-ignore
        this.root = null
        this.palettes = []
        fetch(PALETTE_URL).then(r => r.json()).then(d => {
            console.log("palette data is",d.data.items)
            this.palettes = d.data.items
        })
    }
    set_root(tree: TreeNode) {
        this.root = tree
        this.dispatch("document-change",this.root)
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

    get_palettes():any{

    }
}

// @ts-ignore
export const GlobalStateContext = React.createContext<GlobalState>();

export interface Powerup {
    init(state: GlobalState):void
    child_options(node:TreeNode):Action[]
    new_doc_actions():Action[]
    export_actions():Action[]
    can_edit(comp:Component):boolean
    get_editor(comp:Component, node:TreeNode, state:GlobalState):any
}

export class DefaultPowerup implements Powerup {
    child_options(node: TreeNode): Action[] {
        return [];
    }

    init(state: GlobalState): void {
    }

    export_actions(): Action[] {
        return [];
    }

    new_doc_actions(): Action[] {
        return [];
    }

    can_edit(comp: Component): boolean {
        return false;
    }

    get_editor(comp: Component, node: TreeNode, state: GlobalState): any {
        return undefined
    }

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

    get x2():number {
        return this.x + this.w
    }
    set x2(v:number) {
        this.w = v - this.x
    }
    get y2(): number {
        return this.y + this.h
    }
    set y2(v:number) {
        this.h = v-this.y
    }

    contains(pt: Point):boolean {
        if(pt.x < this.x) return false
        if(pt.y < this.y) return false
        if(pt.x > this.x+this.w) return false
        if(pt.y > this.y+this.h) return false
        return true
    }

    scale(scale: number) {
        return new Rect(this.x*scale,this.y*scale,this.w*scale,this.h*scale)
    }

    add(bounds: Rect) {
        let r2 = new Rect(this.x,this.y,this.w,this.h)
        if(bounds.x < this.x) r2.x = bounds.x
        if(bounds.y < this.y) r2.y = bounds.y
        if(bounds.x2 > this.x2) r2.x2 = bounds.x2
        if(bounds.y2 > this.y2) r2.y2 = bounds.y2
        return r2
    }

    makeEmpty() {
        return new Rect(
            Number.MAX_VALUE,
            Number.MAX_VALUE,
            Number.MIN_VALUE,
            Number.MIN_VALUE
        )
    }

    translate(position: Point) {
        return new Rect(this.x+position.x,this.y+position.y,this.w,this.h)
    }

    grow(value:number) {
        return new Rect(
            this.x - value,
            this.y -value,
            this.w+value+value,
            this.h+value+value,
        )
    }
}

export interface Component {
    name: string,
}

export type TreeNode = {
    id: string,
    title:string,
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

export const DocName = "DocName"
export interface Doc extends Component {}
export class DocMarker implements Doc {
    name: string;
    constructor() {
        this.name = DocName
    }
}
export const PageName = 'PageName'
export interface Page extends Component {}
export class PageMarker implements Page {
    name: string;
    constructor() {
        this.name = PageName
    }

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

export const ParentTranslateName = "ParentTranslateName"
export interface ParentTranslate extends Component {
    get_translation_point(): Point;
}

export interface System {
    name: string
}

export interface RenderingSystem extends System {
    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void
}
export interface PickingSystem extends System {
    pick_node(pt:Point, node:TreeNode): boolean
}
// export interface PropRenderingSystem extends System {
//     supports(name: string): any;
    // render_view(comp: Component): HTMLElement;
// }

export interface SVGExporter extends System {
    canExport(node:TreeNode, state:GlobalState):boolean
    toSVG(node:TreeNode, state:GlobalState):string
}


export class TreeNodeImpl implements TreeNode {
    id: string
    // @ts-ignore
    parent: TreeNode
    children: TreeNode[]
    components: Component[]
    title: string
    constructor() {
        this.id = "tree_node_" + Math.floor(Math.random() * 1000000)
        this.title = "unnamed"
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

export class SelectionSystem implements System{
    private selection: Set<TreeNode>;
    name: string;

    constructor() {
        this.name = SelectionSystemName
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
    toPDF(node:TreeNode,state:GlobalState,doc:any,scale:number):void
}

export function add_child_to_parent(child: TreeNode, parent: TreeNode): void {
    parent.children.push(child)
    child.parent = parent
}
