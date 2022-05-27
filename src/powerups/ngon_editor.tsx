import {SpiralShapeObject} from "./spiral";
import {GlobalState} from "../common";
import {NumberEditor} from "../comps";
import React from "react";
import {NGonShapeObject} from "./ngon";

export function NGonEditor(props: { comp: NGonShapeObject, state: GlobalState }) {
    return <div className={"prop-grid"}>
        <h3>NGon Shape</h3>
        <label>sides</label>
        <NumberEditor value={props.comp.get_sides()} set_value={(val:number)=>{ props.comp.set_sides(val) }} state={props.state} live={true}/>
    </div>
}
