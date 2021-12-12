import {
    DefaultPowerup,
    DocMarker, FilledShapeObject,
    GlobalState,
    PageMarker,
    Rect,
    TreeNode,
    TreeNodeImpl
} from '../common'
import {Action} from '../actions'
import {BoundedShapeObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";

function make_bookmark_tree(state: GlobalState):TreeNode {
    let root:TreeNode = new TreeNodeImpl()
    root.title = 'root'
    root.components.push(new DocMarker())
    root.components.push(new PageMarker())
    root.components.push(new BoundedShapeObject(new Rect(0, 0, 2 * 100 / 2, 7 * 100 / 2)))
    root.components.push(new PDFExportBounds("in", 1 / 100))
    root.components.push(new RectShapeObject())
    root.components.push(new FilledShapeObject('white'))
    return root
}

export class BookmarkPowerup extends DefaultPowerup {
    override new_doc_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"new bookmark",
            fun(node:TreeNode, state:GlobalState):any {
                return make_bookmark_tree(state)
            }
        }
        return [action]
    }

}
