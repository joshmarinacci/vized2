import {
    add_child_to_parent, CanvasRenderSurface,
    Component,
    DefaultPowerup,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    GlobalState,
    Movable,
    MovableName, PageName,
    Point,
    Rect,
    RenderingSystem,
    ResizableName,
    SVGExporter,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {
    BoundedShape,
    BoundedShapeName,
    BoundedShapeObject,
    MovableBoundedShape,
    ResizableRectObject
} from "../bounded_shape";
import {cssToPdfColor, hex_to_pdfrgbf, PDFContext, PDFExporter} from "../exporters/pdf";
import {JSONExporter} from "../exporters/json";
import {Action} from "../actions";
import {TextShapeEditor} from "./text_editor";
import {PDFFont, PDFPage, popGraphicsState, pushGraphicsState, scale, translate} from "pdf-lib";
import {CanvasSurf} from "../canvas";

export const TextShapeName = "TextShapeName"
interface TextShape extends Component {
    get_content():string
    set_content(content:string):void
    get_fontsize():number
    set_fontsize(size:number):void
    get_halign(): string;
    set_halign(halign:string): void;
    get_valign(): string;
    set_valign(valign:string):void
    get_fontfamily():string
    set_fontfamily(family:string):void
}

export class TextShapeObject implements TextShape {
    name: string;
    private content: string;
    private fontsize: number;
    private halign: string;
    private valign: string;
    private fontfamily: string;
    constructor(content:string, size:number, halign:string, valign:string) {
        this.name = TextShapeName
        this.content = content
        this.fontsize = size
        this.halign = halign
        this.valign = valign
        this.fontfamily = 'serif'
    }

    get_valign(): string {
        return this.valign
    }
    set_valign(valign: string): void {
        this.valign = valign
    }

    get_content(): string {
        return this.content
    }

    get_fontsize(): number {
        return this.fontsize
    }

    set_content(content: string): void {
        this.content = content
    }

    set_fontsize(size: number): void {
        this.fontsize = size
    }

    get_halign(): string {
        return this.halign
    }

    set_halign(halign: string): void {
        this.halign = halign
    }

    get_fontfamily(): string {
        return this.fontfamily;
    }

    set_fontfamily(family: string): void {
        this.fontfamily = family
    }
}

type TextMetrics = { w:number, h:number}
interface RenderingSurface {
    measureText(text: string, size: number, family: string):TextMetrics
    strokeRect(rect: Rect, color: string): void;
    fillText(text: string, x: number, y: number, fill:any, size:number, family:string): void;
}

function layout_text_lines(text: string, max_width: number, line_height: number, surf: RenderingSurface, tn: TextShape):string[] {
    let lines = []
    let paras = text.split("\n")
    for(let p=0; p<paras.length; p++) {
        let para = paras[p]
        let current_line = ""
        let words = para.split(" ")
        for (let i = 0; i < words.length; i++) {
            let word = words[i]
            let test_line = current_line
            if (test_line.length > 0) test_line += ' '
            test_line += word
            let metrics = surf.measureText(test_line, tn.get_fontsize(), tn.get_fontfamily())
            if (metrics.w > max_width) {
                //end line now
                lines.push(current_line)
                current_line = word
                continue
            }
            if (current_line.length > 0) current_line += ' '
            current_line += word
        }
        lines.push(current_line)
    }
    return lines
}

function calc_text_size(lines: string[], surf: RenderingSurface, line_height: number, tn: TextShape) {
    let longest = 0
    let total_height = 0
    lines.forEach(line => {
        longest = Math.max(longest,surf.measureText(line, tn.get_fontsize(), tn.get_fontfamily()).w)
        total_height += line_height
    })
    return {
        width:longest,
        height:total_height,
    }
}

class CanvasRenderingSurface implements RenderingSurface {
    private ctx: CanvasRenderingContext2D;
    private ppu: number;

    constructor(ctx: CanvasRenderingContext2D, ppu: number) {
        this.ctx = ctx
        this.ppu = ppu
    }

    measureText(text: string, size: number, family: string): TextMetrics {
        this.ctx.font = `${size}pt ${family}`
        let metrics = this.ctx.measureText(text)
        return {
            w:metrics.width,
            h:metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent
        }
    }

    strokeRect(rect: Rect, color: string): void {
        this.ctx.fillStyle = color
        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
    }

    fillText(text: string, x: number, y: number, fill:any, size:number, family:string): void {
        this.ctx.fillStyle = fill
        this.ctx.font = `${size}pt ${family}`
        this.ctx.fillText(text,x,y)
    }
}

class PDFRenderingSurface implements RenderingSurface {
    private ctx: PDFContext
    constructor(ctx:PDFContext) {
        this.ctx = ctx
    }

    fillText(text: string, x: number, y: number, fill: any, size: number, family: string): void {
        let opts = {
            x:0, y:0, size, color: hex_to_pdfrgbf(fill),
        }
        if (this.ctx.fonts.has(family)) {
            // @ts-ignore
            opts.font = this.ctx.fonts.get(family) as PDFFont
        }
        this.ctx.currentPage.pushOperators(
            pushGraphicsState(),
            translate(x,y),
            scale(1,-1)
        )
        this.ctx.currentPage.drawText(text, opts)
        this.ctx.currentPage.pushOperators(popGraphicsState())
    }


    measureText(text: string, size: number, fontfamily: string): TextMetrics {
        // this.ctx.currentPage.setFontSize(size)
        // console.log("measureing",text,size,fontfamily)
        if(this.ctx.fonts.has(fontfamily)) {
            let fnt = this.ctx.fonts.get(fontfamily) as PDFFont
            return {
                w:fnt.widthOfTextAtSize(text,size),
                h:fnt.heightAtSize(size),
            }
        }
        console.log("font not found",fontfamily)
        return {
            w:50,
            h:20,
        }
    }

    strokeRect(rect: Rect, fill: string): void {
        this.ctx.currentPage.drawRectangle({
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.h,
            color:hex_to_pdfrgbf(fill),
        })
        // this.doc.setLineWidth(0.01)
        // this.doc.setFillColor(...cssToPdfColor(fill))
        // this.doc.rect(rect.x, rect.y, rect.w, rect.h, "D")
    }
}

function render_text(surf: RenderingSurface, rect: Rect, tn: TextShape, fill: FilledShape) {
    // if(false) {
    //     surf.strokeRect(rect,'cyan')
    // }
    let line_height = surf.measureText("MEASURE",tn.get_fontsize(), tn.get_fontfamily()).h * 1.2

    let lines = layout_text_lines(tn.get_content(), rect.w, line_height, surf, tn)
    let metrics = calc_text_size(lines,surf, line_height, tn)
    const h_aligns = { left:0.0, center:0.5, right:1.0 }
    const v_aligns = { top:0.0, center:0.5, bottom:1.0 }
    // @ts-ignore
    let h_offset = h_aligns[tn.get_halign()]*(rect.w - metrics.width)
    // @ts-ignore
    let v_offset = v_aligns[tn.get_valign()]*(rect.h - metrics.height)

    lines.forEach((line,i)=> surf.fillText(
        line,
        rect.x + h_offset,
        rect.y+line_height*(i+1) + v_offset,
        fill.get_fill(),
        tn.get_fontsize(),
        tn.get_fontfamily()))
}

class TextRenderingSystem implements RenderingSystem {
    name: string;
    constructor() {
        this.name = 'TextRenderingSystem'
    }

    render(can:CanvasRenderSurface, node: TreeNode, state: GlobalState): void {
        if(node.has_component(TextShapeName) && node.has_component(BoundedShapeName)) {
            let bs = node.get_component(BoundedShapeName) as BoundedShape
            let tn = node.get_component(TextShapeName) as TextShape
            let fill = node.get_component(FilledShapeName) as FilledShape
            let rect = bs.get_bounds()
            let cs = can as CanvasSurf
            cs.with_scaled(ctx => {
                let surf:RenderingSurface = new CanvasRenderingSurface(can.ctx, cs.ppu)
                render_text(surf,rect,tn,fill)
                if (state.selection.has(node)) {
                    ctx.save()
                    ctx.strokeStyle = 'magenta'
                    ctx.lineWidth = 3.5/cs.ppu
                    ctx.strokeRect(rect.x,rect.y,rect.w,rect.h)
                    ctx.restore()
                }
            })
        }
    }

}

export class MovableTextObject implements Movable {
    name: string;
    private node: TreeNode;
    constructor(node:TreeNode) {
        this.node = node
        this.name = MovableName
    }
    moveBy(pt: Point): void {
        let bd:BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        bd.get_bounds().x += pt.x
        bd.get_bounds().y += pt.y
    }

    moveTo(pt: Point): void {
        let bd:BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        bd.get_bounds().x = pt.x
        bd.get_bounds().y = pt.y
    }

    position(): Point {
        let bd:BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        return bd.get_bounds().position
    }
}

class TextJSONExporter implements JSONExporter {
    name: string;
    constructor() {
        this.name = 'TestJSONExporter'
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        if(obj.name === TextShapeName) return true
        if(obj.name === MovableName && obj.powerup==='text') return true
        return false;
    }

    canHandleToJSON(comp: any, node: TreeNode): boolean {
        if(comp.name === TextShapeName) return true
        if(comp.name === MovableName && node.has_component(BoundedShapeName)) return true
        return false;
    }

    fromJSON(obj: any, node: TreeNode): Component {
        if(obj.name === MovableName) return new MovableTextObject(node)
        if(obj.name === BoundedShapeName) return new BoundedShapeObject(new Rect(obj.x,obj.y,obj.width,obj.height))
        if(obj.name === TextShapeName) return new TextShapeObject(obj.content,obj.fontsize, obj.halign, obj.valign)
        throw new Error(`cannot export json for ${obj.name}`)
    }

    toJSON(component: Component, node: TreeNode): any {
        if(component.name === ResizableName) return {name:component.name, empty:true, powerup:'text'}
        if(component.name === MovableName) return {name:component.name, empty:true, powerup:'text'}
        if(component.name === TextShapeName) {
            let ts:TextShape = component as TextShape
            return {
                name:TextShapeName,
                content:ts.get_content(),
                fontsize:ts.get_fontsize(),
                halign:ts.get_halign(),
                valign:ts.get_valign()
            }
        }
        if(component.name === BoundedShapeName) {
            let bd: BoundedShape = component as BoundedShape
            let rect = bd.get_bounds()
            return {
                name: BoundedShapeName,
                x: rect.x,
                y: rect.y,
                width: rect.w,
                height: rect.w,
                powerup: 'text',
            }
        }
    }
}

class TextPDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = 'TextPDFExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(TextShapeName)
    }

    toPDF(ctx:PDFContext, node: TreeNode, state:GlobalState): void {
        let ts: TextShape = node.get_component(TextShapeName) as TextShape
        let bounds: BoundedShape = node.get_component(BoundedShapeName) as BoundedShape
        let rect = bounds.get_bounds()
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let surf:RenderingSurface = new PDFRenderingSurface(ctx)
        render_text(surf,rect,ts,color)
    }
}

class TextSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = 'TextSVGExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(TextShapeName)
    }

    toSVG(node: TreeNode): string {
        let ts:TextShape = node.get_component(TextShapeName) as TextShape
        let bs = node.get_component(BoundedShapeName) as BoundedShape
        let bounds = bs.get_bounds()
        return `<text x="${bounds.x}" y="${bounds.y}" font-size="${ts.get_fontsize()}">${ts.get_content()}</text>`;
    }

}

export const make_text: Action = {
    use_gui: false,
    title: "add text",
    fun(node: TreeNode, state: GlobalState): void {
        let text = new TreeNodeImpl()
        text.title = 'text1'
        text.add_component(new TextShapeObject("text", 16, "center", 'center'))
        text.add_component(new BoundedShapeObject(new Rect(50, 50, 50, 30)))
        text.add_component(new MovableBoundedShape(text))
        text.add_component(new ResizableRectObject(text))
        text.add_component(new FilledShapeObject('#000000'))
        state.add_and_select(text,node)
    }
}

export class TextPowerup extends DefaultPowerup{
    init(state: GlobalState) {
        state.renderers.push(new TextRenderingSystem())
        state.svgexporters.push(new TextSVGExporter())
        state.pdfexporters.push(new TextPDFExporter())
        state.jsonexporters.push(new TextJSONExporter())
        // this.simple_comps.push()
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(PageName)) return [make_text]
        return []
    }

    override can_edit_by_name(comp: string): boolean {
        return comp === TextShapeName
    }
    override get_editor_by_name(name: string, state: GlobalState): any {
        return TextShapeEditor
    }
    override can_edit(comp: Component): boolean {
        return comp.name === TextShapeName
    }
    override get_editor(comp: Component, node: TreeNode, state: GlobalState): any {
        return TextShapeEditor
    }
    override can_serialize(comp: Component, node: TreeNode, state: GlobalState): boolean {
        if(comp instanceof TextShapeObject) return true
        return super.can_serialize(comp, node, state);
    }
    override serialize(comp: Component, node: TreeNode, state: GlobalState): any {
        if(comp instanceof TextShapeObject) {
            let tso = comp as TextShapeObject
            return {
                powerup:this.constructor.name,
                klass:comp.constructor.name,
                content:tso.get_content(),
                fontfamily:tso.get_fontfamily(),
                halign:tso.get_halign(),
                valign:tso.get_valign(),
                fontsize:tso.get_fontsize(),
            }
        }
        return super.serialize(comp, node, state);
    }
    override can_deserialize(obj: any, state: GlobalState): boolean {
        if(obj.name === TextShapeObject.name) return true
        return super.can_deserialize(obj, state);
    }
    override deserialize(obj: any, node:TreeNode, state: GlobalState): Component {
        if(obj.klass === TextShapeObject.name) {
            return new TextShapeObject(obj.content,obj.fontsize,obj.halign,obj.valign)
        }
        return super.deserialize(obj, node, state);
    }
}
