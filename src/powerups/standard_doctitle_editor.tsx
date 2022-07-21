import {EditorProps} from "../comps";
import {DocMarker} from "../common";
import {useEffect, useState} from "react";

export function DocTitleEditor(props: EditorProps<DocMarker>) {
    const [title, set_title] = useState(props.comp.get_title())
    useEffect(()=>{
        set_title(props.comp.get_title())
    },[props.comp])
    return <div className={"prop-grid"}>
        <h3>Document</h3>
        <label>title</label>
        <input type="text" value={title} onChange={(e)=>{
            set_title(e.target.value)
            props.comp.set_title(e.target.value)
            props.state.dispatch("prop-change", props.comp)
        }}/>
    </div>

}
