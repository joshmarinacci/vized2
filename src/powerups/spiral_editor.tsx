import {GlobalState} from "../common";
import React from "react";
import {SpiralShapeObject} from "./spiral";

export function SpiralEditor(props: { comp: SpiralShapeObject, state: GlobalState }) {
    return <div className={"prop-grid"}>
        <h3>Spiral Shape</h3>
        <label>x</label>
    </div>
}
