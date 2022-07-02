import {CanvasOverlay} from "./overlays";
import {GlobalState, ParentLike, ParentLikeName, Point, Rect, TreeNode} from "../common";
import {CanvasSurf} from "../canvas";

function make_centered_square(point: Point, number: number) {
    return new Rect(
        point.x - number / 2,
        point.y - number / 2,
        number,
        number,
    )
}

export class HandlesOverlay implements CanvasOverlay {
    draw(state: GlobalState, surf: CanvasSurf, page: TreeNode): void {
        let off = new Point(0, 0)
        if (page.has_component(ParentLikeName)) {
            off = (page.get_component(ParentLikeName) as ParentLike).get_position()
        }
        surf.with_unscaled((ctx) => {
            state.active_handles.forEach(hand => {
                let pt = surf.transform_point(new Point(hand.x, hand.y))
                let rect = make_centered_square(pt, hand.size).translate(off)
                surf.fill_rect(rect, '#e28f14')
            })
        })
    }
}
