import {
    Component, DefaultPowerup, GlobalState,
    Handle,
    Movable,
    MovableName, MultiComp,
    PickingSystem,
    Point,
    Rect, RenderBounds, RenderBoundsName,
    Resizable,
    ResizableName,
    TreeNode
} from "./common";
import {Action} from "./actions";

export const BoundedShapeName = "BoundedShapeName";
export interface BoundedShape extends Component, RenderBounds {
    get_bounds(): Rect
}
export class BoundedShapeObject implements MultiComp, BoundedShape, RenderBounds {
    name: string;
    private readonly rect: Rect;

    constructor(rect: Rect) {
        this.name = BoundedShapeName
        this.rect = rect
    }

    get_bounds(): Rect {
        return this.rect
    }

    isMulti(): boolean {
        return true;
    }

    supports(): string[] {
        return [BoundedShapeName, RenderBoundsName];
    }

}

export class MovableBoundedShape implements Movable {
    name: string;
    private node: TreeNode;

    constructor(node: TreeNode) {
        this.node = node
        this.name = MovableName
    }

    moveBy(pt: Point): void {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        bd.get_bounds().x += pt.x
        bd.get_bounds().y += pt.y
    }

    moveTo(pt: Point): void {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        bd.get_bounds().x = pt.x
        bd.get_bounds().y = pt.y
    }
    position(): Point {
        return (this.node.get_component(BoundedShapeName) as BoundedShape).get_bounds().position
    }
}

export class BoundedShapeHandle extends Handle {
    private node: TreeNode;

    constructor(node: TreeNode) {
        super(0, 0);
        this.node = node
    }

    update_from_node() {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        this.x = bd.get_bounds().x + bd.get_bounds().w - 5
        this.y = bd.get_bounds().y + bd.get_bounds().h - 5
    }

    override moveBy(diff: Point) {
        this.x += diff.x
        this.y += diff.y
        this.update_to_node()
    }

    private update_to_node() {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        let bdd = bd.get_bounds()
        bdd.w = this.x - bdd.x + this.w / 2
        bdd.h = this.y - bdd.y + this.h / 2
    }

    display_value(): string {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        let bdd = bd.get_bounds()
        return `${bdd.w} x ${bdd.h}`;
    }
}

export class ResizableRectObject implements Resizable {
    private handle: BoundedShapeHandle;
    name: string;
    private node: TreeNode;

    constructor(node: TreeNode) {
        this.node = node
        this.name = ResizableName
        this.handle = new BoundedShapeHandle(this.node)
    }

    get_handle(): Handle {
        this.handle.update_from_node()
        return this.handle
    }
}


const BoundedShapePickSystemName = 'BoundedShapePickSystem';
export class BoundedShapePickSystem implements PickingSystem {
    name: string;

    constructor() {
        this.name = BoundedShapePickSystemName
    }

    pick_node(pt: Point, node: TreeNode): boolean {
        if (node.has_component(BoundedShapeName)) {
            let rect = (node.get_component(BoundedShapeName) as BoundedShape).get_bounds()
            if (rect.contains(pt)) return true
        }
        return false;
    }
}


export class BoundedShapePowerup extends DefaultPowerup {
    init(state: GlobalState) {
        state.pickers.push(new BoundedShapePickSystem())
        this.simple_comps.push(MovableBoundedShape)
        this.simple_comps.push(ResizableRectObject)
    }

    child_options(node: TreeNode): Action[] {
        return [];
    }
    override can_serialize(comp: Component, node: TreeNode, state: GlobalState): boolean {
        if(comp instanceof BoundedShapeObject) return true
        return super.can_serialize(comp,node,state)
    }
    serialize(comp: Component, node: TreeNode, state: GlobalState): any {
        if(comp instanceof BoundedShapeObject) {
            let bso = comp as BoundedShapeObject
            return {
                powerup:this.constructor.name,
                klass:comp.constructor.name,
                bounds:bso.get_bounds().toJSON(),
            }
        }
        return super.serialize(comp,node,state)
    }
    override deserialize(obj: any, node:TreeNode, state: GlobalState): Component {
        if(obj.powerup === this.constructor.name && obj.klass === BoundedShapeObject.name) {
            return new BoundedShapeObject(Rect.fromJSON(obj.bounds))
        }
        if(obj.klass === MovableBoundedShape.name) {
            // @ts-ignore
            return new MovableBoundedShape(node)
        }
        if(obj.klass === ResizableRectObject.name) {
            // @ts-ignore
            return new ResizableRectObject(node)
        }
        return super.deserialize(obj,node,state)
    }
}

