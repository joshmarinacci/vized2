import React, {useContext, useEffect, useRef, useState} from "react";
import {
    CanvasRenderSurface, DIAG_HATCH_IMAGE,
    GlobalState,
    GlobalStateContext,
    Handle,
    PageMarker,
    PageName,
    ParentDrawChildrenName,
    ParentLike,
    ParentLikeName,
    Point,
    Rect,
    TreeNode,
    Unit
} from "./common";
import {ToggleButton, Toolbar} from "./comps";
import {
    Action,
    delete_selection,
    delete_selection_action,
    duplicate,
    move_down,
    move_to_bottom,
    move_to_top,
    move_up,
    nothing,
    selection_to_group
} from "./actions";
import {PopupContext, PopupContextImpl} from "./popup";
import {
    calc_total_min_bounds,
    fillRectHole,
    find_first_page,
    find_page_for_selection,
    strokeRect
} from "./util";
import {unit_abbr} from "./units";
import {CanvasOverlay} from "./can/overlays";
import {InfoPanelOverlay} from "./can/infopanel";
import {SnapsOverlay} from "./can/snaps";
import {HandlesOverlay} from "./can/handles";
import {RulerOverlay} from "./can/ruler";
import {MouseGestureDelegate} from "./can/mouse_gesture";
import {HandleMoveDelegate} from "./can/handle_move";
import {MouseMoveDelegate} from "./can/shape_move";

export const BOUNDS_SNAP_THRESHOLD = 20
export const GRID_SNAP_SIZE = 16

function draw_node(state:GlobalState, surf:CanvasRenderSurface, node: TreeNode) {
    //draw the current node
    state.renderers.forEach((rend) => rend.render(surf, node, state))
    // don't draw children if the parent already did it
    if(node.has_component(ParentDrawChildrenName)) return
    //get transform for children
    let ctx = surf.ctx
    ctx.save()
    if(node.has_component(ParentLikeName)) {
        let trans = node.get_component(ParentLikeName) as ParentLike
        let offset = trans.get_position()
        ctx.translate(offset.x,offset.y)
    }
    node.children.forEach(ch => draw_node(state, surf, ch))
    ctx.restore()
}


function ContextMenu(props: { state: GlobalState }) {
    let pc = useContext(PopupContext) as PopupContextImpl
    let actions:Action[] = []
    if(!props.state.selection.isEmpty()) {
        actions.push(delete_selection_action)
        actions.push(duplicate)
        actions.push(move_to_bottom)
        actions.push(move_down)
        actions.push(move_up)
        actions.push(move_to_top)
    }
    if(props.state.selection.size() >= 2) {
        actions.push(selection_to_group)
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

export class CanvasSurf implements CanvasRenderSurface {
    ctx: CanvasRenderingContext2D;
    selectionEnabled: boolean;
    inset: boolean;
    unit: Unit;
    ppu: number;
    scale: number;
    translate: Point;
    constructor(ctx: CanvasRenderingContext2D, pg: PageMarker) {
        this.ctx = ctx
        this.selectionEnabled = true
        this.inset = false
        this.unit = pg.unit
        this.ppu = pg.ppu
        this.scale = 1
        this.translate = new Point(0,0)
    }

    with_unscaled(lam: (ctx: CanvasRenderingContext2D) => void) {
        this.ctx.save()
        lam(this.ctx)
        this.ctx.restore()
    }

    with_scaled(lam: (ctx: CanvasRenderingContext2D) => void) {
        this.ctx.save()
        this.ctx.scale(this.scale,this.scale)
        this.ctx.translate(this.translate.x,this.translate.y)
        this.ctx.scale(this.ppu,this.ppu)
        lam(this.ctx)
        this.ctx.restore()
    }

    transform_point(pt:Point):Point {
        return pt.multiply(this.ppu).add(this.translate).multiply(this.scale)
    }

    stroke_line(pt1: Point, pt2: Point, lineWidth: number, color: string) {
        let ctx = this.ctx
        ctx.beginPath()
        ctx.moveTo(pt1.x,pt1.y)
        ctx.lineTo(pt2.x,pt2.y)
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = color
        ctx.stroke()
    }

    fill_rect(rect: Rect, color: any) {
        this.ctx.fillStyle = color
        this.ctx.fillRect(rect.x,rect.y,rect.w,rect.h)
    }

    fill_text(text: string, position: Point, color: string) {
        this.ctx.fillStyle = color
        this.ctx.fillText(text,position.x,position.y)
    }

}

export function CanvasView(props:{}) {
    let state = useContext(GlobalStateContext)
    const [pan_offset, set_pan_offset] = useState(new Point(0,0))
    const [zoom_level, set_zoom_level] = useState(0)
    const [snap_bounds, set_snap_bounds] = useState(true)
    const [snap_grid, set_snap_grid] = useState(false)
    const scale = Math.pow(1.5,zoom_level)
    const [delegate, set_delegate] = useState<MouseGestureDelegate|null>()
    const [is_inset, set_is_inset] = useState(false)
    const [current_page, set_current_page] = useState(()=>find_first_page(state.get_root()))
    const [current_root, set_current_root] = useState(()=>find_first_page(state.get_root()))
    let canvas = useRef<HTMLCanvasElement>(null)
    let pc = useContext(PopupContext)


    // reset things when the document changes
    useEffect(()=>{
        let op = (rt:TreeNode) => {
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
    let pg = current_page.get_component(PageName) as PageMarker
    const min_bounds = calc_total_min_bounds(current_page).scale(pg.ppu).grow(SLOP)

    function toRootPoint(e: MouseEvent) {
        let target: HTMLElement = e.target as HTMLElement
        let bounds = target.getBoundingClientRect()
        let cp = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
        cp = cp.multiply(window.devicePixelRatio)
        let pt = cp.subtract(pan_offset)
        pt = pt.multiply(1/scale)
        pt = pt.add(min_bounds.position)
        pt = pt.multiply(1/pg.ppu)
        let root = current_root
        if(root.has_component(ParentLikeName)) {
            let off = (root.get_component(ParentLikeName) as ParentLike).get_position()
            pt = pt.subtract(off)
        }
        return pt
    }

    const over_handle = (e: MouseEvent) => {
        let pt = toRootPoint(e)
        return state.active_handles.find((hand:Handle) => hand.contains(pt,pg.ppu))
    }

    const over_parent = (e:MouseEvent):TreeNode|null => {
        let pt = toRootPoint(e)
        for(let ch of current_root.children) {
            if(ch.has_component(ParentLikeName)) {
                for(let pk of state.pickers) {
                    if(pk.pick_node(pt,ch)) {
                        return ch
                    }
                }
            }
        }
        return null
    }

    let canvas_style_bounds = min_bounds.scale(scale)
    let scaled_min_bounds = min_bounds.scale(scale*window.devicePixelRatio)

    function refresh() {
        if(!current_root) return
        if(!canvas.current) return
        canvas.current.style.width  = `${canvas_style_bounds.w}px`
        canvas.current.style.height = `${canvas_style_bounds.h}px`
        let pg = current_page.get_component(PageName) as PageMarker
        let can = canvas.current as HTMLCanvasElement
        let ctx = can.getContext('2d') as CanvasRenderingContext2D
        ctx.fillStyle = 'yellow'
        ctx.fillRect(0,0,can.width,can.height)

        let surf = new CanvasSurf(ctx,pg);
        surf.scale = scale
        surf.translate = new Point(-min_bounds.x,-min_bounds.y)
        ctx.save()

        ctx.save()
        ctx.scale(scale,scale)
        ctx.translate(-min_bounds.x,-min_bounds.y)
        surf.fill_rect(min_bounds,'#f0f0f0')
        surf.fill_rect(min_bounds,surf.ctx.createPattern(DIAG_HATCH_IMAGE,"repeat") as CanvasPattern)
        ctx.restore()
        draw_node(state, surf, current_page)
        ctx.restore()

        let overlays:CanvasOverlay[] = []
        overlays.push(new HandlesOverlay())
        overlays.push(new SnapsOverlay())
        overlays.push(new InfoPanelOverlay())
        overlays.push(new RulerOverlay())
        overlays.forEach(overlay => overlay.draw(state,surf,current_page))

        if(is_inset && current_root.has_component(ParentLikeName)) {
            let parent = current_root.get_component(ParentLikeName) as ParentLike
            let child_bounds = parent.get_child_bounds()
            strokeRect(ctx,child_bounds,'aqua')
            fillRectHole(ctx,min_bounds,child_bounds,'rgba(255,0,0,0.2)')
        }
        {
            ctx.save()
            ctx.translate(-10,-100)
            ctx.fillStyle = 'white'
            ctx.scale(1,1)
            ctx.font = '12pt sans-serif'
            ctx.fillRect(0,0,400,30)
            ctx.fillStyle = 'black'
            ctx.fillText(`z${zoom_level}=s${scale} unit=${unit_abbr(pg.unit)} ppu=${pg.ppu}`,5,20)
            ctx.restore()
        }
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
            del = new MouseMoveDelegate(state,snap_bounds, snap_grid, pg.ppu)
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
        let g = over_parent(e)
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


    return <div className={'panel center vbox'}>
        <Toolbar>
            <button onClick={()=>set_zoom_level(zoom_level+1)}>zoom in</button>
            <label>{(scale*100).toFixed(0)}</label>
            <button onClick={()=>{set_zoom_level(zoom_level-1)}}>zoom out</button>
            <button disabled={!is_inset} onClick={()=>exit_inset()}>exit</button>
            <ToggleButton selected={snap_bounds} onClick={()=>set_snap_bounds(!snap_bounds)}>snap bounds</ToggleButton>
            <ToggleButton selected={snap_grid} onClick={()=>set_snap_grid(!snap_grid)}>snap grid</ToggleButton>
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


