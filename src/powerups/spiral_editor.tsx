import React from "react";
import {SpiralShapeObject} from "./spiral";
import {EditorProps, NumberEditor} from "../comps";

export function SpiralEditor(props: EditorProps<SpiralShapeObject>) {
    return <div className={"prop-grid"}>
        <h3>Spiral Shape</h3>
        <label>wrap</label>
        <NumberEditor value={props.comp.get_wrap()} set_value={(val:number)=>{ props.comp.set_wrap(val) }} state={props.state} live={true} node={props.node}/>
    </div>
}
