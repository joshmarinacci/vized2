import {
    Component,
    System,
    TreeNode,
    GlobalState,
    PageName,
    DefaultPowerup, Point, add_child_to_parent, Rect
} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {jsPDF} from "jspdf"
import {Action} from "../actions";
import {make_identity, Matrix} from "./pdf_types";
import {make_empty_doc} from "../powerups/standard";
import {make_std_circle} from "../powerups/circle";
import {make_std_rect} from "../powerups/rect_powerup";


export interface PDFExporter extends System {
    canExport(node:TreeNode):boolean
    toPDF(node:TreeNode, state:GlobalState, doc:any, scale:number, translate:Point):void
}

const PDFExportBoundsName = "PDFExportBoundsName"
export class PDFExportBounds implements Component {
    unit: string;
    scale: number;
    constructor(inch: string, scale: number) {
        this.name = PDFExportBoundsName
        this.unit = inch
        this.scale = scale
    }
    name: string;
}

export function cssToPdfColor(color:string):number[] {
    // console.log(`converting color: ${color}`)
    if(!color.startsWith('#')) {
        console.error(`we can't convert color ${color}`)
        return [0,0,0]
    }

    let hex = Number.parseInt(color.substring(1),16)
    let r = (hex>>16)&(0xFF)
    let g = (hex>>8)&(0xFF)
    let b = (hex>>0)&(0xFF)
    let arr = [r,g,b]
    // console.info("generated color array",arr)
    return arr
}
export function treenode_to_PDF(node: TreeNode, state: GlobalState,doc:any, scale:number, translate:Point) {
    let exp = state.pdfexporters.find(exp => exp.canExport(node))
    return exp ? exp.toPDF(node,state,doc,scale, translate) : ""
}

function find_pages(root: TreeNode):TreeNode[] {
    if(root.has_component(PageName)) return [root]
    return root.children.map(ch => find_pages(ch)).flat()
}

function render_pdf_page(pageNumber:number, pg: TreeNode, state: GlobalState, doc: jsPDF, scale: number) {
    if(pageNumber > 0) doc.addPage();
    //to do two up, we need to scale by half and translate
    let width = doc.internal.pageSize.getWidth();
    let height = doc.internal.pageSize.getHeight();
    function draw_page(sc:number,tx:number,ty:number) {
        doc.saveGraphicsState()
        let trans = make_identity()
        trans.tx = width*tx/scale
        trans.ty = -height*ty/scale
        let sca = make_identity()
        sca.sx = sc
        sca.sy = sc
        doc.setCurrentTransformationMatrix(trans.multiply(sca) as any)
        pg.children.forEach(ch => treenode_to_PDF(ch, state,doc,scale, new Point(0,0)))
        doc.restoreGraphicsState()
    }
    // draw_page(1,0,0) // identity
    draw_page(0.4,0,0)
    draw_page(0.4,0,-0.33)
    draw_page(0.4,0.33,0)
    draw_page(0.4,0.33,-0.33)



}

export function export_PDF(root:TreeNode, state:GlobalState) {
    let bds = {
        w:500,
        h:500,
    }
    let scale = 1
    let pages:TreeNode[] = find_pages(root)
    let firstpage = pages[0]
    if(firstpage.has_component(BoundedShapeName)) {
        let bounds = firstpage.get_component(BoundedShapeName) as BoundedShape
        let rect = bounds.get_bounds()
        bds.w = rect.w
        bds.h = rect.h
    }
    let settings = {
        unit:'pt',
        format:[bds.w,bds.h],
    }
    if(firstpage.has_component(PDFExportBoundsName)) {
        let pdb = firstpage.get_component(PDFExportBoundsName) as PDFExportBounds
        console.log('pdb',pdb)
        settings.unit = pdb.unit
        settings.format = [bds.w*pdb.scale,bds.h*pdb.scale]
        scale = pdb.scale
    }
    console.log("using the settings",settings)
    // @ts-ignore
    let doc = new jsPDF(settings)
    pages.forEach((pg,i) => render_pdf_page(i,pg, state, doc, scale))
    doc.save("output.pdf");
}


function make_pdf_test(state: GlobalState) {
    let root = make_empty_doc(state)
    add_child_to_parent(make_std_rect(new Rect(1,1,398,498)),root)
    add_child_to_parent(make_std_circle(new Point(20,10),10,'#ff0000'),root)
    add_child_to_parent(make_std_circle(new Point(30,20),10,'#00ff00'),root)
    add_child_to_parent(make_std_circle(new Point(40,30),10),root)
    add_child_to_parent(make_std_circle(new Point(30,300),10,'#ccff33'),root)
    add_child_to_parent(make_std_circle(new Point(100,300),10,'#ccff33'),root)
    add_child_to_parent(make_std_circle(new Point(200,300),10,'#ccff33'),root)
    add_child_to_parent(make_std_circle(new Point(300,300),10,'#ccff33'),root)
    add_child_to_parent(make_std_circle(new Point(400-10,500-10),10,'#cc33ff'),root)
    return root
}

export class PDFPowerup extends DefaultPowerup {
    override export_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title: "export PDF",
            fun(node: TreeNode, state: GlobalState): void {
                export_PDF(node,state)
            }
        }
        return [action]
    }
    override new_doc_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"new pdf test",
            fun(node:TreeNode, state:GlobalState):any {
                return make_pdf_test(state)
            }
        }
        return [action]
    }
}
