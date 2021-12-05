import {GlobalState} from "../common";
import React, {useState} from "react";
import {SpiralShapeObject} from "./spiral";
import {NumberEditor} from "../comps";

export function SpiralEditor(props: { comp: SpiralShapeObject, state: GlobalState }) {
    const [position, set_position] = useState(props.comp.get_position())
    const [radius, set_radius] = useState(props.comp.get_radius())


    return <div className={"prop-grid"}>
        <h3>Spiral Shape</h3>
        <label>x</label>
        <NumberEditor value={position.x} set_value={(val:number)=>{ props.comp.get_position().x = val }} state={props.state} live={true}/>
        <label>y</label>
        <NumberEditor value={position.y} set_value={(val:number)=>{ props.comp.get_position().y = val }} state={props.state} live={true}/>
        <label>radius</label>
        <NumberEditor value={radius} set_value={(val:number)=>{ props.comp.set_radius(val) }} state={props.state} live={true}/>
        <label>wrap</label>
        <NumberEditor value={props.comp.get_wrap()} set_value={(val:number)=>{ props.comp.set_wrap(val) }} state={props.state} live={true}/>
    </div>
}
