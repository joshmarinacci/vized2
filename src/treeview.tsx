import {GlobalState, TreeNode} from "./common";
import React, {useEffect, useState} from "react";
import {GroupShapeName, GroupShapeObject} from "./powerups/group_powerup";


function TreeParentItem(props: { node: TreeNode, state:GlobalState }) {
    let klass = "tree-parent"
    if (props.state.selection.has(props.node)) {
        klass += " selected"
    }
    const on_click = () => {
        props.state.selection.set([props.node])
        props.state.dispatch('selection-change', {})
    }
    return <div className={klass}>
        <div className={"tree-item-info"} onClick={on_click}>{props.node.title}</div>
        <ul className={'tree-children'}>
            {props.node.children.map((ch, i) => {
                return <TreeParentItem key={i} node={ch} state={props.state}/>
            })}
        </ul>
    </div>
}

export function TreeView(props: { root: TreeNode, state: GlobalState }) {
    const [count, set_count] = useState(0)
    useEffect(() => {
        const op = () => {
            set_count(count + 1)
        }
        props.state.on("selection-change", op)
        return () => {
            props.state.off("selection-change", op)
        }
    })
    return <div className={'panel left'}>
        <TreeParentItem node={props.root} state={props.state}/>
    </div>
}
