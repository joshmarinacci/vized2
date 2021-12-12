import React, {useContext, useEffect, useRef, useState} from "react";
import {
    DIAG_HATCH_IMAGE,
    GlobalState,
    GlobalStateContext,
    Handle,
    Movable,
    MovableName,
    ParentTranslate,
    ParentTranslateName,
    Point,
    Resizable,
    ResizableName,
    TreeNode
} from "./common";
import {Toolbar} from "./comps";
import {
    Action,
    delete_selection,
    delete_selection_action,
    move_down,
    move_to_bottom,
    move_to_top,
    move_up,
    nothing
} from "./actions";
import {PopupContext, PopupContextImpl} from "./popup";
import {BoundedShape, BoundedShapeName} from "./bounded_shape";
import {GroupShape, GroupShapeName} from "./powerups/group_powerup";
import {
    calc_total_min_bounds,
    fillRect,
    fillRectHole,
    find_first_page,
    find_page_for_node,
    find_page_for_selection,
    strokeRect
} from "./util";

function draw_node(state:GlobalState, ctx: CanvasRenderingContext2D, node: TreeNode) {
    //draw the current node
    state.renderers.forEach((rend) => rend.render(ctx, node, state))
    //get transform for children
    ctx.save()
    if(node.has_component(ParentTranslateName)) {
        let trans = node.get_component(ParentTranslateName) as ParentTranslate
        let offset = trans.get_translation_point()
        ctx.translate(offset.x,offset.y)
    }
    node.children.forEach(ch => draw_node(state, ctx, ch))
    ctx.restore()
}

function draw_handles(state:GlobalState, ctx: CanvasRenderingContext2D, node:TreeNode) {
    let off = new Point(0,0)
    if(node.has_component(ParentTranslateName)) {
        let pt = (node.get_component(ParentTranslateName) as ParentTranslate).get_translation_point()
        off = pt
    }
    state.active_handles.forEach(hand => {
        ctx.fillStyle = 'yellow'
        ctx.fillRect(off.x+hand.x, off.y+hand.y, hand.w, hand.h)
    })
}
function draw_snaps(state: GlobalState, ctx: CanvasRenderingContext2D, page: TreeNode) {
    let pg_bounds = (page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
    if(state.active_v_snap !== -1) {
        ctx.beginPath()
        ctx.moveTo(state.active_v_snap, pg_bounds.y)
        ctx.lineTo(state.active_v_snap, pg_bounds.y2)
        ctx.strokeStyle = 'green'
        ctx.stroke()
    }
    if(state.active_h_snap !== -1) {
        ctx.beginPath()
        ctx.moveTo(pg_bounds.x, state.active_h_snap)
        ctx.lineTo(pg_bounds.x2, state.active_h_snap)
        ctx.strokeStyle = 'green'
        ctx.stroke()
    }
}



export interface MouseGestureDelegate {
    press(e: MouseEvent, pt:Point, root:TreeNode):void
    move(e: MouseEvent, pt:Point, root:TreeNode):void
    release(e: MouseEvent, pt:Point, root:TreeNode):void
}


class MouseMoveDelegate implements MouseGestureDelegate {
    press_point: Point | null
    private state: GlobalState;

    constructor(state: GlobalState) {
        this.state = state
        this.press_point = null
    }

    press(e: MouseEvent, pt:Point, root:TreeNode) {
        this.press_point = pt
        let picked:TreeNode|null = null
        root.children.forEach((ch:TreeNode) => {
            this.state.pickers.forEach(pk => {
                if(pk.pick_node(this.press_point as Point, ch))  picked = ch
            })
        })
        if(picked) {
            if(e.shiftKey) {
                this.state.selection.add([picked])
            } else {
                this.state.selection.set([picked])
            }
        } else {
            this.state.selection.clear()
        }
        this.refresh_handles(this.state.selection.get())
        this.state.dispatch('selection-change',{})
    }

    move(e: MouseEvent, pt:Point, root:TreeNode) {
        if (!this.press_point) return
        let drag_point = pt
        let diff = drag_point.subtract(this.press_point)
        this.press_point = drag_point
        let movables: TreeNode[] = this.state.selection.get().filter(sh => sh.has_component(MovableName))
        movables.forEach(node => {
            let mov: Movable = node.get_component(MovableName) as Movable
            mov.moveBy(diff)
        })
        //if bounds of selection is near a snap area, draw the snap, then jump to that spot
        let bs = this.state.selection.get().filter(sh => sh.has_component(BoundedShapeName))
        if(bs.length >= 1) {
            let bds = (bs[0].get_component(BoundedShapeName) as BoundedShape).get_bounds()
            let page = find_page_for_node(bs[0])
            this.state.active_v_snap = -1
            this.state.active_h_snap = -1
            if(page) {
                let page_bounds = (page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
                let off = new Point(0,0)
                if(Math.abs(bds.center().x - page_bounds.center().x) < 10) {
                    this.state.active_v_snap = page_bounds.center().x
                    off.x = page_bounds.center().x - bds.center().x
                }
                if(Math.abs(bds.center().y - page_bounds.center().y) < 10) {
                    this.state.active_h_snap = page_bounds.center().y
                    off.y = page_bounds.center().y - bds.center().y
                }
                movables.forEach(node => (node.get_component(MovableName) as Movable).moveBy(off))
            }
        }


        this.state.active_handles.forEach(h => h.update_from_node())
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent, pt:Point, root:TreeNode) {
        this.press_point = null
        this.state.active_v_snap = -1
        this.state.active_h_snap = -1
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
    private start: Point | null;

    constructor(state: GlobalState, hand: Handle) {
        this.state = state
        this.start = null
        this.handle = hand
    }

    press(e: MouseEvent, pt:Point, root:TreeNode) {
        this.log("pressed on handle")
        this.start = pt
    }

    move(e: MouseEvent, pt:Point, root:TreeNode) {
        let curr = pt
        let diff = curr.subtract(this.start as Point)
        this.handle.moveBy(diff)
        this.start = curr
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent) {
        this.start = null
        this.state.dispatch('object-changed',{})
    }

    private log(...args:any) {
        console.log("HandleMouseDelegate:", ...args)
    }
}

function ContextMenu(props: { state: GlobalState }) {
    let pc = useContext(PopupContext) as PopupContextImpl
    let actions:Action[] = []
    if(!props.state.selection.isEmpty()) {
        actions.push(delete_selection_action)
        actions.push(move_to_bottom)
        actions.push(move_down)
        actions.push(move_up)
        actions.push(move_to_top)
    }
    if(actions.length === 0) actions.push(nothing)
    return <ul className={'menu'}>
        {actions.map((act,i)=>{
            return <li className={'menu-item'} key={i} onClick={()=>{
                // @ts-ignore
                act.fun(null,props.state)
                pc.hide()
            }
            }>{act.title}</li>
        })}
    </ul>
}

export function CanvasView(props:{}) {
    let state = useContext(GlobalStateContext)
    const [pan_offset, set_pan_offset] = useState(new Point(0,0))
    const [zoom_level, set_zoom_level] = useState(0)
    const scale = Math.pow(1.5,zoom_level)
    const [delegate, set_delegate] = useState<MouseGestureDelegate|null>()
    const [is_inset, set_is_inset] = useState(false)
    const [current_page, set_current_page] = useState(()=>find_first_page(state.get_root()))
    const [current_root, set_current_root] = useState(()=>find_first_page(state.get_root()))
    let canvas = useRef<HTMLCanvasElement>(null)
    let pc = useContext(PopupContext)
    // console.log("current root = ",current_root.title)

    // reset things when the document changes
    useEffect(()=>{
        let op = (rt:TreeNode) => {
            // console.log(`doc changed. new root = ${rt.id} ${state.get_root().id}`)
            set_pan_offset(new Point(0,0))
            set_zoom_level(0)
            set_delegate(null)
            set_is_inset(false)
        }
        state.on("document-change", op)
        return () => {
            state.off("document-change",op)
        }
    })

    const SLOP = new Point(100,100)
    const min_bounds = calc_total_min_bounds(current_page).grow(SLOP.x)

    function toRootPoint(e: MouseEvent) {
        let target: HTMLElement = e.target as HTMLElement
        let bounds = target.getBoundingClientRect()
        let cp = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
        let pt = cp.subtract(pan_offset)
        pt = pt.multiply(1/scale)
        pt = pt.add(min_bounds.position)
        let root = current_root
        if(root.has_component(ParentTranslateName)) {
            let off = (root.get_component(ParentTranslateName) as ParentTranslate).get_translation_point()
            pt = pt.subtract(off)
        }
        return pt
    }

    const over_handle = (e: MouseEvent) => {
        let pt = toRootPoint(e)
        return state.active_handles.find((hand:Handle) => hand.contains(pt))
    }

    const over_group = (e:MouseEvent):TreeNode|null => {
        let pt = toRootPoint(e)
        for(let ch of current_root.children) {
            if(ch.has_component(ParentTranslateName)) {
                for(let pk of state.pickers) {
                    if(pk.pick_node(pt,ch)) {
                        return ch
                    }
                }
            }
        }
        return null
    }

    function refresh() {
        // console.log("inset",is_inset,'current_root',current_root.title)
        if(!current_root) return
        if(!canvas.current) return
        let can = canvas.current as HTMLCanvasElement
        let ctx = can.getContext('2d') as CanvasRenderingContext2D
        // let scale = Math.pow(2,zoom_level)
        //real size of the canvas
        ctx.fillStyle = 'yellow'
        ctx.fillRect(0,0,can.width,can.height)
        ctx.save()
        // ctx.translate(pan_offset.x,pan_offset.y)
        ctx.scale(scale,scale)

        ctx.translate(-min_bounds.x,-min_bounds.y)
        fillRect(ctx,min_bounds,'#f0f0f0')
        fillRect(ctx,min_bounds,ctx.createPattern(DIAG_HATCH_IMAGE,"repeat") as CanvasPattern)

        ctx.save()
        draw_node(state,ctx, current_page)
        draw_handles(state, ctx, current_page)
        draw_snaps(state,ctx,current_page)
        ctx.restore()

        if(is_inset && current_root.has_component(GroupShapeName)) {
            let group = current_root.get_component(GroupShapeName) as GroupShape
            let child_bounds = group.get_child_bounds()
            strokeRect(ctx,child_bounds,'aqua')
            fillRectHole(ctx,min_bounds,child_bounds,'rgba(255,0,0,0.2)')
        }
        ctx.restore()
    }
    //redraw when current root changes, or transforms, or the docroot or min bounds
    useEffect(()=> refresh(),[canvas, pan_offset, zoom_level, current_root, min_bounds.w, min_bounds.h])

    //change first page when docroot changes
    useEffect(() => {
        let page = find_first_page(state.get_root())
        set_current_page(page)
        set_current_root(page)
    },[state.get_root()])

    //redraw on refresh or prop change
    useEffect(()=>{
        let op = () => refresh()
        state.on("prop-change", op)
        state.on("object-changed", op)
        state.on("refresh", op)
        return () => {
            state.off("refresh",op)
            state.off("prop-change", op)
            state.off("object-changed", op)
        }
    })

    //recalc current page when selection changes
    useEffect(()=>{
        let op = () => {
            //do nothing if the selection is empty
            if(state.selection.isEmpty()) return refresh()
            let page = find_page_for_selection(state.selection)
            if(!page) page = find_first_page(state.get_root())
            if(page && page !== current_page) {
                set_current_page(page)
                set_current_root(page)
            }
            refresh()
        }
        state.on("selection-change", op)
        return () => {
            state.off("selection-change",op)
        }
    })

    // @ts-ignore
    const mousedown = (e:MouseEvent<HTMLCanvasElement>) => {
        if(e.button === 2) return
        //check if pressed on a handle
        let pt = toRootPoint(e)
        let hand: Handle = over_handle(e) as Handle
        let del = null
        if (hand) {
            del =  new HandleMoveDelegate(state,hand)
        } else {
            del = new MouseMoveDelegate(state)
        }
        del.press(e,pt,current_root)
        set_delegate(del)
    }
    // @ts-ignore
    const mousemove = (e:MouseEvent<HTMLCanvasElement>) => {
        if(delegate) delegate.move(e, toRootPoint(e),current_root)
    }
    // @ts-ignore
    const mouseup = (e:MouseEvent<HTMLCanvasElement>) => {
        if(delegate) delegate.release(e,toRootPoint(e),current_root)
        set_delegate(null)
    }
    // @ts-ignore
    const wheel = (e:WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        set_pan_offset(new Point(
            pan_offset.x + e.deltaX / 10,
            pan_offset.y + e.deltaY / 10
        ))
    }
    const enter_inset = (g: TreeNode)  => {
        set_current_root(g)
        set_is_inset(true)
    }

    const exit_inset = () => {
        set_current_root(current_page)
        set_is_inset(false)
    }

    // @ts-ignore
    const mousedouble = (e:MouseEvent<HTMLCanvasElement>) => {
        let g = over_group(e)
        if(g) enter_inset(g)
    }


    // @ts-ignore
    function keypress(e:KeyboardEvent<HTMLCanvasElement>) {
        // console.log("keyboard event",e.key)
        if(e.key === 'Backspace') {
            delete_selection(state)
        }
    }

    // @ts-ignore
    const show_menu = (e:MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        let container:JSX.Element = <ContextMenu state={state}/>
        pc.show(container,e)
    }


    let scaled_min_bounds = min_bounds.scale(scale)
    return <div className={'panel center vbox'}>
        <Toolbar>
            <button onClick={()=>set_zoom_level(zoom_level+1)}>zoom in</button>
            <label>{(scale*100).toFixed(0)}</label>
            <button onClick={()=>{set_zoom_level(zoom_level-1)}}>zoom out</button>
            <button disabled={!is_inset} onClick={()=>exit_inset()}>exit</button>
        </Toolbar>
        <div className={'canvas-wrapper grow'}>
            {/*<div className={'canvas-sizer'} style={{width:min_bounds.w+'px', height:min_bounds.h+'px'}}/>*/}
        <canvas ref={canvas}
                width={scaled_min_bounds.w+'px'}
                height={scaled_min_bounds.h+'px'}
                className={'draw-surface'}
                tabIndex={0}
                onDoubleClick={mousedouble}
                onMouseDown={mousedown}
                onMouseMove={mousemove}
                onMouseUp={mouseup}
                // onWheel={wheel}
                onKeyUp={keypress}
                onContextMenu={show_menu}
        />
        </div>
    </div>
}


