import React, {useEffect, useState} from "react";
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
