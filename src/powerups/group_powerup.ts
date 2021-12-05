/*
for proper group support the canvas and pickers need to be more aware of groups.

The root should have a special type to indicate it's the top.
the canvas should delegate to a group renderer to draw the children. It shouldn't infinitely recurse
on it's own. Or should it? Maybe just ask for a transform from the group instead?.

for picking we skip the root
for each child we find a picker to support it, then ask the picker if that node is picked, includes
a coordinate offset.

picker api is  is_picked(treenode,point)

BoundedShapePickSystem returns true if node has bounded shape and point inside the shape
circle pick system returns true if node has circle shape and point inside
same for text and spiral

group pick system returns true if any of the children contain the point. so compare to children bounds.



double click to enter the group.  There should be a canvas mouse gesture for this. If double click
and object under cursor is a group, then canvas enters inset mode. canvas has a boolean state variable for this.

only draws from the inset root, not the main root. things outside not drawn (or else drawn faded somehow??)
draw child bounds of the inset root?

while in the inset mode, picking begins with the contents of the inset root instead of the main root, but not the inset root itself
while in the inset mode, a button is shown to exit from the inset root
this button disabled group mode.

while in inset mode, children can be moved around appropriately




 */
import {
    Component,
    Movable, MovableName, ParentTranslate, ParentTranslateName,
    PickingSystem,
    Point,
    Powerup, Rect, RenderingSystem, TreeNode,
    TreeNodeImpl,
    GlobalState, PageName, FilledShapeObject, add_child_to_parent, DefaultPowerup
} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {SVGExporter, treenode_to_SVG} from "../exporters/svg";
import {cssToPdfColor, PDFExporter, treenode_to_PDF} from "../exporters/pdf";
import {Action} from "../actions";
import {CircleShapeObject, make_circle, MovableCircleObject} from "./circle_powerup";


export const GroupShapeName = "GroupShapeName"
export interface GroupShape extends Component {
    get_position():Point
    get_child_bounds(): Rect;
}

export class GroupParentTranslate implements ParentTranslate {
    private group: TreeNodeImpl;
    constructor(group1: TreeNodeImpl) {
        this.group = group1
        this.name = ParentTranslateName
    }
    name: string;
    get_translation_point(): Point {
        return (this.group.get_component(GroupShapeName) as GroupShape).get_position()
    }
}

export class GroupShapeObject implements GroupShape {
    name: string;
    private node: TreeNode;
    private position: Point;
    constructor(node:TreeNode, point:Point) {
        this.name = GroupShapeName
        this.node = node
        this.position = point
    }

    get_child_bounds(): Rect {
        let rect = new Rect(0,0,0,0).makeEmpty()
        this.node.children.forEach(ch => {
            if(ch.has_component(BoundedShapeName)) {
                let bds = ch.get_component(BoundedShapeName) as BoundedShape
                rect = rect.add(bds.get_bounds())
            }
        })
        return rect.translate(this.position)
    }

    get_position(): Point {
        return this.position
    }

}

export class MovableGroupShape implements Movable {
    name: string;
    private group: TreeNodeImpl;
    constructor(group1: TreeNodeImpl) {
        this.name = MovableName
        this.group = group1
    }


    moveBy(pt: Point): void {
        let group:GroupShape = this.group.get_component(GroupShapeName) as GroupShape
        group.get_position().x += pt.x
        group.get_position().y += pt.y
    }

}

const GroupRendererSystemName = 'GroupRendererSystemName'
export class GroupRendererSystem implements RenderingSystem {
    constructor() {
        this.name = GroupRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(GroupShapeName)) {
            let group:GroupShape = node.get_component(GroupShapeName) as GroupShape
            let pos = group.get_position()
            let rect = group.get_child_bounds()
            ctx.fillStyle = 'rgba(255,0,0,0.5)'
            ctx.save()
            // ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
            ctx.restore()
        }
    }

    name: string;
}


const GroupPickSystemName = 'BoundedShapePickSystem';
export class GroupPickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = GroupPickSystemName
    }
    pick_node(pt: Point, node: TreeNode): boolean {
        if(node.has_component(GroupShapeName)) {
            let group:GroupShape = node.get_component(GroupShapeName) as GroupShape
            let rect:Rect = group.get_child_bounds()
            if(rect.contains(pt)) return true
        }
        return false;
    }
}

class GroupSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = 'GroupSVGExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(GroupShapeName)
    }

    toSVG(node: TreeNode, state:GlobalState): string {
        let group:GroupShape = node.get_component(GroupShapeName) as GroupShapeObject
        let pt = group.get_position()
        let chs = node.children.map(ch => treenode_to_SVG(ch, state))
        return `<g transform="translate(${pt.x},${pt.y})">${chs.join("\n")}</g>`
    }
}

class GroupPDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = 'GroupPDFExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(GroupShapeName)
    }

    toPDF(node: TreeNode, state:GlobalState, doc: any, scale: number): void {
        let group:GroupShape = node.get_component(GroupShapeName) as GroupShapeObject
        let rect = group.get_child_bounds().scale(scale)
        doc.saveGraphicsState()
        let pdf_color = cssToPdfColor('#ff00ff')
        doc.setFillColor(...pdf_color)
        doc.rect(rect.x,rect.y,rect.w,rect.h,"FD")
        // const matrix = new jsPDF.Matrix(1,0,0,1,rect.x,rect.y)
        //[1, 0, 0, 1, tx, ty]
        //what units are tx and ty in?
        doc.setCurrentTransformationMatrix(`1 0 0 1 ${rect.x/scale} ${rect.y/scale}`);
        node.children.forEach(ch => treenode_to_PDF(ch, state,doc,scale))
        doc.restoreGraphicsState()
    }
}

const make_group: Action = {
    use_gui: false,
    title: "add group",
    fun(node: TreeNode, state: GlobalState): void {
        let group = new TreeNodeImpl()
        group.title = 'group'
        group.components.push(new GroupShapeObject(group, new Point(100,50)))
        group.components.push(new GroupParentTranslate(group))
        group.components.push(new MovableGroupShape(group))
        add_child_to_parent(group, node)
        state.dispatch('object-changed', {})
    }
}

export class GroupPowerup extends DefaultPowerup{
    init(state: GlobalState) {
        state.pickers.push(new GroupPickSystem())
        state.renderers.push(new GroupRendererSystem())
        // state.props_renderers.push(new ImagePropRendererSystem(state))
        state.svgexporters.push(new GroupSVGExporter())
        state.pdfexporters.push(new GroupPDFExporter())
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(GroupShapeName) || node.has_component(PageName)) {
            return [make_group]
        }
        return [];
    }
}
