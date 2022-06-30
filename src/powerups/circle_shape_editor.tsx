import {GlobalState, PageMarker, PageName, TreeNode, Unit} from "../common";
import React from "react";
import {NumberEditor} from "../comps";
import {CircleLikeShape} from "./circle";
import {find_page_for_node} from "../util";

export function CircleLikeEditor(props: { comp: CircleLikeShape, state: GlobalState, node:TreeNode }) {
    let page = find_page_for_node(props.node);
    let unit = Unit.Pixels
    if(page) {
        unit = (page.get_component(PageName) as PageMarker).unit
    }
    return <div className={"prop-grid"}>
        <h3>Radius</h3>
        <label>radius</label>
        <NumberEditor value={props.comp.get_radius()} set_value={(val:number)=> props.comp.set_radius(val) } state={props.state} live={true} unit={unit}/>
    </div>
}
