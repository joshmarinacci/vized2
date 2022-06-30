import React, {ReactNode, useEffect, useState} from "react";
import {GlobalState, PageMarker, PageName, TreeNode, Unit} from "./common";
import {convert_unit, unit_abbr} from "./units";
import {find_page_for_node} from "./util";

export function Toolbar(props: { children: any }) {
    return <div className={'toolbar'}>{props.children}</div>
}

type UnitParseResult = {
    raw:string,
    valid:boolean,
    value:number,
    unit:Unit
}

function parse_raw(str_value:string):UnitParseResult {
    // console.log("raw parsing",str_value)
    let value = parseFloat(str_value)
    // console.log("parsed",value)
    if(Number.isNaN(value)) {
        return {
            raw:str_value,
            valid:false,
            value:0,
            unit:Unit.Pixels,
        }
    }
    // console.log("real number is",value)
    let unit = Unit.Pixels
    if(str_value.endsWith('px')) {
        unit = Unit.Pixels
    }
    if(str_value.endsWith('cm')) {
        unit = Unit.Centimeter
    }
    // console.log("final unit is",unit)
    return {
        raw:str_value,
        valid:true,
        value:value,
        unit:unit,
    }
}

export function NumberEditor(props: {
    value: number,
    set_value: any,
    state: GlobalState,
    live: boolean,
    node:TreeNode,
    min?:number,
}) {
    const [num_value, set_num_value] = useState(props.value)
    const [str_value, set_str_value] = useState<any>(props.value)
    const [valid, set_valid] = useState(true)
    const [from_unit, set_from_unit] = useState(Unit.Pixels)
    useEffect(() => set_str_value(props.value), [props.value])
    let page = find_page_for_node(props.node);
    let target_unit = page?(page.get_component(PageName) as PageMarker).unit:Unit.Pixels
    console.log("target unit",target_unit,from_unit)

    return <input type={"text"} value={str_value}
                  onChange={(e) => {
                      // console.log("---\nraw value", e.target.value)
                      // console.log("current valid state",valid)
                      let res = parse_raw(e.target.value)
                      set_str_value(res.raw)
                      set_valid(res.valid)
                      if(res.valid) {
                          res.value = convert_unit(res.value,res.unit,target_unit)
                          set_num_value(res.value)
                          set_from_unit(res.unit)
                      }
                      if(res.valid && props.live) {
                          // console.log("parsed unit is",res.unit)
                          // console.log("page unit is",target_unit)
                          props.set_value(res.value)
                          props.state.dispatch("prop-change", {})
                      }
                  }}
                  onBlur={() => {
                      if(valid) {
                          // console.log("valid blur update")
                          set_str_value(num_value.toFixed(2) + " " +unit_abbr(target_unit))
                          props.set_value(num_value)
                          props.state.dispatch("prop-change", {})
                      } else {
                          // console.log("invalid blur update")
                          set_str_value(props.value)
                      }
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

