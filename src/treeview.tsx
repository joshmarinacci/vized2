import {GlobalState, TreeNode} from "./common";
import React, {useEffect, useState} from "react";

function TreeItem(props: { node: TreeNode, state: GlobalState }) {
    let klass = "tree-item"
    if (props.state.selection.has(props.node)) {
        klass += " selected"
    }
    return <li className={klass} onClick={() => {
        console.log("selected an item")
        props.state.selection.set([props.node])
        props.state.dispatch('selection-change', {})
    }}>
        {props.node.title}
        {/*{props.node.id}*/}
    </li>
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
        {props.root.id}
        <ul className={'tree-view'}>
            {props.root.children.map((ch, i) => {
                return <TreeItem key={i} node={ch} state={props.state}/>
            })}
        </ul>
    </div>
}
