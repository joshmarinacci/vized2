import {
    add_child_to_parent,
    BorderedShape,
    BorderedShapeName,
    BorderedShapeObject,
    CanvasRenderSurface,
    CenterPosition,
    CenterPositionName,
    Component,
    DefaultPowerup,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    GlobalState,
    MovableCenterPosition,
    MultiComp,
    PageName,
    ParentLikeName,
    Point,
    Rect,
    RenderBounds,
    RenderBoundsName,
    RenderingSystem,
    SVGExporter,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {Action} from "../actions";
import {CircleLikeShape, CircleLikeShapeName, CirclePickSystem, RadiusSelectionCircleLike} from "./circle";
import {NGonEditor} from "./ngon_editor";
import {apply_svg_border, to_svg} from "../exporters/svg";
import {hex_to_pdfrgbf, PDFContext, PDFExporter} from "../exporters/pdf";

export const NGonShapeName = "NGonShapeName"
export interface NGonShape extends CenterPosition {
    get_radius():number
    set_radius(v:number): void
    get_sides():number
    set_sides(v:number): void
}


export class NGonShapeObject implements NGonShape, MultiComp, CircleLikeShape, RenderBounds {
    name: string;
    private pos: Point;
    private radius: number;
    private sides: number;
    constructor(pos:Point, radius:number, sides:number) {
        this.name = NGonShapeName
        this.pos = pos
        this.radius = radius
        this.sides = sides
    }

    supports(): string[] {
        return [this.name, CircleLikeShapeName, CenterPositionName, RenderBoundsName]
    }

    get_position(): Point {
        return this.pos
    }
    get_radius(): number {
        return this.radius
    }
    set_radius(v:number) {
        this.radius = v
    }
    get_sides(): number {
        return this.sides
    }
    set_sides(sides: number): void {
        this.sides = sides
    }
    isMulti(): boolean {
        return true;
    }
    get_bounds(): Rect {
        return new Rect(
            this.pos.x - this.radius,
            this.pos.y - this.radius,
            this.radius*2,
            this.radius*2
        )
    }


}

export const NGonSystemName = 'NGonSystemName'
export class NGonRendererSystem implements RenderingSystem {
    name: string;

    constructor() {
        this.name = "NGonSystem"
    }

    render(surf: CanvasRenderSurface, node: TreeNode, state: GlobalState): void {
        let ctx = surf.ctx
        if(node.has_component(NGonShapeName)) {
            let shape:NGonShapeObject = node.get_component(NGonShapeName) as NGonShapeObject
            ctx.fillStyle = 'magenta'
            if(node.has_component(FilledShapeName)) {
                ctx.fillStyle = (node.get_component(FilledShapeName) as FilledShape).get_fill()
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.save()
            ctx.translate(shape.get_position().x, shape.get_position().y)
            ctx.beginPath()
            let ang = Math.PI*2/shape.get_sides()
            for(let i=0; i<shape.get_sides(); i++) {
                let theta = ang*i
                let x = Math.sin(theta)*shape.get_radius()
                let y = Math.cos(theta)*shape.get_radius()
                if(i===0) {
                    ctx.moveTo(x,y)
                } else {
                    ctx.lineTo(x,y)
                }
            }
            ctx.closePath()
            ctx.fill()
            if(node.has_component(BorderedShapeName)) {
                let bd = (node.get_component(BorderedShapeName) as BorderedShape)
                if (bd.get_border_width() > 0) {
                    ctx.strokeStyle = bd.get_border_fill()
                    ctx.lineWidth = bd.get_border_width()
                    ctx.stroke()
                }
            }
            if(state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.beginPath()
                ctx.arc(0,0,shape.get_radius(),0,Math.PI*2)
                ctx.stroke()
            }

            ctx.restore()
        }
    }

}

export class NGonSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = "NGonSVGExporter"
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(NGonShapeName)
    }

    toSVG(node: TreeNode): string {
        let shape = node.get_component(NGonShapeName) as NGonShape
        let color = node.get_component(FilledShapeName) as FilledShape
        let obj:any = {
            fill:color.get_fill()
        }
        apply_svg_border(node,obj)

        let points = []
        let offset = shape.get_position()
        let ang = Math.PI*2/shape.get_sides()
        for(let i=0; i<shape.get_sides(); i++) {
            let theta = ang*i
            let x = Math.sin(theta)*shape.get_radius()
            let y = Math.cos(theta)*shape.get_radius()
            points.push((x+offset.x).toFixed(1))
            points.push((y+offset.y).toFixed(1))
        }
        obj.points = points.join(",")
        return to_svg('polyline', obj)
    }

}

const make_ngon_action: Action = {
    use_gui: false,
    title: "add ngon",
    fun(node: TreeNode, state: GlobalState): void {
        state.add_and_select(make_std_ngon(new Point(50,50),20, 5), node)
    }
}

export function make_std_ngon(center:Point, radius:number, sides:number, color?:string):TreeNodeImpl {
    let node = new TreeNodeImpl()
    node.title = 'ngon'
    node.add_component(new NGonShapeObject(center, radius, sides))
    node.add_component(new FilledShapeObject(color?color:"#ffcccc"))
    node.add_component(new BorderedShapeObject("#000000"))
    node.add_component(new MovableCenterPosition(node))
    node.add_component(new RadiusSelectionCircleLike(node))
    return node
}


class NGonPDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = 'NGonPDFExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(NGonShapeName)
    }

    toPDF(ctx: PDFContext, node: TreeNode, state: GlobalState): void {
        let page = ctx.currentPage
        let shape:NGonShape = node.get_component(NGonShapeName) as NGonShape
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let bd:BorderedShape = node.get_component(BorderedShapeName) as BorderedShape

        let offset = shape.get_position()
        let ang = Math.PI*2/shape.get_sides()
        let prev = {x:0,y:0}
        for(let i=0; i<shape.get_sides(); i++) {
            let theta = ang*i
            let cur = {x:0,y:0}
            cur.x = offset.x+Math.sin(theta)*shape.get_radius()
            cur.y = offset.y+Math.cos(theta)*shape.get_radius()
            if(i !== 0) {
                page.drawLine({start:prev, end: cur, color:hex_to_pdfrgbf(bd.get_border_fill()), thickness:bd.get_border_width()})
            }
            prev = cur
        }
    }
}

export class NGonPowerup extends DefaultPowerup {
    init(state: GlobalState) {
        state.pickers.push(new CirclePickSystem())
        state.svgexporters.push(new NGonSVGExporter())
        state.pdfexporters.push(new NGonPDFExporter())
        state.renderers.push(new NGonRendererSystem())
    }

    override can_edit(comp:Component) {
        return comp.name === NGonShapeName
    }
    override can_edit_by_name(comp: string): boolean {
        if(comp === NGonShapeName) return true
        return false
    }
    get_editor(comp:Component, node:TreeNode, state:GlobalState):any {
        return NGonEditor
    }
    override get_editor_by_name(name: string, state: GlobalState): any {
        if(name === NGonShapeName) return NGonEditor
        return null
    }

    override child_options(node: TreeNode): Action[] {
        if(node.has_component(ParentLikeName) || node.has_component(PageName)) {
            return [make_ngon_action]
        }
        return [];
    }

}