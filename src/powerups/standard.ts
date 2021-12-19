import {
    CenterPositionName,
    DefaultPowerup,
    DocMarker, FilledShapeName,
    FilledShapeObject,
    GlobalState,
    PageMarker,
    Rect,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {BoundedShapeName, BoundedShapeObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";
import {Action} from "../actions";
import {BoundedShapeEditor} from "./bounded_shape_editor";
import {FilledShapeEditor} from "./filled_shape_editor";
import {CenterPositionEditor} from "./position_editor";

function make_empty_doc(state: GlobalState): TreeNodeImpl {
    let root = new TreeNodeImpl()
    root.title = 'root'
    root.add_component(new DocMarker())
    root.add_component(new PageMarker())
    root.add_component(new BoundedShapeObject(new Rect(0, 0, 4 * 100, 5 * 100)))
    root.add_component(new PDFExportBounds("in", 1 / 100))
    root.add_component(new RectShapeObject())
    root.add_component(new FilledShapeObject('white'))
    return root
}

export class StandardPowerup extends DefaultPowerup {
    override new_doc_actions(): Action[] {
        let action: Action = {
            use_gui: false,
            title: "new empty one page doc",
            fun(node: TreeNode, state: GlobalState): any {
                return make_empty_doc(state)
            }
        }
        return [action]
    }

    override can_edit_by_name(comp: string): boolean {
        if(comp === BoundedShapeName) return true
        if(comp === FilledShapeName) return true
        if(comp === CenterPositionName) return true
        return false
    }
    override get_editor_by_name(name: string, state: GlobalState): any {
        if(name === BoundedShapeName) return BoundedShapeEditor
        if(name === FilledShapeName) return FilledShapeEditor
        if(name === CenterPositionName) return CenterPositionEditor
        return null
    }
}
