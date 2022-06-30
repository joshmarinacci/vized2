import {
    CanvasRenderSurface,
    DefaultPowerup,
    forceDownloadBlob,
    GlobalState,
    ParentDrawChildrenName,
    ParentLike,
    ParentLikeName,
    TreeNode,
    Unit
} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {Action} from "../actions";

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

    let canvas = document.createElement('canvas')
    canvas.width = bds.w
    canvas.height = bds.h
    let ctx= canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)

    let surf:CanvasRenderSurface = {
        ctx: ctx,
        selectionEnabled: true,
        inset:false,
        ppu: 100,
        scale: 1,
        unit: Unit.Pixels,
    }
    root.children.forEach(ch => to_PNG(surf, ch, state))
    return canvas
}

function canvasToPNGBlob(canvas:HTMLCanvasElement):Promise<Blob> {
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
