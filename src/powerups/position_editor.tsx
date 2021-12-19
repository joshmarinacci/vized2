import {CenterPosition, GlobalState} from "../common";
import React, {useState} from "react";
import {NumberEditor} from "../comps";

export function CenterPositionEditor(props: { comp: CenterPosition, state: GlobalState }) {
    let comp = props.comp
    const [position, set_position] = useState(comp.get_position())


    return <div className={"prop-grid"}>
        <h3>CenterPosition</h3>
        <label>x</label>
        <NumberEditor value={position.x} set_value={(val:number)=>{ comp.get_position().x = val }} state={props.state} live={true}/>
        <label>y</label>
        <NumberEditor value={position.y} set_value={(val:number)=>{ comp.get_position().y = val }} state={props.state} live={true}/>
    </div>
}
