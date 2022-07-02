import {MouseGestureDelegate} from "./mouse_gesture";
import {
    GlobalState,
    Movable,
    MovableName,
    Point,
    RadiusSelection,
    RadiusSelectionName,
    Resizable,
    ResizableName,
    TreeNode
} from "../common";
import {find_page_for_node} from "../util";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {BOUNDS_SNAP_THRESHOLD, GRID_SNAP_SIZE} from "../canvas";

export class MouseMoveDelegate implements MouseGestureDelegate {
    press_point: Point | null
    private state: GlobalState;
    private movables: TreeNode[];
    private start_offsets: Point[]
    private start_point: Point | null;
    private snap: boolean;
    private snap_grid: boolean;
    private snap_grid_size: number;
    private ppu: number;

    constructor(state: GlobalState, snap: boolean, snap_grid: boolean, ppu: number) {
        this.state = state
        this.press_point = null
        this.movables = []
        this.start_offsets = []
        this.start_point = null
        this.snap = snap
        this.snap_grid = snap_grid
        this.snap_grid_size = GRID_SNAP_SIZE / ppu
        this.ppu = ppu
    }

    press(e: MouseEvent, pt: Point, root: TreeNode) {
        this.press_point = pt
        this.start_point = pt
        let picked: TreeNode | null = null
        root.children.forEach((ch: TreeNode) => {
            this.state.pickers.forEach(pk => {
                if (pk.pick_node(this.press_point as Point, ch)) picked = ch
            })
        })
        if (picked) {
            if (e.shiftKey) {
                this.state.selection.add([picked])
            } else {
                this.state.selection.set([picked])
            }
        } else {
            this.state.selection.clear()
        }
        this.movables = this.state.selection.get().filter(sh => sh.has_component(MovableName))// && sh.has_component(RenderBoundsName))
        this.start_offsets = this.movables.map(nd => pt.subtract((nd.get_component(MovableName) as Movable).position()))
        this.refresh_handles(this.state.selection.get())
        this.state.dispatch('selection-change', {})
        this.state.infopanel.position.from_object(this.start_point)
        this.state.infopanel.text = "some text"
        this.state.infopanel.visible = true
    }

    move(e: MouseEvent, pt: Point, root: TreeNode) {
        if (!this.press_point) return
        if (!this.start_point) return
        // @ts-ignore
        let last_mov: Movable = null
        for (let i = 0; i < this.movables.length; i++) {
            let node = this.movables[i]
            let mov = this.movables[i].get_component(MovableName) as Movable
            let start_off = this.start_offsets[i]
            let should_off = pt.subtract(start_off)
            mov.moveTo(should_off.clone())
            let page = find_page_for_node(node)
            if (page && node.has_component(BoundedShapeName) && this.snap) {
                let page_bounds = (page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
                let node_bounds = (node.get_component(BoundedShapeName) as BoundedShape).get_bounds()

                const check_v_snap = (mov: Movable, x1: number, x2: number, state: GlobalState) => {
                    let ob = x1 - x2
                    if (Math.abs(ob) < BOUNDS_SNAP_THRESHOLD / this.ppu) {
                        state.active_v_snap = x1
                        let pos = mov.position().clone()
                        mov.moveTo(new Point(pos.x + ob, pos.y))
                    }
                }
                const check_h_snap = (mov: Movable, y1: number, y2: number, state: GlobalState) => {
                    let ob = y1 - y2
                    if (Math.abs(ob) < BOUNDS_SNAP_THRESHOLD / this.ppu) {
                        state.active_h_snap = y1
                        let pos = mov.position().clone()
                        mov.moveTo(new Point(pos.x, pos.y + ob))
                    }
                }

                check_v_snap(mov, page_bounds.x, node_bounds.x, this.state)
                check_v_snap(mov, page_bounds.center().x, node_bounds.center().x, this.state)
                check_v_snap(mov, page_bounds.x2, node_bounds.x2, this.state)

                check_h_snap(mov, page_bounds.y, node_bounds.y, this.state)
                check_h_snap(mov, page_bounds.center().y, node_bounds.center().y, this.state)
                check_h_snap(mov, page_bounds.y2, node_bounds.y2, this.state)
            }
            if (this.snap_grid) {
                let pos = mov.position().clone()
                pos.x = Math.floor(pos.x / this.snap_grid_size) * this.snap_grid_size
                pos.y = Math.floor(pos.y / this.snap_grid_size) * this.snap_grid_size
                mov.moveTo(pos)
            }
            last_mov = mov
        }
        if (last_mov) {
            this.state.infopanel.position.from_object(pt)
            this.state.infopanel.text = `${last_mov.position().x.toFixed(2)} x ${last_mov.position().y.toFixed(2)}`
        }
        this.state.active_handles.forEach(h => h.update_from_node())
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent, pt: Point, root: TreeNode) {
        this.press_point = null
        this.state.active_v_snap = -1
        this.state.active_h_snap = -1
        this.state.infopanel.visible = false
        this.state.dispatch('object-changed', {})
    }

    private refresh_handles(shapes: any[]) {
        this.state.active_handles = []
        shapes.forEach(shape => {
            if (shape.has_component(ResizableName)) {
                let res: Resizable = shape.get_component(ResizableName) as Resizable
                this.state.active_handles.push(res.get_handle())
            }
            if (shape.has_component(RadiusSelectionName)) {
                let rad: RadiusSelection = shape.get_component(RadiusSelectionName) as RadiusSelection
                this.state.active_handles.push(rad.get_handle())
            }
        })
    }

    private log(...args: any) {
        console.log("Canvas: ", ...args)
    }
}
