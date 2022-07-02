import {MouseGestureDelegate} from "./mouse_gesture";
import {GlobalState, Handle, Point, TreeNode} from "../common";

export class HandleMoveDelegate implements MouseGestureDelegate {
    private state: GlobalState;
    private handle: Handle;
    private start: Point | null;

    constructor(state: GlobalState, hand: Handle) {
        this.state = state
        this.start = null
        this.handle = hand
    }

    press(e: MouseEvent, pt: Point, root: TreeNode) {
        this.start = pt
        this.state.infopanel.visible = true
        this.state.infopanel.position.from_object(pt)
        this.state.infopanel.text = this.handle.display_value()
    }

    move(e: MouseEvent, pt: Point, root: TreeNode) {
        let curr = pt
        let diff = curr.subtract(this.start as Point)
        this.handle.moveBy(diff)
        this.start = curr
        this.state.infopanel.position.from_object(pt)
        this.state.infopanel.text = this.handle.display_value()
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent) {
        this.start = null
        this.state.infopanel.visible = false
        this.state.dispatch('object-changed', {})
    }

    private log(...args: any) {
        console.log("HandleMouseDelegate:", ...args)
    }
}
