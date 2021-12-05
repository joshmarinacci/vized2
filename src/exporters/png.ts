import {
    forceDownloadBlob,
    ParentTranslate,
    ParentTranslateName,
    TreeNode,
    GlobalState,
    DefaultPowerup
} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {Action} from "../actions";

function to_PNG(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState) {
    //draw the current node
    state.renderers.forEach(rend => rend.render(ctx,node,state))
    ctx.save()
    if(node.has_component(ParentTranslateName)) {
        let trans = node.get_component(ParentTranslateName) as ParentTranslate
        let offset = trans.get_translation_point()
        ctx.translate(offset.x,offset.y)
    }
    node.children.forEach(ch => to_PNG(ctx, ch, state))
    ctx.restore()
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

    root.children.forEach(ch => to_PNG(ctx, ch, state))

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
