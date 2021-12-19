import {GlobalStateContext, TreeNode, TreeNodeImpl} from "./common";
import React, {useContext, useEffect, useState} from "react";
import "./propsheet.css"

export function PropSheet(props: {}) {
    const state = useContext(GlobalStateContext)
    const [node, set_node] = useState<TreeNode | null>(null)
    useEffect(() => {
        let op = () => {
            if (state.selection.isEmpty()) {
                set_node(null)
            } else {
                // @ts-ignore
                set_node(state.selection.get()[0])
            }
        }
        state.on("selection-change", op)
        return () => {
            state.off("selection-change", op)
        }
    },[])
    if (!node) {
        return <div className={'panel right'}>
            nothing selected
        </div>
    }

    function find_editor_for_comptype(name:string):any|null {
        let pw = state.powerups.find(pw => pw.can_edit_by_name(name))
        if(pw) return pw.get_editor_by_name(name,state)
        return null
    }
    let comp_names = (node as TreeNodeImpl).all_component_names()
    let editors = comp_names.map(name => ({name:name, ed:find_editor_for_comptype(name)}))
        .filter(res => res.ed!==null)

    return <div className={'panel right'}>
        {editors.map((obj:any,i) => {
            let name = obj.name
            let comp = node.get_component(name)
            let Editor = obj.ed
            return <Editor key={i} comp={comp} state={state}/>
        })}
        {/*    return <h4 key={comp.name}>{comp.name}</h4>*/}
    </div>
}
