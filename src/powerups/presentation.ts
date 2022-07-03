import {
    add_child_to_parent,
    DefaultPowerup,
    DocMarker,
    DocName,
    FilledShapeObject,
    GlobalState,
    PageMarker,
    Rect,
    TreeNode,
    TreeNodeImpl,
    Unit
} from "../common";
import {Action} from "../actions";
import {BoundedShapeObject, MovableBoundedShape, ResizableRectObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";
import {TextShapeObject} from "./text_powerup";

function make_empty_page():TreeNode {
    let page1 = new TreeNodeImpl()
    page1.title = 'empty page'
    page1.add_component(new PageMarker())
    page1.add_component(new BoundedShapeObject(new Rect(0, 0, 16*40, 9*40)))
    page1.add_component(new PDFExportBounds(Unit.Inch, 1 / 100))
    page1.add_component(new RectShapeObject())
    page1.add_component(new FilledShapeObject('white'))
    return page1
}

function make_title_page():TreeNode {
    let page1 = make_empty_page()
    page1.title = 'title page'
    let text1 = new TreeNodeImpl()
    text1.title = "title"
    let ts = new TextShapeObject("Title Here", 40, "center", 'center')
    ts.set_fontfamily('Oswald')
    text1.add_component(ts)
    text1.add_component(new BoundedShapeObject(new Rect(105, 122, 430, 116)))
    text1.add_component(new MovableBoundedShape(text1))
    text1.add_component(new ResizableRectObject(text1))
    text1.add_component(new FilledShapeObject('#000000'))
    add_child_to_parent(text1, page1)
    return page1
}

function make_list_page():TreeNode {
    let page1 = make_empty_page()
    page1.title = 'list page'

    let title = new TreeNodeImpl()
    title.title = "title"
    let ts = new TextShapeObject("List Title Here", 25, "left", 'bottom')
    ts.set_fontfamily('Oswald')
    title.add_component(ts)
    title.add_component(new BoundedShapeObject(new Rect(20, 20, 600, 35)))
    title.add_component(new MovableBoundedShape(title))
    title.add_component(new ResizableRectObject(title))
    title.add_component(new FilledShapeObject('#000000'))
    add_child_to_parent(title, page1)

    let list = new TreeNodeImpl()
    list.title = "list"
    let ts2 = new TextShapeObject("list item 1\nlist item 2\nlist item 3", 20, "left", 'top')
    ts2.set_fontfamily('Oswald')
    list.add_component(ts2)
    list.add_component(new BoundedShapeObject(new Rect(20, 75, 600, 270)))
    list.add_component(new MovableBoundedShape(list))
    list.add_component(new ResizableRectObject(list))
    list.add_component(new FilledShapeObject('#000000'))
    add_child_to_parent(list, page1)

    return page1
}

let make_title_page_action:Action = {
    title: "new title page",
    use_gui: false,
    fun(node: TreeNode, state: GlobalState): any {
        let pg = make_title_page()
        add_child_to_parent(pg, node)
        state.dispatch('object-changed', {})
    }
}

let make_list_page_action:Action = {
    title: "new list page",
    use_gui: false,
    fun(node: TreeNode, state: GlobalState): any {
        let pg = make_list_page()
        add_child_to_parent(pg, node)
        state.dispatch('object-changed', {})
    }
}

let make_new_presentation:Action = {
    use_gui: false,
    title:"new presentation",
    fun(node:TreeNode, state:GlobalState):any {
        let root = new TreeNodeImpl()
        root.title = 'presentation root'
        root.add_component(new DocMarker())
        let page1 = make_title_page()
        add_child_to_parent(page1, root)
        return root
    }
}

export class PresentationPowerup extends DefaultPowerup {
    child_options(node: TreeNode): Action[] {
        if(node.has_component(DocName)) return [make_title_page_action, make_list_page_action]
        return []
    }

    override new_doc_actions(): Action[] {
        return [make_new_presentation]
    }

}
