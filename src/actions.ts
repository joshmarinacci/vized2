import {
    add_child_to_parent,
    FilledShapeObject,
    GlobalState,
    Point,
    Rect,
    TreeNode,
    TreeNodeImpl
} from "./common";
import {CircleShapeObject, MovableCircleObject} from "./powerups/circle_powerup";
import {TextShapeObject} from "./powerups/text_powerup";
import {BoundedShapeObject, MovableBoundedShape, ResizableRectObject} from "./bounded_shape";
import {RectShapeObject} from "./powerups/rect_powerup";
import {ImageShapeObject, ResizableImageObject} from "./powerups/image_powerup";

export interface Action {
    title: string

    fun(node: TreeNode, state: GlobalState): void
}

export const make_rectangle: Action = {
    title: "add rectangle",
    fun(node: TreeNode, state: GlobalState): void {
        let rect1 = new TreeNodeImpl()
        rect1.title = 'rect'
        rect1.components.push(new RectShapeObject())
        rect1.components.push(new BoundedShapeObject(new Rect(10, 250, 10, 10)))
        rect1.components.push(new FilledShapeObject("#ff0000"))
        rect1.components.push(new MovableBoundedShape(rect1))
        add_child_to_parent(rect1, node)
        state.dispatch('object-changed', {})
    }
}
export const make_circle: Action = {
    title: "add circle",
    fun(node: TreeNode, state: GlobalState): void {
        let circle = new TreeNodeImpl()
        circle.title = 'circle'
        circle.components.push(new CircleShapeObject(new Point(100, 100), 50))
        circle.components.push(new FilledShapeObject("#ff00ff"))
        circle.components.push(new MovableCircleObject(circle))
        add_child_to_parent(circle, node)
        state.dispatch('object-changed', {})
    }
}
export const make_text: Action = {
    title: "add text",
    fun(node: TreeNode, state: GlobalState): void {
        let text = new TreeNodeImpl() as TreeNode
        text.title = 'text1'
        text.components.push(new TextShapeObject("text", 16, "center", 'center'))
        text.components.push(new BoundedShapeObject(new Rect(50, 50, 50, 30)))
        text.components.push(new MovableBoundedShape(text))
        text.components.push(new ResizableRectObject(text))
        text.components.push(new FilledShapeObject('#000000'))
        add_child_to_parent(text, node)
        state.dispatch('object-changed', {})
    }
}

export function make_image_node(url: string): TreeNode {
    let image: TreeNode = new TreeNodeImpl()
    image.title = 'image'
    image.components.push(new ImageShapeObject(url, 1000, 1000))
    image.components.push(new BoundedShapeObject(new Rect(100, 100, 200, 200)))
    image.components.push(new MovableBoundedShape(image))
    image.components.push(new ResizableImageObject(image))
    return image
}

export const make_image: Action = {
    title: "add image",
    fun(node: TreeNode, state: GlobalState): void {
        let image = make_image_node("https://vr.josh.earth/assets/2dimages/saturnv.jpg")
        add_child_to_parent(image, node)
        state.dispatch('object-changed', {})
    }
}
export const delete_node: Action = {
    title: 'delete',
    fun(node: TreeNode, state: GlobalState): void {
        node.parent.children = node.parent.children.filter(ch => ch !== node)
        // @ts-ignore
        node.parent = null
        state.dispatch('object-changed', {})
    }
}
export const nothing: Action = {
    title: "nothing",
    fun(node: TreeNode, state: GlobalState): void {
    }
}

export function delete_selection(state: GlobalState) {
    state.selection.get().forEach(node => {
        node.parent.children = node.parent.children.filter(ch => ch !== node)
        // @ts-ignore
        node.parent = null
    })
    state.selection.clear()
    state.dispatch('object-changed', {})
    state.dispatch('selection-change', {})
}
