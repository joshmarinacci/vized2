import {JSONExporter} from "./exporters/json";
import {Action} from "./actions";
import React from "react";

export const DIAG_HATCH_IMAGE = new Image()
// DIAG_HATCH_IMAGE.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAD0lEQVQImWNgQAX/yeAAAIHCA/0RE2WAAAAAAElFTkSuQmCC"
DIAG_HATCH_IMAGE.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAH0lEQVQImWP4jwQYGBj+MyBz/v//DxGAcaBsBmRd/wHbvDPNthtgEQAAAABJRU5ErkJggg=="

export const VERT_HATCH_IMAGE = new Image()
VERT_HATCH_IMAGE.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAEUlEQVQYlWNgQAX/CfCHqwIAwakP8c7+oCsAAAAASUVORK5CYII="

export const CROSS_HATCH = new Image()
CROSS_HATCH.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYlWNgYGD4z4Ab/MdgYJPEJoDT1P8ErMSvAK8VeB2J15sAIVgP8RldsJUAAAAASUVORK5CYII="

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

export type ImageReference = {
    width: number;
    height: number;
    id:string
    loaded:boolean
    dom_image:HTMLImageElement
    url:string
}

function file_to_DataURL(file: File):Promise<string> {
    return new Promise((res,rej)=>{
        let fr = new FileReader()
        fr.addEventListener('load',()=> {
            // @ts-ignore
            res(fr.result)
        })
        fr.addEventListener("error", (e)=>{
            rej(e)
        })
        fr.readAsDataURL(file)
    })
}

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
    patterns:any[]
    private listeners: Map<string, Callback[]>
    private root: TreeNode
    private images:ImageReference[]
    active_v_snap: number;
    active_h_snap: number;

    constructor() {
        this.renderers = []
        this.jsonexporters = []
        this.pdfexporters = []
        this.svgexporters = []
        this.powerups = []
        this.pickers = []
        this.active_handles = []
        this.selection = new SelectionSystem()
        this.images = []
        this.active_v_snap = -1
        this.active_h_snap = -1
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
        fetch(PALETTE_URL).then(r => r.json()).then(d => this.palettes = d.data.items)
        this.patterns = [
            DIAG_HATCH_IMAGE,
            VERT_HATCH_IMAGE,
            CROSS_HATCH,
        ]
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

    image_ready(imageid: string | null) {
        let img = this.images.find(im => im.id === imageid)
        if(img && img.loaded) return true
        return false;
    }

    get_DomImage(imageid: string | null):HTMLImageElement {
        let img  = this.images.find(im => im.id === imageid) as ImageReference
        return img.dom_image
    }

    add_image_from_url(url: string):Promise<ImageReference> {
        return new Promise((res,rej)=>{
            let img:ImageReference = {
                id:  "image_asset_" + Math.floor(Math.random() * 1000000),
                width: 0,
                height: 0,
                loaded: false,
                dom_image:new Image(),
                url:url
            }
            img.dom_image.addEventListener('load',()=>{
                console.log("image is loaded now",img.id,img.dom_image)
                img.width = img.dom_image.width
                img.height = img.dom_image.height
                img.loaded = true
                this.images.push(img)
                res(img)
                setTimeout(()=>  this.dispatch("refresh",img),0)
            })
            img.dom_image.src = url
        })
    }

    async add_image_from_file(file: File) {
        let data_url = await file_to_DataURL(file)
        return await this.add_image_from_url(data_url)
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
    empty: boolean
    x: number
    y: number
    w: number
    h: number
    constructor(x: number, y: number, w: number, h: number) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.empty = false
    }


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

    add(r2: Rect) {
        if( this.empty && !r2.empty) return r2
        if(!this.empty &&  r2.empty) return this.clone()
        let x1 = Math.min(this.x,  r2.x)
        let x2 = Math.max(this.x2, r2.x2)
        let y1 = Math.min(this.y,  r2.y)
        let y2 = Math.max(this.y2, r2.y2)
        return new Rect(x1, y1, x2-x1, y2-y1)
    }

    makeEmpty() {
        let rect = new Rect(
            Number.MAX_VALUE,
            Number.MAX_VALUE,
            Number.MIN_VALUE,
            Number.MIN_VALUE
        )
        rect.empty = true
        return rect
    }

    translate(position: Point) {
        return new Rect(this.x+position.x,this.y+position.y,this.w,this.h)
    }

    grow(value:number) {
        return new Rect(
            this.x - value,
            this.y - value,
            this.w + value+value,
            this.h + value+value,
        )
    }

    center() {
        return new Point(this.x+this.w/2, this.y + this.h/2)
    }

    private clone() {
        return new Rect(this.x,this.y,this.w,this.h)
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

export type FillType = "hexstring" | "pattern"
export interface FilledShape extends Component {
    get_fill_type():FillType
    get_fill(): any
    set_fill(fill:any):void
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
    private fill_type:FillType
    private fill: any;
    constructor(color:string) {
        this.name = FilledShapeName
        this.fill_type = "hexstring"
        this.fill = color
    }

    get_fill(): any {
        return this.fill
    }

    get_fill_type(): FillType {
        return this.fill_type
    }

    set_fill(fill: any): void {
        this.fill = fill
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
