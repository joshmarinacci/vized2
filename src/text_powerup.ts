import {
    Component,
    FilledShape, FilledShapeName, GlobalState,
    Movable,
    MovableName,
    PDFExporter,
    Point,
    Powerup,
    // PropRenderingSystem,
    Rect,
    RenderingSystem,
    ResizableName,
    SVGExporter,
    TreeNode
} from "./common";
// import {JSONExporter} from "./exporters/json.js";
// import {cssToPdfColor} from "./exporters/pdf.js";
import {BoundedShape, BoundedShapeName, BoundedShapeObject} from "./bounded_shape";

const TextShapeName = "TextShapeName"
interface TextShape extends Component {
    get_content():string
    set_content(content:string):void
    get_fontsize():number
    set_fontsize(size:number):void
    get_halign(): string;
    set_halign(halign:string): void;
    get_valign(): string;
    set_valign(valign:string):void
}

export class TextShapeObject implements TextShape {
    name: string;
    private content: string;
    private fontsize: number;
    private halign: string;
    private valign: string;
    constructor(content:string, size:number, halign:string, valign:string) {
        this.name = TextShapeName
        this.content = content
        this.fontsize = size
        this.halign = halign
        this.valign = valign
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
            ctx.fillStyle = fill.get_color()
            ctx.font = `${tn.get_fontsize()}pt sans-serif`
            let metrics = ctx.measureText(tn.get_content())
            // console.log("metrics are",metrics)
            let h_offset = 0
            if(tn.get_halign() === "right") {
                h_offset = bounds.w - metrics.width
            }
            if(tn.get_halign() === "center") {
                h_offset = (bounds.w - metrics.width)/2
            }
            let v_offset = 0
            if(tn.get_valign() === 'top') {
                v_offset = metrics.actualBoundingBoxAscent
            }
            if(tn.get_valign() === 'center') {
                v_offset = (bounds.h - (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) /2 + metrics.actualBoundingBoxAscent
            }
            if(tn.get_valign() === 'bottom') {
                v_offset = (bounds.h - (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) + metrics.actualBoundingBoxAscent
            }
            ctx.fillText(tn.get_content(),h_offset,v_offset )
            ctx.restore()
            if (state.selection.has(node)) {
                ctx.save()
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h)//h_offset, v_offset, rect.w, rect.h)
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
        let bd:BoundedShape = <BoundedShape>this.node.get_component(BoundedShapeName)
        bd.get_bounds().x += pt.x
        bd.get_bounds().y += pt.y
    }
}

// export class TextPropRendererSystem implements PropRenderingSystem {
//     name: string;
//     private state: GlobalState;
//     constructor(state:GlobalState) {
//         this.name = 'TextPropRendererSystem'
//         this.state = state
//     }
//
//     // render_view(comp: Component): HTMLElement {
//     //     let tn = (comp as TextShape)
//     //     let content_label = LABEL("content")
//     //     let content_input = STRING_INPUT(tn.get_content(),(v)=>{
//     //         tn.set_content(v)
//     //         this.state.dispatch("prop-change", {})
//     //     })
//     //     let font_size_label = LABEL("fontsize")
//     //     let font_size_input = NUMBER_INPUT(tn.get_fontsize(),(v)=>{
//     //         tn.set_fontsize(v)
//     //         this.state.dispatch("prop-change", {})
//     //     })
//     //     let halign_label = LABEL("halign")
//     //     let halign_input = CHOICE_INPUT(tn.get_halign(),['left','center','right'],(v)=>{
//     //         tn.set_halign(v)
//     //         this.state.dispatch("prop-change", {})
//     //     })
//     //     let valign_label = LABEL("valign")
//     //     let valign_input = CHOICE_INPUT(tn.get_valign(),['top','center','bottom'],(v)=>{
//     //         tn.set_valign(v)
//     //         this.state.dispatch("prop-change", {})
//     //     })
//     //     return DIV(["prop-group"],[content_label,content_input,font_size_label,font_size_input,halign_label,halign_input,valign_label,valign_input])
//     // }
//
//     supports(name: string): any {
//         if(name === TextShapeName) return true
//         return false
//     }
//
// }


// class TextJSONExporter implements JSONExporter {
//     name: string;
//
//     canHandleFromJSON(obj: any, node: TreeNode): boolean {
//         if(obj.name === TextShapeName) return true
//         if(obj.name === MovableName && obj.powerup==='text') return true
//         return false;
//     }
//
//     canHandleToJSON(comp: any, node: TreeNode): boolean {
//         if(comp.name === TextShapeName) return true
//         if(comp.name === MovableName && node.has_component(BoundedShapeName)) return true
//         return false;
//     }
//
//     fromJSON(obj: any, node: TreeNode): Component {
//         if(obj.name === MovableName) return new MovableTextObject(node)
//         if(obj.name === BoundedShapeName) return new BoundedShapeObject(new Rect(obj.x,obj.y,obj.width,obj.height))
//         if(obj.name === TextShapeName) return new TextShapeObject(obj.content,obj.fontsize, obj.halign, obj.valign)
//     }
//
//     toJSON(component: Component, node: TreeNode): any {
//         if(component.name === ResizableName) return {name:component.name, empty:true, powerup:'text'}
//         if(component.name === MovableName) return {name:component.name, empty:true, powerup:'text'}
//         if(component.name === TextShapeName) {
//             let ts:TextShapeObject = <TextShapeObject>component
//             return {
//                 name:TextShapeName,
//                 content:ts.get_content(),
//                 fontsize:ts.get_fontsize(),
//                 halign:ts.get_halign(),
//                 valign:ts.get_valign()
//             }
//         }
//         if(component.name === BoundedShapeName) {
//             let bd: BoundedShape = <BoundedShape>component
//             let rect = bd.get_bounds()
//             return {
//                 name: BoundedShapeName,
//                 x: rect.x,
//                 y: rect.y,
//                 width: rect.w,
//                 height: rect.w,
//                 powerup: 'text',
//             }
//         }
//     }
// }

// class TextPDFExporter implements PDFExporter {
//     name: string;
//
//     canExport(node: TreeNode): boolean {
//         return node.has_component(TextShapeName)
//     }
//
//     toPDF(node: TreeNode, doc: any): void {
//         console.log("rendering text to pdf right here",node,doc)
//         // console.log("list of fonts", doc.getFontList())
//         let ts: TextShape = node.get_component(TextShapeName) as TextShape
//         let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
//         let rect = bd.get_bounds()
//         let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)
//         let pdf_color = cssToPdfColor('#00ff00')
//         doc.setFontSize(ts.get_fontsize())
//         doc.setFillColor(...pdf_color)
//         doc.text(ts.get_content(), rect.x, rect.y)
//     }
// }

// class TextSVGExporter implements SVGExporter {
//     name: string;
//
//     canExport(node: TreeNode): boolean {
//         return node.has_component(TextShapeName)
//     }
//
//     toSVG(node: TreeNode): string {
//         let ts:TextShape = node.get_component(TextShapeName) as TextShape
//         let bs = node.get_component(BoundedShapeName) as BoundedShape
//         let bounds = bs.get_bounds()
//         return `<text x="${bounds.x}" y="${bounds.y}" font-size="${ts.get_fontsize()}">${ts.get_content()}</text>`;
//     }
//
// }

export class TextPowerup implements Powerup {
    init(state: GlobalState) {
        // state.props_renderers.push(new TextPropRendererSystem(state))
        state.renderers.push(new TextRenderingSystem())
        // state.svgexporters.push(new TextSVGExporter())
        // state.pdfexporters.push(new TextPDFExporter())
        // state.jsonexporters.push(new TextJSONExporter())
    }

}
