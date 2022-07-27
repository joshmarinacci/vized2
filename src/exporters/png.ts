import {
    CanvasRenderSurface,
    DefaultPowerup,
    forceDownloadBlob,
    GlobalState, PageMarker, PageName,
    ParentDrawChildrenName,
    ParentLike,
    ParentLikeName, Point, Rect,
    TreeNode,
    Unit
} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {Action} from "../actions";
import {find_first_page} from "../util";

function to_PNG(surf:CanvasRenderSurface, node: TreeNode, state: GlobalState) {
    //draw the current node
    state.renderers.forEach(rend => rend.render(surf,node,state))
    if(node.has_component(ParentDrawChildrenName)) return
    surf.ctx.save()
    if(node.has_component(ParentLikeName)) {
        let trans = node.get_component(ParentLikeName) as ParentLike
        let offset = trans.get_position()
        surf.ctx.translate(offset.x,offset.y)
    }
    node.children.forEach(ch => to_PNG(surf, ch, state))
    surf.ctx.restore()
}

export function export_PNG(root: TreeNode, state: GlobalState):HTMLCanvasElement {
    let bds = {
        w:500,
        h:500,
    }
    if(root.has_component(BoundedShapeName)) {
        let bounds = root.get_component(BoundedShapeName) as BoundedShape
        let rect = bounds.get_bounds()
        bds.w = rect.w
        bds.h = rect.h
    }

    let page = find_first_page(state.get_root())
    let pg = page.get_component(PageName) as PageMarker

    let canvas = document.createElement('canvas')
    canvas.width = bds.w
    canvas.height = bds.h
    let ctx= canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)

    let surf:CanvasRenderSurface = new PNGSurface(ctx,pg)

    root.children.forEach(ch => to_PNG(surf, ch, state))
    return canvas
}

class PNGSurface implements CanvasRenderSurface {
    ctx: CanvasRenderingContext2D
    inset: boolean
    ppu: number
    scale: number
    translate:Point
    selectionEnabled: boolean
    unit: Unit

    constructor(ctx: CanvasRenderingContext2D, pg:PageMarker) {
        this.ctx = ctx
        this.inset = false
        this.unit = pg.unit
        this.ppu = pg.ppu
        this.scale = 1.0
        this.selectionEnabled = false
        this.translate = new Point(0,0)
    }

    with_scaled(lam: (ctx: CanvasRenderingContext2D) => void) {
        this.ctx.save()
        this.ctx.scale(this.scale,this.scale)
        this.ctx.translate(this.translate.x,this.translate.y)
        this.ctx.scale(this.ppu,this.ppu)
        lam(this.ctx)
        this.ctx.restore()
    }

    fill_rect(rect: Rect, color: any) {
        this.ctx.fillStyle = color
        this.ctx.fillRect(rect.x,rect.y,rect.w,rect.h)
    }
}

export function canvasToPNGBlob(canvas:HTMLCanvasElement):Promise<Blob> {
    return new Promise((res,rej)=>{
        canvas.toBlob((blob)=> res(blob as Blob),'image/png')
    })
}

export class PNGPowerup extends DefaultPowerup {
    override export_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"export PNG",
            fun(node: TreeNode, state: GlobalState): void {
                let can = export_PNG(node,state)
                canvasToPNGBlob(can).then(blob => forceDownloadBlob(`test.png`,blob))
            }
        }
        return [action]
    }
}
