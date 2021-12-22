import {
    forceDownloadBlob,
    TreeNode,
    GlobalState,
    DefaultPowerup,
    ParentDrawChildrenName, ParentLikeName, ParentLike, CanvasRenderSurface
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

export function export_PNG(root: TreeNode, state: GlobalState) {
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
        selectionEnabled: true
    }
    root.children.forEach(ch => to_PNG(surf, ch, state))

    function canvasToPNGBlob(canvas:HTMLCanvasElement):Promise<Blob> {
        return new Promise((res,rej)=>{
            canvas.toBlob((blob)=> res(blob as Blob),'image/png')
        })
    }
    canvasToPNGBlob(canvas).then((blob)=> forceDownloadBlob(`test.png`,blob))

}
export class PNGPowerup extends DefaultPowerup {
    override export_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"export PNG",
            fun(node: TreeNode, state: GlobalState): void {
                export_PNG(node,state)
            }
        }
        return [action]
    }
}
