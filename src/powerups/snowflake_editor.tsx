import {GlobalState} from "../common";
import React from "react";
import {NumberEditor} from "../comps";
import {Snowflake} from "./snowflake";

export function SnowflakeEditor(props: { comp: Snowflake, state: GlobalState }) {
    let comp = props.comp
    return <div className={"prop-grid"}>
        <h3>Snowflake</h3>
        <label>folds</label>
        <NumberEditor value={comp.fold_count()} set_value={(val:number)=>{ comp.set_fold_count(val) }} state={props.state} live={true}/>
    </div>

}
