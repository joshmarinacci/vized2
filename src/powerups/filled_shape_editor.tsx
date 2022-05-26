import {FilledShape, GlobalState, Point} from "../common";
import React, {useEffect, useRef, useState} from "react";
import {PaletteColorPicker} from "./filled_border_editor";

export function FilledShapeEditor(props: { comp: FilledShape, state: GlobalState }) {
    // let patterns_canvas = useRef<HTMLCanvasElement>(null)
    //     if (patterns_canvas.current) {
    //         let can = patterns_canvas.current as HTMLCanvasElement
    //         let ctx = can.getContext('2d') as CanvasRenderingContext2D
    //         ctx.fillStyle = 'white'
    //         ctx.fillRect(0, 0, can.width, can.height)
    //         props.state.patterns.forEach((pat, i) => {
    //             if (pat instanceof Image) {
    //                 ctx.fillStyle = ctx.createPattern(pat as HTMLImageElement, 'repeat') as CanvasPattern
    //                 let pt = n2xy(i)
    //                 ctx.fillRect(pt.x, pt.y, size, size)
    //                 if (pat === props.comp.get_fill()) {
    //                     ctx.strokeStyle = 'black'
    //                     ctx.strokeRect(pt.x, pt.y, size, size)
    //                 }
    //             }
    //         })
    //     }
    // }
    return <div className={"prop-grid"}>
        <h3>Filled Shape</h3>
        <PaletteColorPicker state={props.state} color={props.comp.get_fill()} on_change={(c:any) => {
            props.comp.set_fill(c)
            props.state.dispatch("prop-change", {})
        }}/>
        {/*<canvas ref={patterns_canvas} width={w} height={size * 2}*/}
        {/*        onClick={(e) => {*/}
        {/*            let target: HTMLElement = e.target as HTMLElement*/}
        {/*            let bounds = target.getBoundingClientRect()*/}
        {/*            let pt = new Point(e.clientX - bounds.x, e.clientY - bounds.y)*/}
        {/*            let n = xy2n(pt)*/}
        {/*            if (n >= 0 && n < props.state.patterns.length) {*/}
        {/*                let color = props.state.patterns[n]*/}
        {/*                props.comp.set_fill(color)*/}
        {/*                props.state.dispatch("prop-change", {})*/}
        {/*                redraw()*/}
        {/*            }*/}
        {/*        }*/}
        {/*        }*/}
        {/*/>*/}
    </div>
}
