import React, {ReactNode, useEffect, useState} from "react";
import {GlobalState} from "./common";

export function Toolbar(props: { children: any }) {
    return <div className={'toolbar'}>{props.children}</div>
}

export function NumberEditor(props: { value: number, set_value: any, state: GlobalState, live: boolean }) {
    const [lvalue, set_lvalue] = useState(props.value)
    useEffect(() => {
        set_lvalue(props.value)
    }, [props.value])

    return <input type={"number"} value={lvalue} onChange={(e) => {
        set_lvalue(parseFloat(e.target.value))
        if (props.live) {
            props.set_value(parseFloat(e.target.value))
            props.state.dispatch("prop-change", {})
        }
    }}
                  onBlur={() => {
                      props.set_value(lvalue)
                      props.state.dispatch("prop-change", {})
                  }}/>

}

export function ToggleButton(props: { onClick: () => void, children: ReactNode, selected:boolean }) {
    let style = {
        backgroundColor:props.selected?"aquamarine":"gray",
        borderRadius:'0.25rem',
        border: '1px solid #333333',
        margin: '0.125rem 0.25rem',
    }
    return <button style={style} onClick={props.onClick}>{props.children}</button>
}

