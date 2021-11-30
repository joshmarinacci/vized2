import {
    add_child_to_parent, DocName,
    FilledShapeObject,
    GlobalState,
    PageName, Point,
    Rect,
    TreeNode,
    TreeNodeImpl
} from "./common";
import React, {MouseEventHandler, useContext, useEffect, useState} from "react";
import {GroupShapeName} from "./powerups/group_powerup";
import {PopupContext, PopupContextImpl} from "./popup";
import {RectShapeObject} from "./powerups/rect_powerup";
import {BoundedShapeObject, MovableBoundedShape, ResizableRectObject} from "./bounded_shape";
import {CircleShapeObject, MovableCircleObject} from "./powerups/circle_powerup";
import {ImageShapeObject, ResizableImageObject} from "./powerups/image_powerup";
import {TextShapeObject} from "./powerups/text_powerup";

interface Action {
    title:string
    fun(node:TreeNode, state:GlobalState):void
}

const make_rectangle:Action = {
    title: "add rectangle",
    fun(node: TreeNode, state: GlobalState): void {
        let rect1 = new TreeNodeImpl()
        rect1.title = 'rect'
        rect1.components.push(new RectShapeObject())
        rect1.components.push(new BoundedShapeObject(new Rect(10, 250, 10, 10)))
        rect1.components.push(new FilledShapeObject("#ff0000"))
        rect1.components.push(new MovableBoundedShape(rect1))
        add_child_to_parent(rect1, node)
        state.dispatch('object-changed',{})
    }
}

const make_circle:Action = {
    title: "add circle",
    fun(node: TreeNode, state: GlobalState): void {
        let circle = new TreeNodeImpl()
        circle.title = 'circle'
        circle.components.push(new CircleShapeObject(new Point(100,100),50))
        circle.components.push(new FilledShapeObject("#ff00ff"))
        circle.components.push(new MovableCircleObject(circle))
        add_child_to_parent(circle, node)
        state.dispatch('object-changed',{})
    }
}

const make_text:Action = {
    title: "add text",
    fun(node: TreeNode, state: GlobalState): void {
        let text = new TreeNodeImpl() as TreeNode
        text.title = 'text1'
        text.components.push(new TextShapeObject("text", 16, "center",'center'))
        text.components.push(new BoundedShapeObject(new Rect(50,50,50,30)))
        text.components.push(new MovableBoundedShape(text))
        text.components.push(new ResizableRectObject(text))
        text.components.push(new FilledShapeObject('#000000'))
        add_child_to_parent(text,node)
        state.dispatch('object-changed',{})
    }
}

export function make_image_node(url:string):TreeNode {
    let image:TreeNode = new TreeNodeImpl()
    image.title = 'image'
    image.components.push(new ImageShapeObject(url,1000,1000))
    image.components.push(new BoundedShapeObject(new Rect(100,100,200,200)))
    image.components.push(new MovableBoundedShape(image))
    image.components.push(new ResizableImageObject(image))
    return image
}

const make_image:Action = {
    title: "add image",
    fun(node: TreeNode, state: GlobalState): void {
        let image = make_image_node("https://vr.josh.earth/assets/2dimages/saturnv.jpg")
        add_child_to_parent(image,node)
        state.dispatch('object-changed',{})
    }
}

const delete_node:Action = {
    title:'delete',
    fun(node: TreeNode, state: GlobalState): void {
        node.parent.children = node.parent.children.filter(ch => ch !== node)
        // @ts-ignore
        node.parent = null
        state.dispatch('object-changed',{})
    }
}

const nothing:Action = {
    title: "nothing",
    fun(node: TreeNode, state: GlobalState): void {
    }
}

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
