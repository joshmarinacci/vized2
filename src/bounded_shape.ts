import {
    Component, GlobalState,
    Handle,
    Movable,
    MovableName,
    PickingSystem,
    Point, Powerup,
    PropRenderingSystem,
    Rect,
    Resizable,
    ResizableName,
    TreeNode
} from "./common";
// import {GlobalState} from "./state.js";

export const BoundedShapeName = "BoundedShapeName";
export interface BoundedShape extends Component {
    get_bounds(): Rect
}
export class BoundedShapeObject implements BoundedShape {
    name: string;
    private readonly rect: Rect;

    constructor(rect: Rect) {
        this.name = BoundedShapeName
        this.rect = rect
    }

    get_bounds(): Rect {
        return this.rect
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

export class BoundedShapePropRenderingSystem implements PropRenderingSystem {
    name: string;
    private state: GlobalState;

    constructor(state: GlobalState) {
        this.state = state
        this.name = "BoundedShapePropRenderingSystem"
    }

    // render_view(comp: Component): HTMLElement {
        // let bounds = (comp as BoundedShape).get_bounds()
        // let x = LABEL("x")
        // let xbox = NUMBER_INPUT(bounds.x, (v) => {
        //     bounds.x = v
        //     this.state.dispatch("prop-change", {})
        // })
        // let y = LABEL("y")
        // let ybox = NUMBER_INPUT(bounds.y, (v) => {
        //     bounds.y = v
        //     this.state.dispatch("prop-change", {})
        // })
        // let w = LABEL("w")
        // let wbox = NUMBER_INPUT(bounds.w, (v) => {
        //     bounds.w = v
        //     this.state.dispatch("prop-change", {})
        // })
        // let h = LABEL("h")
        // let hbox = NUMBER_INPUT(bounds.h, (v) => {
        //     bounds.h = v
        //     this.state.dispatch("prop-change", {})
        // })
        // return DIV(["prop-group"], [x, xbox, y, ybox, w, wbox, h, hbox])
    // }

    supports(name: string): any {
        return (name === BoundedShapeName)
    }
}

const BoundedShapePickSystemName = 'BoundedShapePickSystem';
export class BoundedShapePickSystem implements PickingSystem {
    name: string;

    constructor() {
        this.name = BoundedShapePickSystemName
    }

    pick(pt: Point, state: GlobalState): TreeNode[] {
        let picked:TreeNode[] = []
        this._test_node(pt, state.get_root(), picked)
        return picked
    }

    private _test_node(pt: Point, node: TreeNode, collect: TreeNode[]) {
        if (node.has_component(BoundedShapeName)) {
            let rect = (<BoundedShape>node.get_component(BoundedShapeName)).get_bounds()
            if (rect.contains(pt)) collect.push(node)
        }
        node.children.forEach((ch: TreeNode) => {
            this._test_node(pt, ch, collect)
        })
    }
}


export class BoundedShapePowerup implements Powerup {
    init(state: GlobalState) {
        // state.props_renderers.push(new BoundedShapePropRenderingSystem(state))
        state.pickers.push(new BoundedShapePickSystem())
    }
}

