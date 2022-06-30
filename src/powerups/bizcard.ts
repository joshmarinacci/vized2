import {
    BorderedShapeObject,
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
import {BoundedShapeObject, MovableBoundedShape, ResizableRectObject} from "../bounded_shape";
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

    let rect1 = new TreeNodeImpl()
    rect1.title = 'rect'
    let bounds = new Rect(0,0,1,1)
    rect1.add_component(new RectShapeObject())
    rect1.add_component(new BoundedShapeObject(bounds))
    rect1.add_component(new FilledShapeObject("#ff0000"))
    rect1.add_component(new BorderedShapeObject("#000000"))
    rect1.add_component(new MovableBoundedShape(rect1))
    rect1.add_component(new ResizableRectObject(rect1))
    root.add_child(rect1)

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
