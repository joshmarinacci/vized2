import {
    add_child_to_parent,
    Component,
    DefaultPowerup,
    GlobalState,
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
import {make_std_circle} from "./circle_powerup";
import {make_std_rect} from "./rect_powerup";

const SnowflakeName = "SnowflakeName"
export interface Snowflake extends Component {
    get_position():Point
    get_child_bounds(): Rect;
}

class SnowflakeObject implements Snowflake {
    private position: Point;
    name: string;
    private node: TreeNodeImpl;

    constructor(node: TreeNodeImpl, position: Point) {
        this.node = node
        this.position = position
        this.name = SnowflakeName
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
    group.components.push(new SnowflakeObject(group,new Point(200, 200)))
    group.add_component(new ParentDrawChildrenMarker())
    // circle.components.push(new MovableCircleObject(circle))
    let circle = make_std_circle(new Point(0,0),10)
    add_child_to_parent(circle, group)
    let rect = make_std_rect(new Rect(100,100,30,80))
    add_child_to_parent(rect,group)
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
            console.log('drawing flake bounds')
            let flake = node.get_component(SnowflakeName) as Snowflake
            let pos = flake.get_position()
            let rect = flake.get_child_bounds()
            ctx.fillStyle = 'rgba(255,0,0,0.5)'
            ctx.save()
            this.draw_children(ctx,node,state)
            // ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
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
        for(let i=0; i<6; i++) {
            ctx.rotate(Math.PI*2/6)
            node.children.forEach(ch => this.draw_node(ctx, ch, state))
        }
        ctx.restore()

    }

    private draw_node(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState) {
        this.log("drawing child node",node)
        ctx.fillStyle = 'green'
        ctx.fillRect(10,10,20,20)
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
        // state.svgexporters.push(new CircleSVGExporter())
        // state.pdfexporters.push(new CirclePDFExporter())
        // state.jsonexporters.push(new CircleShapeJSONExporter())
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(SnowflakeName) || node.has_component(PageName)) {
            return [make_snowflake_action]
        }
        return [];
    }

}

