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
import {BoundedShapeObject, MovableBoundedShape, ResizableRectObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";
import {TextShapeObject} from "./text_powerup";
import {ImageShapeObject, make_image_node} from "./image_powerup";

function make_greeting_card_tree(state: GlobalState):TreeNode {
    let root = new TreeNodeImpl()
    root.title = 'root'
    root.add_component(new DocMarker())

    {
        let page1 = new TreeNodeImpl()
        page1.title = 'front page'
        page1.add_component(new PageMarker())
        page1.add_component(new BoundedShapeObject(new Rect(0, 0, 8.5 * 100 / 2, 11 * 100 / 2)))
        page1.add_component(new PDFExportBounds("in", 1 / 100))
        page1.add_component(new RectShapeObject())
        page1.add_component(new FilledShapeObject('white'))
        add_child_to_parent(page1, root)

        let text1 = new TreeNodeImpl()
        text1.title = "Text: merry christmas"
        text1.add_component(new TextShapeObject("Merry Christmas", 30, "center", 'center'))
        text1.add_component(new BoundedShapeObject(new Rect(0, 100, 8.5 * 100 / 2, 200)))
        text1.add_component(new MovableBoundedShape(text1))
        text1.add_component(new ResizableRectObject(text1))
        text1.add_component(new FilledShapeObject('#00CC00'))
        add_child_to_parent(text1, page1)

        let img = make_image_node("https://vr.josh.earth/assets/2dimages/santa.png",state, 0.1)
        add_child_to_parent(img,page1)

    }

    {
        let page2 = new TreeNodeImpl()
        page2.title = 'front page'
        page2.add_component(new PageMarker())
        page2.add_component(new BoundedShapeObject(new Rect(0, 0, 8.5 * 100 / 2, 11 * 100 / 2)))
        page2.add_component(new PDFExportBounds("in", 1 / 100))
        page2.add_component(new RectShapeObject())
        page2.add_component(new FilledShapeObject('white'))
        add_child_to_parent(page2, root)

        let text2 = new TreeNodeImpl()
        text2.title = "Text: Happy NY"
        text2.add_component(new TextShapeObject("Happy NY", 30, "center", 'center'))
        text2.add_component(new BoundedShapeObject(new Rect(0, 250, 8.5 * 100 / 2, 200)))
        text2.add_component(new MovableBoundedShape(text2))
        text2.add_component(new ResizableRectObject(text2))
        text2.add_component(new FilledShapeObject('#00CC00'))
        add_child_to_parent(text2, page2)

        let img = make_image_node("https://vr.josh.earth/assets/2dimages/holly-leaves.png", state, 0.05)
        add_child_to_parent(img,page2)
    }

    return root
}

export class GreetingCardPowerup extends DefaultPowerup {
    override new_doc_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"new greeting card",
            fun(node:TreeNode, state:GlobalState):any {
                return make_greeting_card_tree(state)
            }
        }
        return [action]
    }

}
