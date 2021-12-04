import React, {useContext, useEffect, useRef, useState} from "react";
import {
    DocName,
    GlobalState, GlobalStateContext,
    Handle,
    Movable,
    MovableName,
    PageName,
    ParentTranslate,
    ParentTranslateName,
    Point, Rect,
    Resizable,
    ResizableName,
    SelectionSystem,
    TreeNode
} from "./common";
import {Toolbar} from "./comps";
import {Action, delete_node, delete_selection, delete_selection_action, nothing} from "./actions";
import {PopupContext, PopupContextImpl} from "./popup";
import {BoundedShape, BoundedShapeName} from "./bounded_shape";

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
        //skip root
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
        this.state.active_handles.forEach(h => h.update_from_node())
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent, pt:Point, root:TreeNode) {
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


function find_first_page(root: TreeNode):TreeNode {
    if(root.has_component(DocName)) {
        if(root.has_component(PageName)) return root
        let pg = root.children.find(ch => ch.has_component(PageName))
        if(!pg) throw new Error("couldn't find a page child")
        return pg
    } else {
        throw new Error("root isn't a doc!")
    }
}

function find_page_for_node(node:TreeNode):TreeNode|null {
    if(node.has_component(PageName)) {
        return node
    }
    if(node.parent !== null) {
        return find_page_for_node(node.parent)
    }
    return null
}
function find_page_for_selection(selection: SelectionSystem):TreeNode|null {
    if(selection.isEmpty()) return null
    return find_page_for_node(selection.get()[0])
}

function ContextMenu(props: { state: GlobalState }) {
    let pc = useContext(PopupContext) as PopupContextImpl
    let actions:Action[] = []
    if(!props.state.selection.isEmpty()) {
        actions.push(delete_selection_action)
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
    const [delegate, set_delegate] = useState<MouseGestureDelegate|null>()
    const [is_inset, set_is_inset] = useState(false)
    const [current_page, set_current_page] = useState(()=>find_first_page(state.get_root()))
    const [current_root, set_current_root] = useState(()=>find_first_page(state.get_root()))
    let canvas = useRef<HTMLCanvasElement>(null)
    let pc = useContext(PopupContext)

    const SLOP = new Point(100,100)

    function calc_min_bounds(current_page: TreeNode):Rect {
        let page_bounds = (current_page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
        page_bounds = page_bounds.grow(SLOP.x)
        let scale = Math.pow(2,zoom_level)
        return page_bounds.scale(scale)
    }
    let min_bounds = calc_min_bounds(current_page)

    function toRootPoint(e: MouseEvent) {
        let target: HTMLElement = e.target as HTMLElement
        let bounds = target.getBoundingClientRect()
        let cp = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
        let pt = cp.subtract(pan_offset)
        let scale = Math.pow(2,zoom_level)
        pt = pt.multiply(1/scale)
        pt = pt.subtract(SLOP)
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
        if(!current_root) return
        if(!current_root.has_component(BoundedShapeName)) return
        if(!canvas.current) return
        let can = canvas.current as HTMLCanvasElement
        let ctx = can.getContext('2d') as CanvasRenderingContext2D
        let scale = Math.pow(2,zoom_level)
        ctx.save()
        // ctx.translate(pan_offset.x,pan_offset.y)
        ctx.scale(scale,scale)
        let page_bounds = (current_root.get_component(BoundedShapeName) as BoundedShape).get_bounds()
        let slop_bounds = page_bounds.grow(SLOP.x)
        ctx.translate(-slop_bounds.x,-slop_bounds.y)
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(slop_bounds.x,slop_bounds.y,slop_bounds.w,slop_bounds.h)
        draw_node(state,ctx, current_root)
        draw_handles(state, ctx, current_root)
        ctx.restore()
    }
    //redraw when current root changes, or transforms, or the docroot
    useEffect(()=> refresh(),[canvas,pan_offset, zoom_level, current_root])

    //change first page when docroot changes
    useEffect(() => {
        set_current_page(find_first_page(state.get_root()))
        set_current_root(state.get_root())
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
            let page = find_page_for_selection(state.selection)
            if(!page) page = find_first_page(state.get_root())
            if(page && page !== current_page) {
                set_current_page(page)
                set_current_root(page)
            }
            refresh()
        }
        state.on("selection-change", op)
        state.on("document-change", op)
        return () => {
            state.off("selection-change",op)
            state.off("document-change",op)
        }
    })

    // @ts-ignore
    const mousedown = (e:MouseEvent<HTMLCanvasElement>) => {
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
        set_current_root(state.get_root())
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
        let container:JSX.Element = <ContextMenu state={state}/>
        pc?.show(container,e)
    }


    return <div className={'panel center vbox'}>
        <Toolbar>
            <button onClick={()=>set_zoom_level(zoom_level+1)}>zoom in</button>
            <button onClick={()=>{set_zoom_level(zoom_level-1)}}>zoom out</button>
            <button disabled={!is_inset} onClick={()=>exit_inset()}>exit</button>
        </Toolbar>
        <div className={'canvas-wrapper grow'}>
            {/*<div className={'canvas-sizer'} style={{width:min_bounds.w+'px', height:min_bounds.h+'px'}}/>*/}
        <canvas ref={canvas}
                width={min_bounds.w+'px'}
                height={min_bounds.h+'px'}
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


