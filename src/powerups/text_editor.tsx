import {TextShapeObject} from "./text_powerup";
import {GlobalState} from "../common";
import React, {useState} from "react";
import {NumberEditor} from "../comps";

export function TextShapeEditor(props: { comp: TextShapeObject, state: GlobalState }) {
    const [content, set_content] = useState(props.comp.get_content())
    return <div className={'prop-grid'}>
        <h3>Text</h3>
        <label>content</label>
        <input type={"text"} value={content} onChange={(e) => {
            set_content(e.target.value)
        }}
               onBlur={()=>{
                   props.comp.set_content(content)
                   props.state.dispatch("prop-change", props.comp)
               }}/>

        <label>font size</label>
        <NumberEditor value={props.comp.get_fontsize()} set_value={(v:number)=>props.comp.set_fontsize(v)} state={props.state} live={true}/>
    </div>
}
