import {
    add_child_to_parent,
    CanvasRenderSurface,
    CenterPosition, CenterPositionName, Component,
    DefaultPowerup, FilledShape, FilledShapeName,
    FilledShapeObject, GlobalState,
    MovableCenterPosition, MultiComp,
    PageName,
    ParentLikeName,
    Point, Rect, RenderBounds, RenderBoundsName, RenderingSystem, TreeNode,
    TreeNodeImpl
} from "../common";
import {Action} from "../actions";
import {CircleLikeShape, CircleLikeShapeName, CirclePickSystem, RadiusSelectionCircleLike} from "./circle";
import {SpiralShapeName} from "./spiral";
import {SpiralEditor} from "./spiral_editor";
import {NGonEditor} from "./ngon_editor";

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
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x,y)
                }
            }
            ctx.closePath()
            ctx.fill()
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

export const make_ngon_action: Action = {
    use_gui: false,
    title: "add ngon",
    fun(node: TreeNode, state: GlobalState): void {
        add_child_to_parent(make_std_ngon(new Point(50,50),20, 5), node)
        state.dispatch('object-changed', {})
    }
}

export function make_std_ngon(center:Point, radius:number, sides:number, color?:string):TreeNodeImpl {
    let node = new TreeNodeImpl()
    node.title = 'ngon'
    node.add_component(new NGonShapeObject(center, radius, sides))
    node.add_component(new FilledShapeObject(color?color:"#ffcccc"))
    node.add_component(new MovableCenterPosition(node))
    node.add_component(new RadiusSelectionCircleLike(node))
    return node
}


export class NGonPowerup extends DefaultPowerup {
    init(state: GlobalState) {
        state.pickers.push(new CirclePickSystem())
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