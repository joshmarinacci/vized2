import {CanvasOverlay} from "./overlays";
import {GlobalState, Point, Rect, TreeNode} from "../common";
import {CanvasSurf} from "../canvas";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {unit_abbr} from "../units";
import {scale} from "pdf-lib";

export class RulerOverlay implements CanvasOverlay {
    draw(state: GlobalState, surf: CanvasSurf, page: TreeNode): void {
        surf.with_unscaled((ctx) => {
            let pg = (page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
            let pt = surf.transform_point(pg.position.clone())
            let w = pg.w*surf.ppu*surf.scale
            let h = 50
            let rect = new Rect(pt.x,pt.y-h,w,h)
            surf.fill_rect(rect,'cyan')
            // console.log("ppu is",surf.ppu,'unit',surf.unit)
            function tick(pt: Point, num: number, abbr: string) {
                surf.ctx.beginPath()
                surf.ctx.strokeStyle = 'black'
                surf.ctx.moveTo(pt.x,pt.y)
                surf.ctx.lineTo(pt.x,pt.y+15)
                surf.ctx.stroke()
                surf.ctx.fillStyle = 'black'
                surf.ctx.font = '18pt sans-serif'
                surf.ctx.fillText(`${num}${abbr}`,pt.x,pt.y+30)
            }
            // let pt2 = rect.position.clone()
            // tick(pt2)
            /*

            calculate units per pixel
            find the size of unit * 1
            if too small
                find the size of unit * 2
            once found the right power of 2
            print ticks and numbers until fill the width

             */
            let unit_step = 1
            let unit_width = 1
            while(true) {
                unit_width = unit_step * surf.ppu * surf.scale
                if (unit_width >= 128) break;
                unit_step *= 2
            }
            let abbr = unit_abbr(surf.unit)
            let i = 0;
            let x = 0;
            let y = rect.position.y
            while(true) {
                x = i*unit_step*surf.scale*surf.ppu
                if(x > w) break;
                let num = i * unit_step
                tick(new Point(rect.position.x+x,y),num,abbr)
                i += 1
            }
            //do the last tick on the edge
            x = w
            i = x/unit_step/surf.scale/surf.ppu
            let num = i * unit_step
            tick(new Point(rect.position.x+x,y),num,abbr)

        })
    }
}
