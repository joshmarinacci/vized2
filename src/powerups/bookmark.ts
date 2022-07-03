import {
    DefaultPowerup,
    DocMarker, FilledShapeObject,
    GlobalState,
    PageMarker,
    Rect,
    TreeNode,
    TreeNodeImpl, Unit
} from '../common'
import {Action} from '../actions'
import {BoundedShapeObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";

function make_bookmark_tree(state: GlobalState):TreeNode {
    let root = new TreeNodeImpl()
    root.title = 'root'
    root.add_component(new DocMarker())
    root.add_component(new PageMarker())
    root.add_component(new BoundedShapeObject(new Rect(0, 0, 2 * 100 / 2, 7 * 100 / 2)))
    root.add_component(new PDFExportBounds(Unit.Inch, 1 / 100))
    root.add_component(new RectShapeObject())
    root.add_component(new FilledShapeObject('white'))
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
