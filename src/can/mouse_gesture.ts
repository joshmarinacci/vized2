import {Point, TreeNode} from "../common";

export interface MouseGestureDelegate {
    press(e: MouseEvent, pt: Point, root: TreeNode): void

    move(e: MouseEvent, pt: Point, root: TreeNode): void

    release(e: MouseEvent, pt: Point, root: TreeNode): void
}
