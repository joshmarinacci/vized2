import {CanvasOverlay} from "./overlays";
import {GlobalState, Point, Rect, TreeNode} from "../common";
import {CanvasSurf} from "../canvas";

export class InfoPanelOverlay implements CanvasOverlay {
    draw(state: GlobalState, surf: CanvasSurf, page: TreeNode): void {
        if (!state.infopanel.visible) return
        surf.with_unscaled((ctx) => {
            let rect_pos = surf.transform_point(state.infopanel.position.add(new Point(20, 20)));
            ctx.font = '24px sans-serif'
            let met = ctx.measureText(state.infopanel.text)
            let pad = 10
            let rect = new Rect(rect_pos.x, rect_pos.y,
                met.width + pad + pad,
                met.actualBoundingBoxAscent + met.actualBoundingBoxDescent + pad + pad)
            surf.fill_rect(rect, 'gray')
            let text_pos = rect_pos.add(new Point(pad, pad + met.actualBoundingBoxAscent))
            surf.fill_text(state.infopanel.text, text_pos, 'white')
        })
    }
}
