import {
    Component,
    System,
    TreeNode,
    GlobalState,
    PageName,
    DefaultPowerup, Point
} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {jsPDF} from "jspdf"
import {Action} from "../actions";
import {Matrix} from "./pdf_types";


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
    console.log(`w=${width} height=${height} scale=${scale}`)
    // @ts-ignore
    //doc.setCurrentTransformationMatrix(`1 0 0 1 ${width/2.0/scale} ${height/2.0/scale}`);

    function draw_page(sc,tx,ty) {
        doc.saveGraphicsState()
        let identity = new Matrix(1,0,0,1,0,0)
        let tmat = identity.clone()
        tmat.tx = (width/2)*tx/scale * sc
        tmat.ty = -(height/2)*ty/scale * (sc/2)
        tmat.sx = sc
        tmat.sy = sc
        let mat1 = identity.multiply(tmat)
        doc.setCurrentTransformationMatrix(mat1 as any)
        pg.children.forEach(ch => treenode_to_PDF(ch, state,doc,scale/2, new Point(0,0)))
        doc.restoreGraphicsState()
    }
    draw_page(0.5,0,0)
    draw_page(0.5,0.5,0)

    draw_page(0.5,0.0,0.5)
    draw_page(0.5,0.5,0.5)


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
}
