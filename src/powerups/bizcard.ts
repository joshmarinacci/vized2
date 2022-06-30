import {
    DefaultPowerup,
    DocMarker,
    FilledShapeObject,
    GlobalState,
    PageMarker,
    Rect,
    TreeNode,
    TreeNodeImpl,
    Unit
} from "../common";
import {Action} from "../actions";
import {BoundedShapeObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";

function make_bizcard_tree(state: GlobalState):TreeNode {
    let root = new TreeNodeImpl()
    root.title = 'root'
    root.add_component(new DocMarker())
    let pm = new PageMarker()
    pm.unit = Unit.Inch
    pm.ppu = 100
    //3.5" x 2.0"
    root.add_component(pm)
    root.add_component(new BoundedShapeObject(new Rect(0, 0, 3.5, 2)))
    // root.add_component(new PDFExportBounds("in", 1 / 100))
    root.add_component(new RectShapeObject())
    root.add_component(new FilledShapeObject('white'))
    return root
}

export class BizcardPowerup extends DefaultPowerup {
    override new_doc_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"new bizcard",
            fun(node:TreeNode, state:GlobalState):any {
                return make_bizcard_tree(state)
            }
        }
        return [action]
    }
}
