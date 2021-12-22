import {GlobalState} from "../common";
import React, {useState} from "react";
import {NumberEditor} from "../comps";
import {Snowflake, SnowflakeMode} from "./snowflake";

export function SnowflakeEditor(props: { comp: Snowflake, state: GlobalState }) {
    const [mode, set_mode] = useState(props.comp.get_mode())
    let comp = props.comp
    return <div className={"prop-grid"}>
        <h3>Snowflake</h3>
        <label>folds</label>
        <NumberEditor value={comp.fold_count()} set_value={(val:number)=>{ comp.set_fold_count(val) }} state={props.state} live={true}/>
        <label>mirror mode</label>
        <select value={mode} onChange={e => {
            set_mode(e.target.value as SnowflakeMode)
            props.comp.set_mode(e.target.value as SnowflakeMode)
            props.state.dispatch("prop-change", props.comp)
        }}>
            <option>normal</option>
            <option>clipped</option>
            <option>mirror</option>
            <option>mirror-clipped</option>
        </select>

    </div>

}
