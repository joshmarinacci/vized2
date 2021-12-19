import {
    add_child_to_parent,
    Component,
    DefaultPowerup,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    GlobalState,
    MovableCenterPosition,
    MovableName,
    MultiComp,
    PageName,
    PDFExporter,
    PickingSystem,
    Point,
    RenderingSystem,
    SVGExporter,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {JSONExporter} from "../exporters/json";
import {cssToPdfColor} from "../exporters/pdf";
import {Action} from "../actions";
import {GroupShapeName} from "./group";
import {SpiralEditor} from "./spiral_editor";
import {
    CircleLikeShape, CircleLikeShapeName,
    RadiusSelectionCircleLike
} from "./circle";

export const SpiralShapeName = "SpiralShape"
export class SpiralShapeObject implements Component, MultiComp, CircleLikeShape {
    private radius: number;
    private pos: Point;
    private wrap: number;
    constructor(pos:Point, radius: number) {
        this.pos = pos
        this.radius = radius
        this.name = SpiralShapeName
        this.wrap = 5
    }
    supports(): string[] {
        return [this.name, CircleLikeShapeName];
    }
    name: string;
    get_radius() {
        return this.radius
    }
    set_radius(radius:number):void {
        this.radius = radius
    }
    get_position(): Point {
        return this.pos
    }
    get_wrap() {
        return this.wrap
    }
    set_wrap(wrap:number) {
        this.wrap = wrap
    }

    isMulti(): boolean {
        return true
    }
}

class SpiralRendererSystem implements RenderingSystem {
    name: string;
    constructor() {
        this.name = "SpiralRendererSystem"
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if(node.has_component(SpiralShapeName)) {
            let spiral:SpiralShapeObject = node.get_component(SpiralShapeName) as SpiralShapeObject
            let times = spiral.get_wrap()*Math.PI*2
            let radius = spiral.get_radius() / times

            ctx.save()
            ctx.translate(spiral.get_position().x,spiral.get_position().y)
            if (node.has_component(FilledShapeName)) {
                let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
                ctx.strokeStyle = color.get_fill()
                ctx.lineWidth = 1
            }
            for(let th=0; th<times; th+=0.1) {
                let x = Math.sin(th)*radius*th
                let y = Math.cos(th)*radius*th
                if(th === 0) {
                    ctx.moveTo(x,y)
                } else {
                    ctx.lineTo(x,y)
                }
            }
            ctx.stroke()

            if(state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.beginPath()
                ctx.arc(0,0,spiral.get_radius(),0,Math.PI*2)
                ctx.stroke()
            }

            ctx.restore()
        }
    }

}
const SpiralPickSystemName = 'SpiralPickSystemName';
export class SpiralPickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = SpiralPickSystemName
    }

    pick_node(pt: Point, node: TreeNode): boolean {
        if(node.has_component(SpiralShapeName)) {
            let circle = node.get_component(SpiralShapeName) as SpiralShapeObject
            let dist = circle.get_position().subtract(pt)
            if (dist.magnitude() < circle.get_radius()) {
                return true
            }
        }
        return false
    }
}


class SpiralJSONExporter implements JSONExporter {
    name: string;
    private powerup: string;
    constructor() {
        this.powerup = 'spiral'
        this.name = 'SpiralJSONExporter'
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        if(obj.name === SpiralShapeName) return true
        if(obj.name === MovableName) return true
        return false
    }

    canHandleToJSON(comp: any, node: TreeNode): boolean {
        if(comp.name === SpiralShapeName) return true
        if(comp.name === MovableName && node.has_component(SpiralShapeName)) return true
        return false;
    }

    fromJSON(obj: any, node: TreeNode): Component {
        // if(obj.name === MovableName) return new MovableSpiralObject(node)
        if(obj.name === SpiralShapeName) return new SpiralShapeObject((new Point(0,0)).from_object(obj.position),obj.radius)
        throw new Error(`cannot export json for ${obj.name}`)
    }

    toJSON(component: Component, node: TreeNode): any {
        if(component.name === MovableName) return {name:component.name, empty:true, powerup:this.powerup}
        if(component.name === SpiralShapeName) {
            let shape = component as SpiralShapeObject
            return {
                name: shape.name,
                position: shape.get_position(),
                radius: shape.get_radius(),
            }
        }
    }
}

export class SpiralPDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = 'SpiralPDFExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(SpiralShapeName)
    }

    toPDF(node: TreeNode, state:GlobalState, doc:any, scale:number ): void {
        let spiral:SpiralShapeObject = node.get_component(SpiralShapeName) as SpiralShapeObject
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let pdf_color = cssToPdfColor(color.get_fill())
        doc.setFillColor(...pdf_color)
        let times = 5*Math.PI*2
        let radius = spiral.get_radius() / times
        let ox = spiral.get_position().x
        let oy = spiral.get_position().y
        const path = [];
        for(let th=0; th<times; th+=0.1) {
            let x = (Math.sin(th)*radius*th + ox) * scale
            let y = (Math.cos(th)*radius*th + oy) * scale
            if(th === 0) {
                path.push({op:'m',c:[x,y]})
            } else {
                path.push({op:'l',c:[x,y]})
            }
        }
        path.push({op: "h", c: []})
        doc.setLineWidth(1*scale)
        doc.path(path);
        doc.stroke()
    }
}


class SpiralSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = 'SpiralSVGExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(SpiralShapeName)
    }

    toSVG(node: TreeNode): string {
        let spiral:SpiralShapeObject = node.get_component(SpiralShapeName) as SpiralShapeObject
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let times = 5*Math.PI*2
        let radius = spiral.get_radius() / times
        let ox = spiral.get_position().x
        let oy = spiral.get_position().y
        let points = []
        for(let th=0; th<times; th+=0.1) {
            let x2 = Math.sin(th)*radius*th
            let y2 = Math.cos(th)*radius*th
            points.push((x2+ox).toFixed(1))
            points.push((y2+oy).toFixed(1))
        }
        return `<polyline fill="none" points="${points.join(",")}" stroke-width="1" stroke="${color.get_fill()}"/>`
    }
}
export function make_std_spiral(center:Point, radius:number) {
    let node = new TreeNodeImpl()
    node.title = 'spiral'
    node.add_component(new FilledShapeObject('#000000'))
    let shape = new SpiralShapeObject(center,radius)
    node.add_component(shape)
    node.add_component(new MovableCenterPosition(shape))
    node.add_component(new RadiusSelectionCircleLike(shape))
    return node
}
const make_spiral: Action = {
    use_gui: false,
    title: "add spiral",
    fun(node: TreeNode, state: GlobalState): void {
        let circle = make_std_spiral(new Point(100,200),15)
        add_child_to_parent(circle, node)
        state.dispatch('object-changed', {})
    }
}


export class SpiralPowerup extends DefaultPowerup{
    init(state: GlobalState) {
        // state.props_renderers.push(new SpiralPropRendererSystem(state))
        state.pickers.push(new SpiralPickSystem())
        state.renderers.push(new SpiralRendererSystem())
        state.svgexporters.push(new SpiralSVGExporter())
        state.pdfexporters.push(new SpiralPDFExporter())
        state.jsonexporters.push(new SpiralJSONExporter())
    }

    can_edit(comp:Component) {
        return comp.name === SpiralShapeName
    }

    get_editor(comp:Component, node:TreeNode, state:GlobalState):any {
        return SpiralEditor
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(GroupShapeName) || node.has_component(PageName)) return [make_spiral]
        return [];
    }
}
