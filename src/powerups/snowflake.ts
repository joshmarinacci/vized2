import {
    add_child_to_parent, CanvasRenderSurface, CenterPositionName, Component,
    DefaultPowerup,
    GlobalState, MovableCenterPosition, MultiComp,
    PageName,
    ParentDrawChildren,
    ParentDrawChildrenName, ParentLike, ParentLikeName,
    PickingSystem,
    Point,
    Rect, RenderBounds, RenderBoundsName,
    RenderingSystem,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {Action} from "../actions";
import {make_std_circle} from "./circle";
import {make_std_rect} from "./rect_powerup";
import {SnowflakeEditor} from "./snowflake_editor";
import {PDFContext, PDFExporter, treenode_to_PDF} from "../exporters/pdf";
import {GroupShape, GroupShapeName, GroupShapeObject} from "./group";
import {popGraphicsState, pushGraphicsState, rotateRadians, translate} from "pdf-lib";

const SnowflakeName = "SnowflakeName"
export type SnowflakeMode = "normal"|"clipped"|"mirror"|"mirror-clipped"
export interface Snowflake extends ParentLike {
    fold_count():number
    set_fold_count(folds:number):void
    get_mode():SnowflakeMode
    set_mode(mode:SnowflakeMode):void
}

class SnowflakeObject implements MultiComp, Snowflake, RenderBounds {
    private position: Point;
    name: string;
    private mode:SnowflakeMode
    private node: TreeNodeImpl;
    private _fold_count: number;

    constructor(node: TreeNodeImpl, position: Point) {
        this.node = node
        this.position = position
        this.name = SnowflakeName
        this._fold_count = 8
        this.mode = "normal"
    }

    supports(): string[] {
        return [SnowflakeName, CenterPositionName, ParentLikeName, RenderBoundsName];
    }

    get_child_bounds(): Rect {
        let rect = new Rect(0,0,0,0).makeEmpty()
        this.node.children.forEach(ch => {
            if(ch.has_component(RenderBoundsName)) {
                let bds = ch.get_component(RenderBoundsName) as RenderBounds
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

    get_bounds(): Rect {
        return this.get_child_bounds()
    }

    get_mode(): SnowflakeMode {
        return this.mode
    }

    set_mode(mode: SnowflakeMode): void {
        this.mode = mode
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
    group.add_component(new MovableCenterPosition(group))
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
        state.add_and_select(make_std_snowflake(), node)
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

    render(surf:CanvasRenderSurface, node: TreeNode, state: GlobalState): void {
        if (node.has_component(SnowflakeName)) {
            let ctx = surf.ctx
            // this.log('drawing flake bounds')
            let flake = node.get_component(SnowflakeName) as Snowflake
            let rect = flake.get_child_bounds()
            ctx.fillStyle = 'rgba(255,0,0,0.5)'
            ctx.save()
            this.draw_children(surf,node,state)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
            ctx.restore()
        }
    }

    name: string;

    private draw_children(surf: CanvasRenderSurface, node: TreeNode, state: GlobalState) {
        let flake = node.get_component(SnowflakeName) as Snowflake
        surf.ctx.save()
        let pos = flake.get_position()
        surf.ctx.translate(pos.x,pos.y)
        let count = flake.fold_count()
        for(let i=0; i<count; i++) {
            surf.selectionEnabled = (i===0)
            let theta = Math.PI*2/count
            const draw_clipped = (surf:CanvasRenderSurface,node:TreeNode,theta:number, clip:boolean) => {
                let len = 500
                surf.ctx.strokeStyle = 'black'
                surf.ctx.beginPath()
                surf.ctx.moveTo(0, 0)
                surf.ctx.lineTo(Math.sin(theta) * len, Math.cos(theta) * len)
                surf.ctx.lineTo(0, len)
                if(surf.inset && surf.selectionEnabled)surf.ctx.fill()
                if(clip && (!surf.inset || !surf.selectionEnabled)) surf.ctx.clip()
                node.children.forEach(ch => this.draw_node(surf, ch, state))
            }

            if(flake.get_mode() === "normal") {
                surf.ctx.save()
                surf.ctx.rotate(i * theta)
                draw_clipped(surf,node,theta,false)
                surf.ctx.restore()
            }
            if(flake.get_mode() === "clipped") {
                surf.ctx.save()
                surf.ctx.rotate(i * theta)
                draw_clipped(surf,node,theta,true)
                surf.ctx.restore()
            }
            if(flake.get_mode() === 'mirror') {
                surf.ctx.save()
                surf.ctx.rotate(i * theta)
                draw_clipped(surf,node,theta/2,false)
                surf.ctx.restore()
                surf.ctx.save()
                surf.ctx.rotate(i * theta)
                surf.ctx.scale(-1,1)
                draw_clipped(surf,node,theta/2,false)
                surf.ctx.restore()
            }
            if(flake.get_mode() === 'mirror-clipped') {
                surf.ctx.save()
                surf.ctx.rotate(i * theta)
                draw_clipped(surf,node,theta/2,true)
                surf.ctx.restore()
                surf.ctx.save()
                surf.ctx.rotate(i * theta)
                surf.ctx.scale(-1,1)
                draw_clipped(surf,node,theta/2,true)
                surf.ctx.restore()
            }

        }
        surf.selectionEnabled = true
        surf.ctx.restore()
    }

    private draw_node(surf:CanvasRenderSurface, node: TreeNode, state: GlobalState) {
        // this.log("drawing child node",node)
        state.renderers.forEach((rend) => rend.render(surf, node, state))
    }

    private log(...args: any) {
        console.log("SNOW_FLAKE: ",...args)
    }
}

class SnowflakePDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = 'SnowflakePDFExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(SnowflakeName)
    }

    toPDF(ctx: PDFContext, node: TreeNode, state: GlobalState): void {
        let flake = node.get_component(SnowflakeName) as Snowflake
        let pos = flake.get_position()
        ctx.currentPage.pushOperators(pushGraphicsState(),translate(pos.x,pos.y))
        for(let i=0; i<flake.fold_count(); i++) {
            ctx.currentPage.pushOperators(rotateRadians(Math.PI*2/flake.fold_count()))
            node.children.forEach(ch => treenode_to_PDF(ctx, ch, state))
        }
        ctx.currentPage.pushOperators(popGraphicsState())
    }

}
export class SnowflakePowerup extends DefaultPowerup{
    init(state: GlobalState) {
        state.pickers.push(new SnowflakePickSystem())
        state.renderers.push(new SnowflakeRendererSystem())
        state.pdfexporters.push(new SnowflakePDFExporter())
        this.simple_comps.push(ParentDrawChildrenMarker)
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(ParentLikeName) || node.has_component(PageName)) {
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
    override can_serialize(comp: Component, node: TreeNode, state: GlobalState): boolean {
        if(comp instanceof SnowflakeObject) return true
        return super.can_serialize(comp, node, state);
    }
    override serialize(comp: Component, node: TreeNode, state: GlobalState): any {
        if(comp instanceof SnowflakeObject) {
            let sfo = comp as SnowflakeObject
            return {
                powerup:this.constructor.name,
                klass:comp.constructor.name,
                position:sfo.get_position(),
                mode:sfo.get_mode(),
            }
        }
        return super.serialize(comp, node, state);
    }

    override can_deserialize(obj: any, state: GlobalState): boolean {
        if(obj.klass === SnowflakeObject.name) return true
        if(obj.klass === ParentDrawChildrenMarker.name) return true
        return super.can_deserialize(obj, state);
    }

    override deserialize(obj: any, node:TreeNode, state: GlobalState): Component {
        if(obj.klass === SnowflakeObject.name) {
            // @ts-ignore
            return new SnowflakeObject(node, Point.fromJSON(obj.position))
        }
        if(obj.klass === ParentDrawChildrenMarker.name) return new ParentDrawChildrenMarker()
        return super.deserialize(obj, node, state);
    }

}

