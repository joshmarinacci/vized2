import {
    FilledShape,
    FilledShapeName,
    GlobalState,
    GlobalStateContext,
    Point,
    TreeNode
} from "./common";
import React, {useContext, useEffect, useRef, useState} from "react";
import {BoundedShape, BoundedShapeName} from "./bounded_shape";
import "./propsheet.css"
import {NumberEditor} from "./comps";

function BoundedShapeEditor(props: { comp: BoundedShape, state: GlobalState }) {
    let rect = props.comp.get_bounds()
    return <div className={"prop-grid"}>
        <h3>Bounded Shape</h3>
        <label>x</label>
        <NumberEditor value={rect.x} set_value={(x:number)=>{ props.comp.get_bounds().x = x }} state={props.state} live={true}/>
        <label>y</label>
        <NumberEditor value={rect.y} set_value={(x:number)=>{ props.comp.get_bounds().y = x }} state={props.state} live={true}/>
        <label>w</label>
        <NumberEditor value={rect.w} set_value={(x:number)=>{ props.comp.get_bounds().w = x }} state={props.state} live={true}/>
        <label>h</label>
        <NumberEditor value={rect.h} set_value={(x:number)=>{ props.comp.get_bounds().h = x }} state={props.state} live={true}/>
    </div>
}

function FilledShapeEditor(props: { comp: FilledShape, state: GlobalState }) {
    const [pal, set_pal] = useState({
        title:'none',
        colors:[]
    })
    const change_palette = (e:any) => {
        set_pal(props.state.palettes.find(p => p.title === e.target.value))
    }

    let canvas = useRef<HTMLCanvasElement>(null)
    let patterns_canvas = useRef<HTMLCanvasElement>(null)
    let size = 20
    let w = size*8
    let h = Math.ceil(pal.colors.length/8)*size
    let wrap = Math.floor(w / size)

    const n2xy = (n: number) => ({
        x: n % wrap * size,
        y: Math.floor(n / wrap) * 20
    })
    const xy2n = (xy: Point) => {
        let x = Math.floor(xy.x / size)
        let y = Math.floor(xy.y / size)
        return x + y * wrap
    }
    const redraw = () => {
        if (canvas.current) {
            let can = canvas.current as HTMLCanvasElement
            let ctx = can.getContext('2d') as CanvasRenderingContext2D
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, can.width, can.height)
            pal.colors.forEach((color, i) => {
                ctx.fillStyle = color
                let pt = n2xy(i)
                ctx.fillRect(pt.x, pt.y, 20, 20)
                if (color === props.comp.get_fill()) {
                    ctx.strokeStyle = 'black'
                    ctx.strokeRect(pt.x, pt.y, 20, 20)
                }
            })
        }
        if(patterns_canvas.current) {
            let can = patterns_canvas.current as HTMLCanvasElement
            let ctx = can.getContext('2d') as CanvasRenderingContext2D
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, can.width, can.height)
            props.state.patterns.forEach((pat,i) => {
                if(pat instanceof Image) {
                    ctx.fillStyle = ctx.createPattern(pat as HTMLImageElement, 'repeat') as CanvasPattern
                    let pt = n2xy(i)
                    ctx.fillRect(pt.x, pt.y, size, size)
                    if (pat === props.comp.get_fill()) {
                        ctx.strokeStyle = 'black'
                        ctx.strokeRect(pt.x, pt.y, size, size)
                    }
                }
            })
        }
    }
    useEffect(() => {
        redraw()
    })
    return <div className={"prop-grid"}>
        <h3>Filled Shape</h3>
        <select value={pal.title} onChange={change_palette}>
            {props.state.palettes.map((obj,i) => {
                return <option key={i} value={obj.title}>{obj.title}</option>
            })}
        </select>
        <canvas ref={canvas} width={w} height={h}
                onClick={(e) => {
                    let target: HTMLElement = e.target as HTMLElement
                    let bounds = target.getBoundingClientRect()
                    let pt = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
                    let n = xy2n(pt)
                    if (n >= 0 && n < pal.colors.length) {
                        let color = pal.colors[n]
                        props.comp.set_fill(color)
                        props.state.dispatch("prop-change", {})
                        redraw()
                    }
                }
                }
        />
        <canvas ref={patterns_canvas} width={w} height={size*2}
                onClick={(e) => {
                    let target: HTMLElement = e.target as HTMLElement
                    let bounds = target.getBoundingClientRect()
                    let pt = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
                    let n = xy2n(pt)
                    if (n >= 0 && n < props.state.patterns.length) {
                        let color = props.state.patterns[n]
                        props.comp.set_fill(color)
                        props.state.dispatch("prop-change", {})
                        redraw()
                    }
                }
                }
        />
    </div>
}

export function PropSheet(props: {}) {
    const state = useContext(GlobalStateContext)
    const [node, set_node] = useState<TreeNode | null>(null)
    useEffect(() => {
        let op = () => {
            if (state.selection.isEmpty()) {
                set_node(null)
            } else {
                // @ts-ignore
                set_node(state.selection.get()[0])
            }
        }
        state.on("selection-change", op)
        return () => {
            state.off("selection-change", op)
        }
    },[])
    if (!node) {
        return <div className={'panel right'}>
            nothing selected
        </div>
    }

    return <div className={'panel right'}>
        {node.components.map((comp, i) => {
            let pw = state.powerups.find(pw => pw.can_edit(comp))
            if(pw) {
                let Editor = pw.get_editor(comp,state.get_root(),state)
                return <Editor key={i} comp={comp} state={state}/>
            }
            if (comp.name === BoundedShapeName) return <BoundedShapeEditor key={i}
                                                                           comp={comp as BoundedShape}
                                                                           state={state}/>
            if (comp.name === FilledShapeName) return <FilledShapeEditor key={i}
                                                                         comp={comp as FilledShape}
                                                                         state={state}/>
            return <h4 key={comp.name}>{comp.name}</h4>
        })}
    </div>
}
