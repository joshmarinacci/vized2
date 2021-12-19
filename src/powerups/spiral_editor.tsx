import {GlobalState} from "../common";
import React, {useState} from "react";
import {SpiralShapeObject} from "./spiral";
import {NumberEditor} from "../comps";

export function SpiralEditor(props: { comp: SpiralShapeObject, state: GlobalState }) {
    let comp = props.comp
    const [radius, set_radius] = useState(comp.get_radius())


    return <div className={"prop-grid"}>
        <h3>Spiral Shape</h3>
        <label>radius</label>
        <NumberEditor value={radius} set_value={(val:number)=>{ comp.set_radius(val) }} state={props.state} live={true}/>
        <label>wrap</label>
        <NumberEditor value={comp.get_wrap()} set_value={(val:number)=>{ comp.set_wrap(val) }} state={props.state} live={true}/>
    </div>
}
