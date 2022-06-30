import React from "react";
import {EditorProps, NumberEditor} from "../comps";
import {CircleLikeShape} from "./circle";

export function CircleLikeEditor(props: EditorProps<CircleLikeShape>) {
    return <div className={"prop-grid"}>
        <h3>Radius</h3>
        <label>radius</label>
        <NumberEditor value={props.comp.get_radius()} set_value={(val:number)=> props.comp.set_radius(val) } state={props.state} live={true} node={props.node}/>
    </div>
}
