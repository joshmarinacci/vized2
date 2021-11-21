import React, {useContext, useEffect, useRef, useState} from "react";
import {GlobalState, Point, TreeNode} from "./common";

//         draw_node(ctx: CanvasRenderingContext2D, root: TreeNode) {
//             this.state.renderers.forEach((rend) => rend.render(ctx, root, this.state))
//             root.children.forEach(ch => this.draw_node(ctx, ch))
//         }
//
//         draw_handles(ctx: CanvasRenderingContext2D) {
//             this.state.active_handles.forEach(hand => {
//                 ctx.fillStyle = 'yellow'
//                 ctx.fillRect(hand.x, hand.y, hand.w, hand.h)
//             })
//         }

function draw_node(state:GlobalState, ctx: CanvasRenderingContext2D, root: TreeNode) {
    state.renderers.forEach((rend) => rend.render(ctx, root, state))
    root.children.forEach(ch => draw_node(state, ctx, ch))
}

export function CanvasView(props:{root:TreeNode, state:GlobalState}) {
    const [pan_offset, set_pan_offset] = useState(new Point(0,0))
    const [zoom_level, set_zoom_level] = useState(0)
    let canvas = useRef<HTMLCanvasElement>(null)

    function refresh(ctx: CanvasRenderingContext2D, zoom_level: number, width:number,height:number) {
        console.log("drawing root is",props.root)
        let scale = Math.pow(2,zoom_level)
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, width,height)
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0+2, 0+2, width-4, height-4)
        ctx.save()
        ctx.translate(pan_offset.x,pan_offset.y)
        ctx.scale(scale,scale)
        draw_node(props.state,ctx, props.root)
        // this.draw_handles(ctx)
        ctx.restore()
    }
    useEffect(()=>{
        if(canvas.current) {
            let can = canvas.current as HTMLCanvasElement
            let ctx = can.getContext('2d') as CanvasRenderingContext2D
            refresh(ctx,zoom_level, can.width, can.height)
        }
    },[canvas])
    return <div className={'panel center'}>
        <canvas ref={canvas} width={400} height={400}/>
    </div>
}
    // export class CanvasView {
    // private dom: HTMLDivElement;
    // private canvas: HTMLCanvasElement;
    // private root: TreeNode;
    // private state: GlobalState;
    // pan_offset: Point
    // zoom_level: number
    //
    // constructor(root: TreeNode, state: GlobalState) {
    //     this.pan_offset = new Point(0,0)
    //     this.zoom_level = 0
    //         const over_handle = (e: MouseEvent) => {
    //             let pt = toCanvasPoint(e,this)
    //             return state.active_handles.find(hand => hand.contains(pt))
    //         }
    //         this.canvas.addEventListener('mousedown', e => {
    //             //check if pressed on a handle
    //             let hand: Handle = over_handle(e)
    //             if (hand) {
    //             delegate = new HandleMoveDelegate(state, this, hand)
    //         } else {
    //             delegate = new MouseMoveDelegate(state,this)
    //         }
    //             delegate.press(e)
    //         })
    //         this.canvas.addEventListener('mousemove', e => delegate?delegate.move(e):"")
    //         this.canvas.addEventListener('mouseup', e => {
    //             if(delegate) delegate.release(e)
    //             delegate = null
    //         })
    //         this.canvas.addEventListener('wheel',(e:WheelEvent) => {
    //             this.pan_offset.x += e.deltaX/10
    //             this.pan_offset.y += e.deltaY/10
    //             this.refresh()
    //         })
    //
    //         state.on("refresh", () => this.refresh())
    //         state.on("selection-change", ()=>this.refresh())
    //         state.on("prop-change",()=>this.refresh())
    //         elem.append(this.canvas)
    //         this.dom = elem
    //         this.root = root
    //         this.state = state
    //         }
    //         refresh() {
    //             let scale = Math.pow(2,this.zoom_level)
    //             let ctx = this.canvas.getContext('2d')
    //             ctx.fillStyle = 'black'
    //             ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    //             ctx.fillStyle = '#f0f0f0'
    //             ctx.fillRect(0+2, 0+2, this.canvas.width-4, this.canvas.height-4)
    //             ctx.save()
    //             ctx.translate(this.pan_offset.x,this.pan_offset.y)
    //             ctx.scale(scale,scale)
    //             this.draw_node(ctx, this.state.get_root())
    //             this.draw_handles(ctx)
    //             ctx.restore()
    //         }
    //         draw_node(ctx: CanvasRenderingContext2D, root: TreeNode) {
    //             this.state.renderers.forEach((rend) => rend.render(ctx, root, this.state))
    //             root.children.forEach(ch => this.draw_node(ctx, ch))
    //         }
    //
    //         draw_handles(ctx: CanvasRenderingContext2D) {
    //             this.state.active_handles.forEach(hand => {
    //                 ctx.fillStyle = 'yellow'
    //                 ctx.fillRect(hand.x, hand.y, hand.w, hand.h)
    //             })
    //         }
    //
    //         get_dom() {
    //             return this.dom
    //         }
    //
    //         zoom_in() {
    //             this.zoom_level += 1
    //             this.refresh()
    //         }
    //
    //         zoom_out() {
    //             this.zoom_level -= 1
    //             this.refresh()
    //         }
    //         }
