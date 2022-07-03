import {
    add_child_to_parent,
    Component,
    DefaultPowerup,
    forceDownloadBlob,
    GlobalState,
    PageName,
    Point,
    Rect,
    System,
    TreeNode,
    Unit
} from "../common";
import {BoundedShape, BoundedShapeName} from "../bounded_shape";
import {Action} from "../actions";
import {make_empty_doc} from "../powerups/standard";
import {make_std_circle} from "../powerups/circle";
import {make_std_rect} from "../powerups/rect_powerup";
import {
    PDFDocument,
    PDFFont,
    PDFPage,
    popGraphicsState,
    pushGraphicsState,
    rgb,
    scale,
    StandardFonts,
    translate
} from "pdf-lib";
import {unit_abbr} from "../units";


export class PDFContext {
    doc:PDFDocument
    currentPage:PDFPage
    scale:number
    fonts: Map<string, PDFFont>;
    pt_bounds: Rect // in points
    unit:Unit;
    constructor(doc:PDFDocument, page:PDFPage) {
        this.doc = doc
        this.scale = 1.0
        this.currentPage = page
        this.fonts = new Map<string,PDFFont>()
        this.pt_bounds = new Rect(0,0,10,10)
        this.unit = Unit.Point
    }
}
export interface PDFExporter extends System {
    canExport(node:TreeNode):boolean
    toPDF(ctx:PDFContext, node:TreeNode, state:GlobalState):void
}

const PDFExportBoundsName = "PDFExportBoundsName"
export class PDFExportBounds implements Component {
    unit: Unit;
    scale: number;
    constructor(unit: Unit, scale: number) {
        this.name = PDFExportBoundsName
        this.unit = unit
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
export function treenode_to_PDF(ctx:PDFContext, node: TreeNode, state: GlobalState) {
    let exp = state.pdfexporters.find(exp => exp.canExport(node))
    return exp ? exp.toPDF(ctx,node,state) : ""
}

function find_pages(root: TreeNode):TreeNode[] {
    if(root.has_component(PageName)) return [root]
    return root.children.map(ch => find_pages(ch)).flat()
}

function render_pdf_page(ctx:PDFContext, pageNumber: number, pg: TreeNode, state: GlobalState) {
    ctx.currentPage = ctx.doc.addPage([ctx.pt_bounds.w,ctx.pt_bounds.h])
    console.log("PDF: rendering page. bounds",ctx.pt_bounds, 'unit', unit_abbr(ctx.unit),'number',pageNumber)
    ctx.currentPage.pushOperators(
        pushGraphicsState(),
        scale(1,-1),
        translate(0,-ctx.currentPage.getHeight())
    )
    pg.children.forEach(ch => treenode_to_PDF(ctx, ch, state))
    ctx.currentPage.pushOperators(popGraphicsState())
}

export async function export_PDF(root:TreeNode, state:GlobalState) {
    function log(...args:any[]) { console.log("PDF",...args) }
    let bounds = new Rect(0,0,500,500)
    let pages:TreeNode[] = find_pages(root)
    let firstpage = pages[0]
    if(firstpage.has_component(BoundedShapeName)) {
        bounds = (firstpage.get_component(BoundedShapeName) as BoundedShape).get_bounds()
    }
    let settings = {
        unit:Unit.Point,
        bounds:new Rect(0,0,bounds.w,bounds.h)
    }
    if(firstpage.has_component(PDFExportBoundsName)) {
        let pdf_exp_bounds = firstpage.get_component(PDFExportBoundsName) as PDFExportBounds
        log('pdf_exp_bounds',pdf_exp_bounds)
        settings.unit = pdf_exp_bounds.unit
        settings.bounds = new Rect(0,0,bounds.w*pdf_exp_bounds.scale,bounds.h*pdf_exp_bounds.scale)
    }
    log("using the settings",settings)
    // @ts-ignore
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    // @ts-ignore
    let ctx = new PDFContext(pdfDoc,null)
    ctx.unit = settings.unit
    ctx.pt_bounds = settings.bounds
    ctx.fonts.set("serif",timesRomanFont)
    log("rendering pages with context",ctx)

    pages.forEach((pg,i) => render_pdf_page(ctx,i,pg,state))
    let blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' })
    forceDownloadBlob('test.pdf',blob)
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
                export_PDF(node,state).then(()=>console.log("done exporting pdf"))
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
    override can_serialize(comp: Component, node: TreeNode, state: GlobalState): boolean {
        if(comp instanceof PDFExportBounds) return true
        return false
    }
    override serialize(comp: Component, node: TreeNode, state: GlobalState): any {
        if(comp instanceof PDFExportBounds) return {
            powerup:this.constructor.name,
            klass:comp.constructor.name,
            scale: (comp as PDFExportBounds).scale,
            unit: (comp as PDFExportBounds).unit
        }
        throw new Error("can't serialize")
    }
    override deserialize(obj: any, node:TreeNode, state: GlobalState): Component {
        if(obj.klass === PDFExportBounds.name) {
            return new PDFExportBounds(obj.unit,obj.scale)
        }
        throw new Error("PDFExporter can't desierailze " + obj.klass)
    }

}

export function hex_to_pdfrgbf(fill: string) {
    if(fill === 'red') return rgb(1,0,0)
    if (fill.startsWith('#')) {
        fill = fill.substring(1)
    }
    // console.log("fill is", fill)
    let r = parseInt(fill.substring(0, 2), 16)
    let g = parseInt(fill.substring(2, 4), 16)
    let b = parseInt(fill.substring(4, 6), 16)
    // console.log("colors", r, g, b)
    return rgb(r / 255, g / 255, b / 255)
}
