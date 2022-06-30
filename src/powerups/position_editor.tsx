import {CenterPosition, GlobalState, TreeNode} from "../common";
import React, {useState} from "react";
import {NumberEditor} from "../comps";

export function CenterPositionEditor(props: { comp: CenterPosition, state: GlobalState, node:TreeNode }) {
    let comp = props.comp
    const [position, set_position] = useState(comp.get_position())


    return <div className={"prop-grid"}>
        <h3>CenterPosition</h3>
        <label>x</label>
        <NumberEditor value={position.x} set_value={(val:number)=>{ comp.get_position().x = val }} state={props.state} live={true} node={props.node}/>
        <label>y</label>
        <NumberEditor value={position.y} set_value={(val:number)=>{ comp.get_position().y = val }} state={props.state} live={true} node={props.node}/>
    </div>
}
