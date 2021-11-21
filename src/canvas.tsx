import React, {useEffect, useRef, useState} from "react";
import {
    GlobalState,
    Handle,
    MouseGestureDelegate,
    Movable,
    MovableName,
    Point, Resizable, ResizableName,
    TreeNode
} from "./common";

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

class MouseMoveDelegate implements MouseGestureDelegate {
    press_point: Point
    private state: GlobalState;

    constructor(state: GlobalState) {
        this.press_point = new Point(0,0)
        this.state = state
    }

    press(e: MouseEvent, pt:Point) {
        this.press_point = pt
        let shapes:TreeNode[] = []
        this.state.pickers.forEach(pk => shapes.push(...pk.pick(this.press_point, this.state)))
        e.shiftKey ? this.state.selection.add(shapes) : this.state.selection.set(shapes)
        this.refresh_handles(shapes)
        this.state.dispatch('selection-change',{})
    }

    move(e: MouseEvent, pt:Point) {
        if (!this.press_point) return
        let drag_point = pt
        let diff = drag_point.subtract(this.press_point)
        this.press_point = drag_point
        let movables: TreeNode[] = this.state.selection.get().filter(sh => sh.has_component(MovableName))
        movables.forEach(node => {
            let mov: Movable = node.get_component(MovableName) as Movable
            mov.moveBy(diff)
        })
        this.state.active_handles.forEach(h => h.update_from_node())
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent, pt:Point) {
        // @ts-ignore
        this.press_point = null
        this.state.dispatch('object-changed',{})
    }

    private refresh_handles(shapes: any[]) {
        this.state.active_handles = []
        shapes.forEach(shape => {
            if (shape.has_component(ResizableName)) {
                let res: Resizable = shape.get_component(ResizableName) as Resizable
                this.state.active_handles.push(res.get_handle())
            }
        })
    }
}

class HandleMoveDelegate implements MouseGestureDelegate {
    private state: GlobalState;
    private handle: Handle;
    private start: Point;

    constructor(state: GlobalState, hand: Handle) {
        this.state = state
        this.start = new Point(0,0)
        this.handle = hand
    }

    press(e: MouseEvent, pt:Point) {
        this.log("pressed on handle")
        this.start = pt
    }

    move(e: MouseEvent, pt:Point) {
        let curr = pt//toCanvasPoint(e,this.canvas)
        let diff = curr.subtract(this.start)
        this.handle.moveBy(diff)
        this.start = curr
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent) {
        this.state.dispatch('object-changed',{})
    }

    private log(...args:any) {
        console.log("HandleMouseDelegate:", ...args)
    }
}

export function CanvasView(props:{root:TreeNode, state:GlobalState}) {
    const [pan_offset, set_pan_offset] = useState(new Point(0,0))
    const [zoom_level, set_zoom_level] = useState(0)
    const [delegate, set_delegate] = useState<MouseGestureDelegate|null>()
    let canvas = useRef<HTMLCanvasElement>(null)

    function toCanvasPoint(e: MouseEvent) {
        let target: HTMLElement = e.target as HTMLElement
        let bounds = target.getBoundingClientRect()
        let cp = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
        let pt = cp.subtract(pan_offset)
        let scale = Math.pow(2,zoom_level)
        return pt.multiply(1/scale)
    }
    const over_handle = (e: MouseEvent) => {
        let pt = toCanvasPoint(e)
        return props.state.active_handles.find(hand => hand.contains(pt))
    }
    function refresh(ctx: CanvasRenderingContext2D, zoom_level: number, width:number,height:number) {
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
    },[canvas,pan_offset])

    useEffect(()=>{
        let op = () => {
            let can = canvas.current as HTMLCanvasElement
            let ctx = can.getContext('2d') as CanvasRenderingContext2D
            refresh(ctx,zoom_level, can.width, can.height)
        }
        props.state.on("selection-change", op)
        props.state.on("refresh", op)
        return () => {
            props.state.off("selection-change",op)
            props.state.off("refresh",op)
        }
    })

    // @ts-ignore
    const mousedown = (e:MouseEvent<HTMLCanvasElement>) => {
        // console.log("e",e)
        //check if pressed on a handle
        let hand: Handle = over_handle(e) as Handle
        let del = null
        if (hand) {
            del =  new HandleMoveDelegate(props.state,hand)
        } else {
            del = new MouseMoveDelegate(props.state)
        }
        let pt = toCanvasPoint(e)
        del.press(e,pt)
        set_delegate(del)
    }
    // @ts-ignore
    const mousemove = (e:MouseEvent<HTMLCanvasElement>) => {
        if(delegate) delegate.move(e, toCanvasPoint(e))
    }
    // @ts-ignore
    const mouseup = (e:MouseEvent<HTMLCanvasElement>) => {
        if(delegate) delegate.release(e, toCanvasPoint(e))
        set_delegate(null)
    }
    // @ts-ignore
    const wheel = (e:WheelEvent<HTMLCanvasElement>) => {
        set_pan_offset(new Point(
            pan_offset.x + e.deltaX / 10,
            pan_offset.y + e.deltaY / 10
        ))
        // this.pan_offset.x += e.deltaX/10
        // this.pan_offset.y += e.deltaY/10
        // this.refresh()
    }

    return <div className={'panel center'}>
        <canvas ref={canvas} width={400} height={400}
                onMouseDown={mousedown}
                onMouseMove={mousemove}
                onMouseUp={mouseup}
                onWheel={wheel}
        />
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
