import {CanvasOverlay} from "./overlays";
import {GlobalState, Point, TreeNode} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {CanvasSurf} from "../canvas";

export class SnapsOverlay implements CanvasOverlay {
    draw(state: GlobalState, surf: CanvasSurf, page: TreeNode): void {
        let pg_bounds = (page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
        surf.with_unscaled((ctx: CanvasRenderingContext2D) => {
            if (state.active_v_snap !== -1) {
                surf.stroke_line(
                    surf.transform_point(new Point(state.active_v_snap, pg_bounds.y)),
                    surf.transform_point(new Point(state.active_v_snap, pg_bounds.y2)),
                    1,
                    'green')
            }
            if (state.active_h_snap !== -1) {
                surf.stroke_line(
                    surf.transform_point(new Point(pg_bounds.x, state.active_h_snap)),
                    surf.transform_point(new Point(pg_bounds.x2, state.active_h_snap)),
                    1,
                    'green')
            }
        })
    }
}
