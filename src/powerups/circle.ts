import {
    add_child_to_parent,
    CenterPosition,
    CenterPositionName,
    Component,
    DefaultPowerup,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    GlobalState,
    Handle,
    MovableCenterPosition,
    MovableName,
    MultiComp,
    PageName, ParentLikeName,
    PickingSystem,
    Point,
    RadiusSelection,
    RadiusSelectionName, Rect, RenderBounds, RenderBoundsName,
    RenderingSystem,
    SVGExporter,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {JSONExporter} from "../exporters/json";
import {cssToPdfColor, PDFExporter} from "../exporters/pdf";
import {Action} from "../actions";

export const CircleLikeShapeName = "CircleLikeShape"
export interface CircleLikeShape extends CenterPosition {
    get_radius():number
    set_radius(v:number): void;
}

export const CircleShapeName = "CircleShapeName"
export interface CircleShape extends CircleLikeShape { }


export class RadiusSelectionCircleLike implements RadiusSelection {
    name: string;
    private circle: CircleLikeShape;
    private handle: RadiusHandle;
    constructor(circle:CircleLikeShape) {
        this.name = RadiusSelectionName
        this.circle = circle
        this.handle = new RadiusHandle(circle)
    }

    get_handle(): Handle {
        return this.handle
    }

}

export class CircleShapeObject implements MultiComp, CircleLikeShape, CircleShape, CenterPosition, RenderBounds {
    name: string;
    private pos: Point;
    private radius: number;
    constructor(pos:Point, radius:number) {
        this.name = CircleShapeName
        this.pos = pos
        this.radius = radius
    }

    isMulti(): boolean {
        return true
    }
    supports(): string[] {
        return [CircleLikeShapeName, CircleShapeName, CenterPositionName, RenderBoundsName]
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

    get_bounds(): Rect {
        return new Rect(
            this.pos.x - this.radius,
            this.pos.y - this.radius,
            this.radius*2,
            this.radius*2
        )
    }
}

export const CircleRendererSystemName = 'CircleRendererSystemName'
export class CircleRendererSystem implements RenderingSystem {
    name: string

    constructor() {
        this.name = CircleRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state:GlobalState): void {
        if(node.has_component(CircleShapeName)) {
            let shape:CircleShape = node.get_component(CircleShapeName) as CircleShape
            if(node.has_component(FilledShapeName)) {
                ctx.fillStyle = (node.get_component(FilledShapeName) as FilledShape).get_fill()
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.beginPath()
            ctx.arc(shape.get_position().x, shape.get_position().y,shape.get_radius(),0,Math.PI*2)
            ctx.fill()
            if(state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.stroke()
            }

        }
    }

}


const CirclePickSystemName = 'CirclePickSystemName';
export class CirclePickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = CirclePickSystemName
    }
    pick_node(pt: Point, node: TreeNode): boolean {
        if(node.has_component(CircleShapeName)) {
            let circle = (node.get_component(CircleShapeName) as CircleShape)
            let dist = circle.get_position().subtract(pt)
            if(dist.magnitude() < circle.get_radius()) {
                return true
            }
        }
        return false
    }
}




export class CircleSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = "CircleSVGExporter"
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(CircleShapeName)
    }

    toSVG(node: TreeNode): string {
        let circle = node.get_component(CircleShapeName) as CircleShape
        let color = node.get_component(FilledShapeName) as FilledShape
        let obj:any = {
            cx:circle.get_position().x,
            cy:circle.get_position().y,
            r:circle.get_radius(),
            fill:color.get_fill()
        }
        let pairs = Object.keys(obj).map(k => `${k}='${obj[k]}'`)
        return '<circle ' + pairs.join(" ") + "/>"
    }

}

export class CirclePDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = "CirclePDFExporter"
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(CircleShapeName)
    }

    toPDF(node: TreeNode, state:GlobalState, doc:any, scale:number, translate:Point): void {
        let circle: CircleShape = node.get_component(CircleShapeName) as CircleShape
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape

        let obj = {
            cx:circle.get_position().x * scale,
            cy:circle.get_position().y * scale,
            r:circle.get_radius() * scale,
            fill:color.get_fill()
        }
        let pdf_color = cssToPdfColor(obj.fill)
        doc.setFillColor(...pdf_color)
        doc.circle(obj.cx,obj.cy, obj.r, "F");
    }
}

export class RadiusHandle extends Handle {
    private circle: CircleLikeShape

    constructor(circle:CircleLikeShape) {
        super(0, 0);
        this.circle = circle
    }

    update_from_node() {
        this.x = this.circle.get_position().x + this.circle.get_radius() - 5
        this.y = this.circle.get_position().y - 5
    }

    override moveBy(diff: Point) {
        this.x += diff.x
        // this.y += diff.y
        this.update_to_node()
    }

    private update_to_node() {
        let rad = this.x + 5 - this.circle.get_position().x
        if (rad < 1) rad = 1
        this.circle.set_radius(rad)
    }
}


export function make_std_circle(center:Point, radius:number):TreeNodeImpl {
    let circle = new TreeNodeImpl()
    circle.title = 'circle'
    let shape = new CircleShapeObject(center, radius)
    circle.add_component(shape)
    circle.add_component(new MovableCenterPosition(shape))
    circle.add_component(new RadiusSelectionCircleLike(shape))
    circle.add_component(new FilledShapeObject("#ffcccc"))
    return circle
}

export const make_circle: Action = {
    use_gui: false,
    title: "add circle",
    fun(node: TreeNode, state: GlobalState): void {
        add_child_to_parent(make_std_circle(new Point(100,100),20), node)
        state.dispatch('object-changed', {})
    }
}

export class CirclePowerup extends DefaultPowerup{
    init(state: GlobalState) {
        state.pickers.push(new CirclePickSystem())
        state.renderers.push(new CircleRendererSystem())
        state.svgexporters.push(new CircleSVGExporter())
        state.pdfexporters.push(new CirclePDFExporter())
        state.jsonexporters.push(new CircleShapeJSONExporter())
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(ParentLikeName) || node.has_component(PageName)) {
            return [make_circle]
        }
        return [];
    }

}

export class CircleShapeJSONExporter implements JSONExporter {
    name: string;
    constructor() {
        this.name = "CircleShapeJSONExporter"
    }

    toJSON(component: Component, node:TreeNode): any {
        if(component.name === MovableName) return {name:component.name, empty:true, powerup:'circle'}
        let circle = component as CircleShape
        return {
            name:circle.name,
            position:circle.get_position(),
            radius:circle.get_radius(),
        }
    }

    fromJSON(obj: any, node:TreeNode): Component {
        // if(obj.name === MovableName) return new MovableCircleObject(node)
        if(obj.name === CircleShapeName) return new CircleShapeObject((new Point(0,0)).from_object(obj.position),obj.radius)
        throw new Error(`cannot export json for ${obj.name}`)
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        if(obj.name === MovableName && obj.powerup === 'circle') return true
        return obj.name === CircleShapeName
    }

    canHandleToJSON(comp: any, node: TreeNode): boolean {
        if(comp.name === MovableName && node.has_component(CircleShapeName)) return true
        return comp.name === CircleShapeName
    }

}
