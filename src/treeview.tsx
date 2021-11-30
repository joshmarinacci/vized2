import {DocName, GlobalState, PageName, TreeNode} from "./common";
import React, {MouseEventHandler, useContext, useEffect, useState} from "react";
import {GroupShapeName} from "./powerups/group_powerup";
import {PopupContext, PopupContextImpl} from "./popup";
import {
    Action,
    delete_node,
    make_circle,
    make_image,
    make_rectangle,
    make_text,
    nothing
} from "./actions";

function AddChildMenu(props: { node: TreeNode, state:GlobalState }) {
    let pc = useContext(PopupContext) as PopupContextImpl
    let actions:Action[] = []
    if(props.node.has_component(PageName) || props.node.has_component(GroupShapeName)) {
        actions.push(make_rectangle)
        actions.push(make_circle)
        actions.push(make_text)
        actions.push(make_image)
    }
    if(!props.node.has_component(DocName)) {
        actions.push(delete_node)
    }
    if(actions.length === 0) actions.push(nothing)
    return <ul className={'menu'}>
        {actions.map((act,i)=>{
            return <li className={'menu-item'} key={i} onClick={()=>{
                act.fun(props.node,props.state)
                pc.hide()
            }
            }>{act.title}</li>
        })}
    </ul>
}

function TreeParentItem(props: { node: TreeNode, state:GlobalState }) {
    let klass = "tree-parent"
    if (props.state.selection.has(props.node)) {
        klass += " selected"
    }
    let pc = useContext(PopupContext)
    const on_click = () => {
        props.state.selection.set([props.node])
        props.state.dispatch('selection-change', {})
    }
    const show_menu:MouseEventHandler<HTMLDivElement> = (e) => {
        let container:JSX.Element = <AddChildMenu node={props.node} state={props.state}/>
        pc?.show(container,e)
    }
    return <div className={klass}>
        <div className={"tree-item-info"} onClick={on_click} onContextMenu={show_menu}>{props.node.title}</div>
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
        props.state.on("object-changed",op)
        return () => {
            props.state.off("selection-change", op)
            props.state.off("object-changed",op)
        }
    })
    return <div className={'panel left'}>
        <TreeParentItem node={props.root} state={props.state}/>
    </div>
}
