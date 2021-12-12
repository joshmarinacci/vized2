import {DocName, PageName, Rect, SelectionSystem, TreeNode} from "./common";
import {BoundedShape, BoundedShapeName} from "./bounded_shape";

export function find_first_page(root: TreeNode): TreeNode {
    if (root.has_component(DocName)) {
        if (root.has_component(PageName)) return root
        let pg = root.children.find(ch => ch.has_component(PageName))
        if (!pg) throw new Error("couldn't find a page child")
        return pg
    } else {
        throw new Error("root isn't a doc!")
    }
}

export function find_page_for_node(node: TreeNode): TreeNode | null {
    if (node.has_component(PageName)) {
        return node
    }
    if (node.parent !== null) {
        return find_page_for_node(node.parent)
    }
    return null
}

export function find_page_for_selection(selection: SelectionSystem): TreeNode | null {
    if (selection.isEmpty()) return null
    let node = selection.get()[0]
    if (!node.parent) return null
    return find_page_for_node(node)
}

export function fillRectHole(ctx: CanvasRenderingContext2D, slop_bounds: Rect, child_bounds: Rect, style: string) {
    ctx.fillStyle = style//'rgba(255,0,0,0.5)'
    let y1 = slop_bounds.y
    let y2 = child_bounds.y
    let y3 = child_bounds.y2
    let y4 = slop_bounds.y2
    let x1 = slop_bounds.x
    let x2 = child_bounds.x
    let x3 = child_bounds.x2
    let x4 = slop_bounds.x2
    ctx.fillRect(x1, y1, slop_bounds.w, y2 - y1)
    ctx.fillRect(x1, y2, x2 - x1, y3 - y2)
    ctx.fillRect(x3, y2, x4 - x3, y3 - y2)
    ctx.fillRect(x1, y3, slop_bounds.w, y4 - y3)
}

export function strokeRect(ctx: CanvasRenderingContext2D, child_bounds: Rect, style: string) {
    ctx.strokeStyle = style
    ctx.strokeRect(child_bounds.x, child_bounds.y, child_bounds.w, child_bounds.h)
}

export function fillRect(ctx: CanvasRenderingContext2D, rect: Rect, style: any) {
    ctx.fillStyle = style
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
}

/** returns union of bouds of all children. smallest rect that can contain all children */
function calc_child_bounds(node: TreeNode): Rect {
    let rect = new Rect(0, 0, 0, 0).makeEmpty()
    node.children.forEach(ch => {
        if (ch.has_component(BoundedShapeName)) {
            let bds = ch.get_component(BoundedShapeName) as BoundedShape
            rect = rect.add(bds.get_bounds())
        }
    })
    return rect
}

export function calc_total_min_bounds(current_page: TreeNode) {
    let child_bounds: Rect = calc_child_bounds(current_page)
    let page_bounds: Rect = (current_page.get_component(BoundedShapeName) as BoundedShape).get_bounds()
    return page_bounds.add(child_bounds)
}
