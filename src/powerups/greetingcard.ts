// <button onClick={new_greeting_card}>new card</button>
import {
    add_child_to_parent,
    DefaultPowerup,
    DocMarker, FilledShapeObject,
    GlobalState,
    PageMarker, Rect,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {Action} from "../actions";
import {export_JSON} from "../exporters/json";
import {BoundedShapeObject, MovableBoundedShape, ResizableRectObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";
import {TextShapeObject} from "./text_powerup";
import {make_image_node} from "./image_powerup";

function make_greeting_card_tree():TreeNode {
    let root:TreeNode = new TreeNodeImpl()
    root.title = 'root'
    root.components.push(new DocMarker())

    {
        let page1: TreeNode = new TreeNodeImpl()
        page1.title = 'front page'
        page1.components.push(new PageMarker())
        page1.components.push(new BoundedShapeObject(new Rect(0, 0, 8.5 * 100 / 2, 11 * 100 / 2)))
        page1.components.push(new PDFExportBounds("in", 1 / 100))
        page1.components.push(new RectShapeObject())
        page1.components.push(new FilledShapeObject('white'))
        add_child_to_parent(page1, root)

        let text1 = new TreeNodeImpl() as TreeNode
        text1.title = "Text: merry christmas"
        text1.components.push(new TextShapeObject("Merry Christmas", 30, "center", 'center'))
        text1.components.push(new BoundedShapeObject(new Rect(0, 100, 8.5 * 100 / 2, 200)))
        text1.components.push(new MovableBoundedShape(text1))
        text1.components.push(new ResizableRectObject(text1))
        text1.components.push(new FilledShapeObject('#00CC00'))
        add_child_to_parent(text1, page1)

        let img = make_image_node("https://vr.josh.earth/assets/2dimages/santa.png")
        add_child_to_parent(img,page1)

    }

    {
        let page2: TreeNode = new TreeNodeImpl()
        page2.title = 'front page'
        page2.components.push(new PageMarker())
        page2.components.push(new BoundedShapeObject(new Rect(0, 0, 8.5 * 100 / 2, 11 * 100 / 2)))
        page2.components.push(new PDFExportBounds("in", 1 / 100))
        page2.components.push(new RectShapeObject())
        page2.components.push(new FilledShapeObject('white'))
        add_child_to_parent(page2, root)

        let text2 = new TreeNodeImpl() as TreeNode
        text2.title = "Text: Happy NY"
        text2.components.push(new TextShapeObject("Happy NY", 30, "center", 'center'))
        text2.components.push(new BoundedShapeObject(new Rect(0, 250, 8.5 * 100 / 2, 200)))
        text2.components.push(new MovableBoundedShape(text2))
        text2.components.push(new ResizableRectObject(text2))
        text2.components.push(new FilledShapeObject('#00CC00'))
        add_child_to_parent(text2, page2)

        let img = make_image_node("https://vr.josh.earth/assets/2dimages/holly-leaves.png")
        add_child_to_parent(img,page2)
    }

    return root
}

export class GreetingCardPowerup extends DefaultPowerup {
    override new_doc_actions(): Action[] {
        let action:Action = {
            title:"new greeting card",
            fun(node:TreeNode, state:GlobalState):any {
                return make_greeting_card_tree()
            }
        }
        return [action]
    }

}