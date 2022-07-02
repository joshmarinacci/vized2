import {CanvasOverlay} from "./overlays";
import {GlobalState, Point, Rect, TreeNode} from "../common";
import {CanvasSurf} from "../canvas";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";

export class RulerOverlay implements CanvasOverlay {
    draw(state: GlobalState, surf: CanvasSurf, page: TreeNode): void {
        surf.with_unscaled((ctx) => {
            let pg = (page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
            let pt = surf.transform_point(pg.position.clone())
            let w = pg.w*surf.ppu*surf.scale
            let h = 50
            let rect = new Rect(pt.x,pt.y-h,w,h)
            surf.fill_rect(rect,'cyan')
            console.log("ppu is",surf.ppu,'unit',surf.unit)
            function tick(pt:Point) {
                surf.ctx.beginPath()
                surf.ctx.strokeStyle = 'black'
                surf.ctx.moveTo(pt.x,pt.y)
                surf.ctx.lineTo(pt.x,pt.y+20)
                surf.ctx.stroke()
            }
            // let pt2 = rect.position.clone()
            // tick(pt2)
            let x = 0
            while(true) {
                let pt2 = rect.position.clone()
                pt2.x = Math.floor(pt2.x+x)
                tick(pt2)
                x += 10*surf.scale
                if(x > w) {
                    break;
                }
            }
        })
    }
}
