import {
    BorderedShapeName, BorderedShapeObject,
    CenterPositionName, Component,
    DefaultPowerup,
    DocMarker, DocName, FilledShapeName,
    FilledShapeObject,
    GlobalState, MovableCenterPosition,
    PageMarker, PageName, ParentDrawChildrenName,
    Rect,
    TreeNode,
    TreeNodeImpl, Unit
} from "../common";
import {BoundedShapeName, BoundedShapeObject} from "../bounded_shape";
import {PDFExportBounds} from "../exporters/pdf";
import {RectShapeObject} from "./rect_powerup";
import {Action} from "../actions";
import {BoundedShapeEditor} from "./bounded_shape_editor";
import {FilledShapeEditor} from "./filled_shape_editor";
import {BorderedShapeEditor} from "./filled_border_editor";
import {CenterPositionEditor} from "./position_editor";
import {JSONExporter} from "../exporters/json";
import {DocTitleEditor} from "./standard_doctitle_editor";

export function make_empty_doc(state: GlobalState): TreeNodeImpl {
    let root = new TreeNodeImpl()
    root.title = 'root'
    root.add_component(new DocMarker())
    root.add_component(new PageMarker())
    root.add_component(new BoundedShapeObject(new Rect(0, 0, 4 * 100, 5 * 100)))
    root.add_component(new PDFExportBounds(Unit.Inch, 1 / 100))
    root.add_component(new RectShapeObject())
    root.add_component(new FilledShapeObject('white'))
    return root
}

class StandardJSONExporter implements JSONExporter {
    constructor() {
        this.name = "StandardJSONExporter"
    }
    name: string;

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        return false;
    }

    canHandleToJSON(comp: Component, node: TreeNode): boolean {
        console.log("checking node",comp)
        if(comp instanceof PageMarker) return true
        if(comp instanceof BoundedShapeObject) return true
        return false;
    }

    fromJSON(obj: any, node: TreeNode): Component {
        // @ts-ignore
        return undefined;
    }

    toJSON(component: Component, node: TreeNode): any {
        if(component instanceof PageMarker) {
            return {name:PageName, missing:false}
        }
        if(component instanceof BoundedShapeObject) {
            let bd = (component as BoundedShapeObject)
            let rect = bd.get_bounds()
            return {
                name:BoundedShapeName,
                x:rect.x,
                y:rect.y,
                w:rect.w,
                h:rect.h
            }
        }
        console.log("converting. bounded shape?",component)
    }
}

export class StandardPowerup extends DefaultPowerup {
    init(state: GlobalState) {
        state.jsonexporters.push(new StandardJSONExporter())
        this.simple_comps.push(DocMarker)
        this.simple_comps.push(PageMarker)
        this.simple_comps.push(MovableCenterPosition)
        this.simple_comps.push(BorderedShapeObject)
    }

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
        if(comp === BorderedShapeName) return true
        if(comp === DocName) return true
        return false
    }
    override get_editor_by_name(name: string, state: GlobalState): any {
        if(name === BoundedShapeName) return BoundedShapeEditor
        if(name === FilledShapeName) return FilledShapeEditor
        if(name === BorderedShapeName) return BorderedShapeEditor
        if(name === CenterPositionName) return CenterPositionEditor
        if(name === DocName) return DocTitleEditor
        return null
    }
    override can_serialize(comp: Component, node: TreeNode, state: GlobalState): boolean {
        if(comp instanceof FilledShapeObject) return true
        if(comp instanceof DocMarker) return true
        return super.can_serialize(comp,node,state)
    }
    override serialize(comp: Component, node: TreeNode, state: GlobalState): any {
        if(comp instanceof FilledShapeObject) {
            let fso = comp as FilledShapeObject
            return { powerup:this.constructor.name, klass:comp.constructor.name, fill: fso.get_fill(), fill_type:fso.get_fill_type()}
        }
        if(comp instanceof BorderedShapeObject) {
            let bso = comp as BorderedShapeObject
            return { powerup:this.constructor.name, klass:comp.constructor.name, border_fill: bso.get_border_fill(), border_width:bso.get_border_width()}
        }
        if(comp instanceof DocMarker) {
            let doc = comp as DocMarker
            return { powerup:this.constructor.name, klass:comp.constructor.name, title: doc.get_title()}
        }
        return super.serialize(comp,node,state)
    }

    override deserialize(obj: any, node:TreeNode, state: GlobalState): Component {
        if(obj.klass === DocMarker.name) return new DocMarker(obj.title)
        if(obj.klass === PageMarker.name) return new PageMarker()
        if(obj.klass === FilledShapeObject.name) return new FilledShapeObject(obj.fill)
        if(obj.klass === BorderedShapeObject.name) return new BorderedShapeObject(obj.border_fill, obj.border_width)
        if(obj.klass === MovableCenterPosition.name) {
            // @ts-ignore
            return new MovableCenterPosition(node)
        }
        // if(obj.klass === FilledShapeObject.name) return new FilledShapeObject()
        console.log(obj)
        throw new Error("DefaultPowerup couldn't deserialize " + obj)
    }

    fromJSON(obj:any) {
        console.log("making a component from def",obj)
        return  new DocMarker()
    }
}
