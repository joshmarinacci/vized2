import {
    add_child_to_parent, CenterPosition, CenterPositionName,
    DefaultPowerup,
    GlobalState, MovableCenterPosition, MultiComp,
    PageName,
    ParentDrawChildren,
    ParentDrawChildrenName,
    PickingSystem,
    Point,
    Rect,
    RenderingSystem,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {Action} from "../actions";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {make_std_circle} from "./circle";
import {make_std_rect} from "./rect_powerup";
import {SnowflakeEditor} from "./snowflake_editor";

const SnowflakeName = "SnowflakeName"
export interface Snowflake extends CenterPosition {
    get_child_bounds(): Rect;
    fold_count():number
    set_fold_count(folds:number):void
}

class SnowflakeObject implements MultiComp, Snowflake {
    private position: Point;
    name: string;
    private node: TreeNodeImpl;
    private _fold_count: number;

    constructor(node: TreeNodeImpl, position: Point) {
        this.node = node
        this.position = position
        this.name = SnowflakeName
        this._fold_count = 8
    }

    supports(): string[] {
        return [SnowflakeName, CenterPositionName];
    }

    get_child_bounds(): Rect {
        let rect = new Rect(0,0,0,0).makeEmpty()
        this.node.children.forEach(ch => {
            if(ch.has_component(BoundedShapeName)) {
                let bds = ch.get_component(BoundedShapeName) as BoundedShape
                rect = rect.add(bds.get_bounds())
            }
        })
        return rect.translate(this.position)
    }

    get_position(): Point {
        return this.position
    }

    isMulti(): boolean {
        return true
    }

    fold_count(): number {
        return this._fold_count
    }

    set_fold_count(folds: number): void {
        this._fold_count = folds
    }
}


class ParentDrawChildrenMarker implements ParentDrawChildren {
    name: string;
    constructor() {
        this.name = ParentDrawChildrenName
    }

}
export function make_std_snowflake():TreeNodeImpl {
    let group = new TreeNodeImpl()
    group.title = 'snowflake'
    let shape = new SnowflakeObject(group,new Point(200, 200))
    group.add_component(shape)
    group.add_component(new ParentDrawChildrenMarker())
    group.add_component(new MovableCenterPosition(shape))
    let circle = make_std_circle(new Point(0,0),10)
    add_child_to_parent(circle, group)
    let rect1 = make_std_rect(new Rect(0,100,30,80))
    add_child_to_parent(rect1,group)
    let rect2 = make_std_rect(new Rect(100,100,30,30))
    add_child_to_parent(rect2,group)
    return group
}

export const make_snowflake_action: Action = {
    use_gui: false,
    title: "add snowflake",
    fun(node: TreeNode, state: GlobalState): void {
        add_child_to_parent(make_std_snowflake(), node)
        state.dispatch('object-changed', {})
    }
}

const SnowflakePickSystemName = 'SnowflakePickSystemName';
export class SnowflakePickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = SnowflakePickSystemName
    }
    pick_node(pt: Point, node: TreeNode): boolean {
        if(node.has_component(SnowflakeName)) {
            let group = node.get_component(SnowflakeName) as Snowflake
            let rect:Rect = group.get_child_bounds()
            if(rect.contains(pt)) return true
        }
        return false;
    }
}

const SnowflakeRendererSystemName = 'SnowflakeRendererSystemName'
export class SnowflakeRendererSystem implements RenderingSystem {
    constructor() {
        this.name = SnowflakeRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(SnowflakeName)) {
            // this.log('drawing flake bounds')
            let flake = node.get_component(SnowflakeName) as Snowflake
            let pos = flake.get_position()
            let rect = flake.get_child_bounds()
            ctx.fillStyle = 'rgba(255,0,0,0.5)'
            ctx.save()
            this.draw_children(ctx,node,state)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
            ctx.restore()
        }
    }

    name: string;

    private draw_children(ctx: CanvasRenderingContext2D, node: TreeNode, state:GlobalState) {
        let flake = node.get_component(SnowflakeName) as Snowflake
        ctx.save()
        let pos = flake.get_position()
        ctx.translate(pos.x,pos.y)
        for(let i=0; i<flake.fold_count(); i++) {
            ctx.rotate(Math.PI*2/flake.fold_count())
            node.children.forEach(ch => this.draw_node(ctx, ch, state))
        }
        ctx.restore()
    }

    private draw_node(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState) {
        // this.log("drawing child node",node)
        state.renderers.forEach((rend) => rend.render(ctx, node, state))
    }

    private log(...args: any) {
        console.log("SNOW_FLAKE: ",...args)
    }
}

export class SnowflakePowerup extends DefaultPowerup{
    init(state: GlobalState) {
        state.pickers.push(new SnowflakePickSystem())
        state.renderers.push(new SnowflakeRendererSystem())
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(SnowflakeName) || node.has_component(PageName)) {
            return [make_snowflake_action]
        }
        return [];
    }
    override can_edit_by_name(comp: string): boolean {
        if(comp === SnowflakeName) return true
        return false
    }
    override get_editor_by_name(name: string, state: GlobalState): any {
        if(name === SnowflakeName) return SnowflakeEditor
        return null
    }

}

