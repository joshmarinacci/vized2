import {FilledShape, FilledShapeName, GlobalState, Point, TreeNode} from "./common";
import React, {useEffect, useRef, useState} from "react";
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
    let canvas = useRef<HTMLCanvasElement>(null)
    let size = 20
    let w = 100
    let wrap = Math.floor(w / size)
    const colors = [
        '#ff00ff', '#ff0000',
        '#ffff00', '#00ff00',
        '#00ffff', '#0000ff',
        '#ffffff', '#000000']

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
            colors.forEach((color, i) => {
                ctx.fillStyle = color
                let pt = n2xy(i)
                ctx.fillRect(pt.x, pt.y, 20, 20)
                if (color === props.comp.get_color()) {
                    ctx.strokeStyle = 'black'
                    ctx.strokeRect(pt.x, pt.y, 20, 20)
                }
            })
        }
    }
    useEffect(() => {
        redraw()
    })
    return <div className={"prop-grid"}>
        <h3>Filled Shape</h3>
        <canvas ref={canvas} width={100} height={60}
                onClick={(e) => {
                    let target: HTMLElement = e.target as HTMLElement
                    let bounds = target.getBoundingClientRect()
                    let pt = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
                    let n = xy2n(pt)
                    if (n >= 0 && n < colors.length) {
                        let color = colors[n]
                        props.comp.set_color(color)
                        props.state.dispatch("prop-change", {})
                        redraw()
                    }
                }
                }
        />
    </div>
}

export function PropSheet(props: { root: TreeNode, state: GlobalState }) {
    const [node, set_node] = useState<TreeNode | null>(null)
    useEffect(() => {
        let op = () => {
            if (props.state.selection.isEmpty()) {
                set_node(null)
            } else {
                // @ts-ignore
                set_node(props.state.selection.get()[0])
            }
        }
        props.state.on("selection-change", op)
        return () => {
            props.state.off("selection-change", op)
        }
    },[])
    if (!node) {
        return <div className={'panel right'}>
            nothing selected
        </div>
    }

    return <div className={'panel right'}>
        {node.components.map((comp, i) => {
            let pw = props.state.powerups.find(pw => pw.can_edit(comp))
            if(pw) {
                let Editor = pw.get_editor(comp,props.root,props.state)
                return <Editor key={i} comp={comp} state={props.state}/>
            }
            if (comp.name === BoundedShapeName) return <BoundedShapeEditor key={i}
                                                                           comp={comp as BoundedShape}
                                                                           state={props.state}/>
            if (comp.name === FilledShapeName) return <FilledShapeEditor key={i}
                                                                         comp={comp as FilledShape}
                                                                         state={props.state}/>
            return null
        })}
    </div>
}
