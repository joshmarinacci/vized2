import {GlobalState, PageName, TreeNode} from "./common";
import React, {MouseEventHandler, useContext, useEffect, useState} from "react";
import {GroupShapeName} from "./powerups/group_powerup";
import {PopupContext, PopupContextImpl} from "./popup";


function AddChildMenu(props: { node: TreeNode }) {
    let pc = useContext(PopupContext) as PopupContextImpl
    let actions = []
    if(props.node.has_component(PageName) || props.node.has_component(GroupShapeName)) {
        actions.push({title:'rectangle'})
        actions.push({title:'rectangle'})
    }
    if(actions.length === 0) {
        actions.push({title:'nothing'})
    }
    return <ul className={'menu'}>
        {actions.map((act,i)=>{
            return <li className={'menu-item'} key={i} onClick={()=>{
                console.log("doing action",act.title)
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
        let container:JSX.Element = <AddChildMenu node={props.node}/>
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
        return () => {
            props.state.off("selection-change", op)
        }
    })
    return <div className={'panel left'}>
        <TreeParentItem node={props.root} state={props.state}/>
    </div>
}
