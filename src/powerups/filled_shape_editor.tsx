import {FilledShape, GlobalState, Point} from "../common";
import React, {useEffect, useRef, useState} from "react";

export function FilledShapeEditor(props: { comp: FilledShape, state: GlobalState }) {
    const [pal, set_pal] = useState({
        title: 'none',
        colors: ["red", "green", "blue"]
    })
    const change_palette = (e: any) => {
        set_pal(props.state.palettes.find(p => p.title === e.target.value))
    }

    let canvas = useRef<HTMLCanvasElement>(null)
    let patterns_canvas = useRef<HTMLCanvasElement>(null)
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
                if (color === props.comp.get_fill()) {
                    ctx.strokeStyle = 'black'
                    ctx.strokeRect(pt.x, pt.y, 20, 20)
                }
            })
        }
        if (patterns_canvas.current) {
            let can = patterns_canvas.current as HTMLCanvasElement
            let ctx = can.getContext('2d') as CanvasRenderingContext2D
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, can.width, can.height)
            props.state.patterns.forEach((pat, i) => {
                if (pat instanceof Image) {
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
                        props.comp.set_fill(color)
                        props.state.dispatch("prop-change", {})
                        redraw()
                    }
                }
                }
        />
        <canvas ref={patterns_canvas} width={w} height={size * 2}
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
