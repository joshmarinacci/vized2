import {BoundedShape} from "../bounded_shape";
import {GlobalState} from "../common";
import {NumberEditor} from "../comps";
import React from "react";

export function BoundedShapeEditor(props: { comp: BoundedShape, state: GlobalState }) {
    let rect = props.comp.get_bounds()
    return <div className={"prop-grid"}>
        <h3>Bounded Shape</h3>
        <label>x</label>
        <NumberEditor value={rect.x} set_value={(x: number) => {
            props.comp.get_bounds().x = x
        }} state={props.state} live={true}/>
        <label>y</label>
        <NumberEditor value={rect.y} set_value={(y: number) => {
            props.comp.get_bounds().y = y
        }} state={props.state} live={true}/>
        <label>w</label>
        <NumberEditor value={rect.w} set_value={(w: number) => {
            props.comp.get_bounds().w = w
        }} state={props.state} live={true}/>
        <label>h</label>
        <NumberEditor value={rect.h} set_value={(h: number) => {
            props.comp.get_bounds().h = h
        }} state={props.state} live={true}/>
    </div>
}
