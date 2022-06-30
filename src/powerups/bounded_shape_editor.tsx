import {BoundedShape} from "../bounded_shape";
import {GlobalState, TreeNode} from "../common";
import {NumberEditor} from "../comps";
import React from "react";

export function BoundedShapeEditor(props: { comp: BoundedShape, state: GlobalState, node:TreeNode }) {
    let rect = props.comp.get_bounds()
    return <div className={"prop-grid"}>
        <h3>Bounded Shape</h3>
        <label>x</label>
        <NumberEditor value={rect.x} set_value={(x: number) => {
            props.comp.get_bounds().x = x
        }} state={props.state} live={true} node={props.node}/>
        <label>y</label>
        <NumberEditor value={rect.y} set_value={(y: number) => {
            props.comp.get_bounds().y = y
        }} state={props.state} live={true} node={props.node}/>
        <label>w</label>
        <NumberEditor value={rect.w} set_value={(w: number) => {
            props.comp.get_bounds().w = w
        }} state={props.state} live={true} node={props.node}/>
        <label>h</label>
        <NumberEditor value={rect.h} set_value={(h: number) => {
            props.comp.get_bounds().h = h
        }} state={props.state} live={true} node={props.node}/>
    </div>
}
