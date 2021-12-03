import {TextShapeObject} from "./text_powerup";
import {GlobalState} from "../common";
import React, {useEffect, useState} from "react";
import {NumberEditor} from "../comps";

export function TextShapeEditor(props: { comp: TextShapeObject, state: GlobalState }) {
    const [content, set_content] = useState(props.comp.get_content())
    const [halign, set_halign] = useState(props.comp.get_halign())
    const [valign, set_valign] = useState(props.comp.get_valign())

    useEffect(()=>{
        set_halign(props.comp.get_halign())
        set_valign(props.comp.get_valign())
    },[props.comp])

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
        <label>H Align</label>
        <select value={halign} onChange={e => {
            set_halign(e.target.value)
            props.comp.set_halign(e.target.value)
            props.state.dispatch("prop-change", props.comp)
        }}>
            <option>left</option>
            <option>center</option>
            <option>right</option>
        </select>
        <label>V Align</label>
        <select value={valign} onChange={e => {
            set_valign(e.target.value)
            props.comp.set_valign(e.target.value)
            props.state.dispatch("prop-change", props.comp)
        }}>
            <option>top</option>
            <option>center</option>
            <option>bottom</option>
        </select>
    </div>
}
