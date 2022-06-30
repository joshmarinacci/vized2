import {BASIC_COLORS, BorderedShape, GlobalState, Point, TreeNode} from "../common";
import React, {useEffect, useRef, useState} from "react";
import {EditorProps, NumberEditor} from "../comps";

export function PaletteColorPicker(props: { state:GlobalState, color:any, on_change:any}) {
    const [pal, set_pal] = useState(BASIC_COLORS)
    const change_palette = (e: any) => {
        set_pal(props.state.palettes.find(p => p.title === e.target.value))
    }
    let canvas = useRef<HTMLCanvasElement>(null)
    let size = 20
    let w = size * 8
    let h = Math.ceil(pal.colors.length / 8) * size
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
                if (color === props.color) {
                    ctx.strokeStyle = 'black'
                    ctx.strokeRect(pt.x, pt.y, 20, 20)
                }
            })
        }
    }
    useEffect(() => {
        redraw()
    })
    return <div>
        <select value={pal.title} onChange={change_palette}>
            {props.state.palettes.map((obj, i) => {
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
                        // props.comp.set_border_fill(color)
                        props.on_change(color)
                        redraw()
                    }
                }
                }
        />
    </div>
}

export function BorderedShapeEditor(props: EditorProps<BorderedShape>) {
    return <div className={"prop-grid"}>
        <h3>Bordered Shape</h3>
        <label>border width</label>
        <NumberEditor value={props.comp.get_border_width()}
                      set_value={(v: number) => props.comp.set_border_width(v)}
                      state={props.state}
                      live={true}
                      min={0}
                      node={props.node}
        />

        <PaletteColorPicker state={props.state} color={props.comp.get_border_fill()} on_change={(c:any)=>{
            props.comp.set_border_fill(c)
            props.state.dispatch("prop-change", {})
        }}/>
    </div>
}
