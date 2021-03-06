import {TextShapeObject} from "./text_powerup";
import React, {useEffect, useState} from "react";
import {EditorProps, NumberEditor} from "../comps";

export function TextShapeEditor(props: EditorProps<TextShapeObject>) {
    const [content, set_content] = useState(props.comp.get_content())
    const [halign, set_halign] = useState(props.comp.get_halign())
    const [valign, set_valign] = useState(props.comp.get_valign())
    const [family, set_family] = useState(props.comp.get_fontfamily())

    useEffect(()=>{
        set_halign(props.comp.get_halign())
        set_valign(props.comp.get_valign())
        set_content(props.comp.get_content())
        set_family(props.comp.get_fontfamily())
    },[props.comp])

    return <div className={'prop-grid'}>
        <h3>Text</h3>
        <label>content</label>
        <textarea value={content} onChange={(e) => {
            set_content(e.target.value)
            props.comp.set_content(e.target.value)
            props.state.dispatch("prop-change", props.comp)
        }}/>

        <label>font size</label>
        <NumberEditor value={props.comp.get_fontsize()} set_value={(v:number)=>props.comp.set_fontsize(v)} state={props.state} live={true} node={props.node}/>
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

        <label>Font Family</label>
        <select value={family} onChange={e=>{
            let fam = e.target.value
            set_family(fam)
            props.comp.set_fontfamily(fam)
            if(!document.fonts.check(`16px ${fam}`)) {
                document.fonts.load(`16px ${fam}`).then(()=>{
                    props.state.dispatch("prop-change", props.comp)
                })
            } else {
                props.state.dispatch("prop-change", props.comp)
            }
        }}>
            {props.state.fonts.map(fd => {
                return <option key={fd.name}>{fd.name}</option>
            })
            })

        </select>
    </div>
}
