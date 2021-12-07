import {
    add_child_to_parent,
    Component,
    DefaultPowerup,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    GlobalState,
    Movable,
    MovableName, PageName,
    PDFExporter,
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
import {cssToPdfColor} from "../exporters/pdf";
import {JSONExporter} from "../exporters/json";
import {Action} from "../actions";
import {TextShapeEditor} from "./text_editor";

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

function layout_text_lines(text: string, max_width: number, line_height: number, ctx: CanvasRenderingContext2D):string[] {
    let lines = []
    let current_line = ""
    let words = text.split(" ")
    for(let i=0; i<words.length; i++) {
        let word = words[i]
        let test_line = current_line
        if(test_line.length > 0) test_line += ' '
        test_line += word
        let metrics = ctx.measureText(test_line)
        if(metrics.width > max_width) {
            //end line now
            lines.push(current_line)
            current_line = word
            continue
        }
        if(current_line.length > 0) current_line += ' '
        current_line += word
    }
    lines.push(current_line)
    return lines
}

function calc_text_size(lines: string[], ctx: CanvasRenderingContext2D, line_height:number) {
    let longest = 0
    let total_height = 0
    lines.forEach(line => {
        longest = Math.max(longest,ctx.measureText(line).width)
        total_height += line_height
    })
    return {
        width:longest,
        height:total_height,
    }
}

class TextRenderingSystem implements RenderingSystem {
    name: string;
    constructor() {
        this.name = 'TextRenderingSystem'
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if(node.has_component(TextShapeName) && node.has_component(BoundedShapeName)) {
            ctx.save()
            let bs = node.get_component(BoundedShapeName) as BoundedShape
            let tn = node.get_component(TextShapeName) as TextShape
            let fill = node.get_component(FilledShapeName) as FilledShape

            let bounds = bs.get_bounds()
            ctx.translate(bounds.x, bounds.y)
            ctx.fillStyle = fill.get_fill()
            ctx.font = `${tn.get_fontsize()}pt ${tn.get_fontfamily()}`
            let line_height = tn.get_fontsize()*1.5
            let lines = layout_text_lines(tn.get_content(), bounds.w, line_height, ctx)
            let metrics = calc_text_size(lines,ctx, line_height)
            const h_aligns = { left:0.0, center:0.5, right:1.0 }
            const v_aligns = { top:0.0, center:0.5, bottom:1.0 }
            // @ts-ignore
            let h_offset = h_aligns[tn.get_halign()]*(bounds.w-metrics.width)
            // @ts-ignore
            let v_offset = v_aligns[tn.get_valign()]*(bounds.h - metrics.height)
            ctx.translate(h_offset,v_offset)
            lines.forEach((line,i)=> ctx.fillText(line,0,line_height*(i+1)))
            ctx.restore()
            if (state.selection.has(node)) {
                ctx.save()
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h)
                ctx.restore()
            }
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

    toPDF(node: TreeNode, state:GlobalState, doc:any, scale:number ): void {
        // console.log("rendering text to pdf right here",node,doc)
        // console.log("list of fonts", doc.getFontList())
        let ts: TextShape = node.get_component(TextShapeName) as TextShape
        let bd: BoundedShape = node.get_component(BoundedShapeName) as BoundedShape
        let rect = bd.get_bounds().scale(scale)
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let pdf_color = cssToPdfColor(color.get_fill())
        let dim = doc.getTextDimensions(ts.get_content())
        let h_offset = 0
        if(ts.get_halign() === "right") {
            h_offset = rect.w - dim.w
        }
        if(ts.get_halign() === "center") {
            h_offset = (rect.w - dim.w)/2
        }
        let v_offset = 0
        if(ts.get_valign() === 'top') {
            v_offset = 0//metrics.actualBoundingBoxAscent
        }
        if(ts.get_valign() === 'center') {
            v_offset = (rect.h - dim.h)/2
        }
        if(ts.get_valign() === 'bottom') {
            v_offset = (rect.h - dim.h)
        }
        // let metrics = ctx.measureText(tn.get_content())
        // console.log("metrics are",metrics)
        doc.setFontSize(ts.get_fontsize())
        doc.setFillColor(...pdf_color)
        doc.text(ts.get_content(), rect.x+h_offset, rect.y+rect.h+v_offset)
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
        let text = new TreeNodeImpl() as TreeNode
        text.title = 'text1'
        text.components.push(new TextShapeObject("text", 16, "center", 'center'))
        text.components.push(new BoundedShapeObject(new Rect(50, 50, 50, 30)))
        text.components.push(new MovableBoundedShape(text))
        text.components.push(new ResizableRectObject(text))
        text.components.push(new FilledShapeObject('#000000'))
        add_child_to_parent(text, node)
        state.dispatch('object-changed', {})
    }
}

export class TextPowerup extends DefaultPowerup{
    init(state: GlobalState) {
        state.renderers.push(new TextRenderingSystem())
        state.svgexporters.push(new TextSVGExporter())
        state.pdfexporters.push(new TextPDFExporter())
        state.jsonexporters.push(new TextJSONExporter())
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(PageName)) return [make_text]
        return []
    }

    override can_edit(comp: Component): boolean {
        return comp.name === TextShapeName
    }

    override get_editor(comp: Component, node: TreeNode, state: GlobalState): any {
        return TextShapeEditor
    }
}
