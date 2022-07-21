import {JSONExporter} from "./exporters/json";
import {Action} from "./actions";
import React from "react";
import {PDFExporter} from "./exporters/pdf";

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


export const BASIC_COLORS = {
    title:"basic",
    colors:['transparent','#ff0000','#00ff00','#0000ff','#000000','#ffffff']
}
export const GRAYSCALE = {
    title:"grayscale",
    colors:["#000000","#333333","#444444","#888888","#a0a0a0","#bbbbbb","#dddddd",'#ffffff']
}

export class InfoPanel {
    readonly position: Point;
    text: string;
    visible: boolean;
    constructor(pt: Point, text: string) {
        this.position = pt.clone()
        this.text = text
        this.visible = false
    }

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
    infopanel: InfoPanel;

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
        this.palettes = [BASIC_COLORS, GRAYSCALE]
        fetch(PALETTE_URL)
            .then(r => r.json()).then(d =>  d.data.items.forEach((it:any) => this.palettes.push(it)))
            .catch(e => {
                console.log("error loading remote color palettes. just use defaults")
            })
        this.patterns = [
            DIAG_HATCH_IMAGE,
            VERT_HATCH_IMAGE,
            CROSS_HATCH,
        ]
        this.infopanel = new InfoPanel(new Point(0,0),"empty")
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
        // this.log("dispatching",type,payload, this._get_listeners(type).length)
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

    add_and_select(child: TreeNode, parent: TreeNode) {
        add_child_to_parent(child, parent)
        this.selection.set([child])
        this.dispatch('object-changed', {})
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
    can_edit_by_name(comp:string):boolean
    get_editor(comp:Component, node:TreeNode, state:GlobalState):any
    get_editor_by_name(name: string, state: GlobalState): any;
}

export class DefaultPowerup implements Powerup {
    simple_comps: any[];
    constructor() {
        this.simple_comps = []
    }
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

    can_edit_by_name(comp: string): boolean {
        return false;
    }

    get_editor(comp: Component, node: TreeNode, state: GlobalState): any {
        return undefined
    }

    get_editor_by_name(name: string, state: GlobalState): any {
        return undefined
    }

    can_serialize(comp:Component, node:TreeNode, state:GlobalState):boolean {
        if(this.simple_comps.includes(comp.constructor)) return true
        return false
    }

    serialize(comp:Component,node:TreeNode,state:GlobalState):any {
        if(this.simple_comps.includes(comp.constructor)) return { powerup:this.constructor.name, klass:comp.constructor.name }
        throw new Error("cannot serialize "+comp.constructor.name)
    }

    can_deserialize(obj:any, state:GlobalState):boolean {
        return (obj && obj.powerup === this.constructor.name)
    }

    deserialize(obj:any, node:TreeNode, state:GlobalState):Component {
        throw new Error("deserialize not implemented for " + JSON.stringify(obj))
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

    add(pt: Point) {
        return new Point(this.x+pt.x, this.y+pt.y)
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

    clone() {
        return new Point(this.x,this.y)
    }
    toJSON() {
        return {
            x:this.x,
            y:this.y,
        }
    }

    static fromJSON(point: { x: number; y: number }) {
        return new Point(point.x,point.y)
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
    get position():Point {
        return new Point(this.x,this.y)
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

    grow(pt:Point) {
        return new Rect(
            this.x - pt.x,
            this.y - pt.y,
            this.w + pt.x+pt.x,
            this.h + pt.y+pt.y,
        )
    }

    center() {
        return new Point(this.x+this.w/2, this.y + this.h/2)
    }

    clone() {
        return new Rect(this.x,this.y,this.w,this.h)
    }

    toJSON() {
        return {
            x:this.x,
            y:this.y,
            h:this.h,
            w:this.w,
        }
    }

    static fromJSON(b:any) {
        return new Rect(b.x,b.y,b.w,b.h)
    }
}

export interface Component {
    name: string,
}
export interface MultiComp {
    isMulti():boolean
    supports():string[]
}

export type TreeNode = {
    id: string,
    title:string,
    parent: TreeNode,
    children: TreeNode[],
    has_component(name:string):boolean
    get_component(name:string):Component
}

export type FillType = "hexstring" | "pattern"
export interface FilledShape extends Component {
    get_fill_type():FillType
    get_fill(): any
    set_fill(fill:any):void
}

export interface BorderedShape extends Component {
    get_border_fill():any
    set_border_fill(fill:any):void
    get_border_width():number
    set_border_width(width:number):void
}

export const DocName = "DocName"
export interface Doc extends Component {
    get_title():string
    set_title(title:string):void
}
export class DocMarker implements Doc {
    name: string;
    title:string;
    constructor() {
        this.name = DocName
        this.title = "untitled"
    }

    get_title(): string {
        return this.title
    }
    set_title(title: string): void {
        this.title = title
    }
}

export enum Unit {
    Pixels,
    Centimeter,
    Inch,
    Point,
}

export const PageName = 'PageName'
export interface Page extends Component {
    unit:Unit
}
export class PageMarker implements Page {
    name: string;
    unit: Unit;
    ppu: number;
    constructor() {
        this.name = PageName
        this.unit = Unit.Pixels
        this.ppu = 1
    }

}
//indicates shape can be moved
export const MovableName = "MovableName"
export interface Movable extends Component {
    moveBy(pt:Point):void
    moveTo(pt:Point):void
    position():Point
}

export const ResizableName = "ResizableName"
export interface Resizable extends Component {
    get_handle(): Handle
}

export const RadiusSelectionName = "RadiusSelectionName"
export interface RadiusSelection extends Component {
    get_handle():Handle
}

export const ParentLikeName = "ParentLikeName"
export interface ParentLike extends CenterPosition {
    get_child_bounds(): Rect
}

export const ParentDrawChildrenName = "ParentDrawChildrenName"
export interface ParentDrawChildren extends Component {}

export const RenderBoundsName = "RenderBoundsName"
export interface RenderBounds extends Component {
    get_bounds():Rect
}


export interface System {
    name: string
}
export interface CanvasRenderSurface {
    ctx:CanvasRenderingContext2D,
    selectionEnabled:boolean,
    inset:boolean,
    unit:Unit,
    ppu:number,
    scale:number
}

export interface RenderingSystem extends System {
    render(surf:CanvasRenderSurface, node: TreeNode, state: GlobalState): void
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
    private components: Component[]
    private comps:Map<string,Component>
    title: string
    constructor() {
        this.id = "tree_node_" + Math.floor(Math.random() * 1000000)
        this.title = "unnamed"
        this.children = []
        this.components = []
        this.comps = new Map<string, Component>()
    }
    remove_child(node:TreeNode) {
        this.children = this.children.filter(ch => ch !== node)
    }
    add_child(node:TreeNode) {
        if(node.parent) (node.parent as TreeNodeImpl).remove_child(node)
        this.children.push(node)
        node.parent = this
    }
    add_component(comp:Component) {
        this.components.push(comp)
        this.comps.set(comp.name,comp)
        // @ts-ignore
        if(typeof comp.isMulti !== "undefined") {
            (comp as unknown as MultiComp).supports().forEach(name => {
                this.comps.set(name,comp)
            })
        }
    }

    get_component(name:string): Component {
        // @ts-ignore
        return this.comps.get(name)
    }

    has_component(name:string): boolean {
        return this.comps.has(name)
    }

    all_components():Component[] {
        return this.components
    }
    all_component_names():string[] {
        return Array.from(this.comps.keys())
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

export const BorderedShapeName = "BorderedShapeName"
export class BorderedShapeObject implements BorderedShape {
    name: string;
    private fill:any;
    private width:number;
    constructor(color:string, width:number=1) {
        this.name = BorderedShapeName
        this.fill = color
        this.width = width
    }

    get_border_fill(): any {
        return this.fill
    }

    get_border_width(): number {
        return this.width
    }

    set_border_fill(fill: any): void {
        this.fill = fill
    }

    set_border_width(width: number): void {
        this.width = width
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
    size() {
        return this.selection.size
    }
}

export abstract class Handle {
    x: number;
    y: number;
    size: number;
    protected constructor(x:number, y:number) {
        this.x = x
        this.y = y
        this.size = 32
    }
    update_from_node() {

    }

    moveBy(diff: Point) {

    }

    abstract display_value():string

    contains(pt: Point, ppu: number) {
        let s = this.size/ppu
        let r = new Rect(this.x-s/2,this.y-s/2,s,s)
        return r.contains(pt)
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


export function add_child_to_parent(child: TreeNode, parent: TreeNode): void {
    parent.children.push(child)
    child.parent = parent
}

export const CenterPositionName = "CenterPositionName"

export interface CenterPosition extends Component {
    get_position(): Point
}

export class MovableCenterPosition implements Movable {
    name: string;
    private shape: CenterPosition;

    constructor(node:TreeNode) {
        this.name = MovableName
        this.shape = node.get_component(CenterPositionName) as CenterPosition
    }

    moveBy(pt: Point): void {
        this.shape.get_position().x += pt.x
        this.shape.get_position().y += pt.y
    }

    moveTo(pt: Point): void {
        this.shape.get_position().x = pt.x
        this.shape.get_position().y = pt.y
    }

    position(): Point {
        return this.shape.get_position()
    }
}
