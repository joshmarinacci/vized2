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

export class PresentationPowerup extends DefaultPowerup {
    override new_doc_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"new presentation",
            fun(node:TreeNode, state:GlobalState):any {
                let root:TreeNode = new TreeNodeImpl()
                root.title = 'presentation root'
                root.components.push(new DocMarker())

                let page1: TreeNode = new TreeNodeImpl()
                page1.title = 'title page'
                page1.components.push(new PageMarker())
                page1.components.push(new BoundedShapeObject(new Rect(0, 0, 16*40, 9*40)))
                page1.components.push(new PDFExportBounds("in", 1 / 100))
                page1.components.push(new RectShapeObject())
                page1.components.push(new FilledShapeObject('white'))
                add_child_to_parent(page1, root)

                let text1 = new TreeNodeImpl() as TreeNode
                text1.title = "title"
                let ts = new TextShapeObject("Title Here", 40, "center", 'center')
                ts.set_fontfamily('Oswald')
                text1.components.push(ts)
                text1.components.push(new BoundedShapeObject(new Rect(100, 100, 430, 115)))
                text1.components.push(new MovableBoundedShape(text1))
                text1.components.push(new ResizableRectObject(text1))
                text1.components.push(new FilledShapeObject('#000000'))
                add_child_to_parent(text1, page1)
                return root
            }
        }
        return [action]
    }

}
