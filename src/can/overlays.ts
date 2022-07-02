import {GlobalState, TreeNode} from "../common";
import {CanvasSurf} from "../canvas";

export interface CanvasOverlay {
    draw(state: GlobalState, surf: CanvasSurf, page: TreeNode): void
}
