import {
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
    Handle,
    MovableCenterPosition,
    MovableName,
    MultiComp,
    PageName,
    ParentLikeName,
    PickingSystem,
    Point,
    RadiusSelection,
    RadiusSelectionName,
    Rect,
    RenderBounds,
    RenderBoundsName,
    RenderingSystem,
    SVGExporter,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {JSONExporter} from "../exporters/json";
import {hex_to_pdfrgbf, PDFContext, PDFExporter} from "../exporters/pdf";
import {Action} from "../actions";
import {CircleLikeEditor} from "./circle_shape_editor";
import {apply_svg_border, to_svg} from "../exporters/svg";
import {CanvasSurf} from "../canvas";
import {
    transform_point_from_unit_to_points,
    transform_scalar_from_unit_to_points,
    unit_to_points
} from "../units";

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
    constructor(node:TreeNode) {
        this.name = RadiusSelectionName
        this.circle = node.get_component(CircleLikeShapeName) as CircleLikeShape
        this.handle = new RadiusHandle(this.circle)
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

    render(surf: CanvasRenderSurface, node: TreeNode, state:GlobalState): void {
        if(node.has_component(CircleShapeName)) {
            let shape:CircleShape = node.get_component(CircleShapeName) as CircleShape
            let fill = 'magenta'
            if(node.has_component(FilledShapeName)) {
                fill = (node.get_component(FilledShapeName) as FilledShape).get_fill()
            }
            let cs = (surf as CanvasSurf)
            cs.with_scaled(ctx => {
                let pos = shape.get_position()
                let rad = shape.get_radius()
                ctx.fillStyle = fill
                ctx.beginPath()
                ctx.arc(pos.x, pos.y,rad,0,Math.PI*2)
                ctx.closePath()
                ctx.fill()
                if(node.has_component(BorderedShapeName)) {
                    let bd = (node.get_component(BorderedShapeName) as BorderedShape)
                    if(bd.get_border_width() > 0) {
                        ctx.strokeStyle = bd.get_border_fill()
                        ctx.lineWidth = bd.get_border_width()/cs.ppu;
                        ctx.stroke()
                    }
                }

                if(surf.selectionEnabled && state.selection.has(node)) {
                    ctx.strokeStyle = 'magenta'
                    ctx.lineWidth = 3.5/cs.ppu
                    ctx.stroke()
                }
            })

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
        if(node.has_component(CircleLikeShapeName)) {
            let circle = (node.get_component(CircleLikeShapeName) as CircleLikeShape)
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
        apply_svg_border(node,obj)
        return to_svg('circle', obj)
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

    toPDF(ctx:PDFContext, node: TreeNode, state:GlobalState): void {
        let page = ctx.currentPage
        let circle: CircleShape = node.get_component(CircleShapeName) as CircleShape
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let pos = transform_point_from_unit_to_points(circle.get_position(),ctx.unit)
        let size = transform_scalar_from_unit_to_points(circle.get_radius(),ctx.unit)
        page.drawCircle({
            x:pos.x,
            y:pos.y,
            size:size,
            color:hex_to_pdfrgbf(color.get_fill())})
    }
}

export class RadiusHandle extends Handle {
    private circle: CircleLikeShape

    constructor(circle:CircleLikeShape) {
        super(circle.get_position().x+circle.get_radius(), circle.get_position().y);
        this.circle = circle
    }

    update_from_node() {
        this.x = this.circle.get_position().x + this.circle.get_radius()
        this.y = this.circle.get_position().y
    }

    override moveBy(diff: Point) {
        this.x += diff.x
        // this.y += diff.y
        this.update_to_node()
    }

    private update_to_node() {
        let rad = this.x - this.circle.get_position().x
        // if (rad < 1) rad = 1
        this.circle.set_radius(rad)
    }

    display_value(): string {
        return `${this.circle.get_radius().toFixed(2)}`;
    }
}


export function make_std_circle(center:Point, radius:number, color?:string):TreeNodeImpl {
    let circle = new TreeNodeImpl()
    circle.title = 'circle'
    circle.add_component(new CircleShapeObject(center, radius))
    circle.add_component(new MovableCenterPosition(circle))
    circle.add_component(new RadiusSelectionCircleLike(circle))
    circle.add_component(new FilledShapeObject(color?color:"#ffcccc"))
    circle.add_component(new BorderedShapeObject("#000000"))
    return circle
}

const make_circle: Action = {
    use_gui: false,
    title: "add circle",
    fun(node: TreeNode, state: GlobalState): void {
        state.add_and_select(make_std_circle(new Point(100,100),20),node)
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

    override can_edit_by_name(comp: string): boolean {
        if(comp === CircleLikeShapeName) return true
        return false
    }
    override get_editor_by_name(name: string, state: GlobalState): any {
        if(name === CircleLikeShapeName) return CircleLikeEditor
        return null
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(ParentLikeName) || node.has_component(PageName)) {
            return [make_circle]
        }
        return [];
    }


    override can_serialize(comp: Component, node: TreeNode, state: GlobalState): boolean {
        if(comp instanceof CircleShapeObject) return true
        if(comp instanceof RadiusSelectionCircleLike) return true
        return super.can_serialize(comp,node,state)
    }

    override serialize(comp: Component, node: TreeNode, state: GlobalState): any {
        if(comp instanceof CircleShapeObject) {
            let fso = comp as CircleShapeObject
            return {
                powerup: this.constructor.name,
                klass: comp.constructor.name,
                position: fso.get_position(),
                radius: fso.get_radius(),
            }
        }
        if(comp instanceof RadiusSelectionCircleLike) {
            return {
                powerup: this.constructor.name,
                klass: comp.constructor.name,
            }
        }
        return super.serialize(comp,node,state)
    }

    override deserialize(obj: any, node:TreeNode, state: GlobalState): Component {
        if(obj.klass === CircleShapeObject.name) {
            return new CircleShapeObject(new Point(obj.position.x,obj.position.y),obj.radius)
        }
        if(obj.klass === RadiusSelectionCircleLike.name) {
            // @ts-ignore
            return new RadiusSelectionCircleLike(node)
        }
        console.log(obj)
        throw new Error("CirclePowerup couldn't deserialize " + JSON.stringify(obj))
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
