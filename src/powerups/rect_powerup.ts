import {
    Component,
    FilledShape,
    FilledShapeName,
    GlobalState,
    MovableName,
    PDFExporter,
    Powerup,
    Rect,
    RenderingSystem,
    ResizableName,
    SVGExporter,
    TreeNode
} from "../common";
import {cssToPdfColor} from "../exporters/pdf";
import {
    BoundedShape,
    BoundedShapeName,
    BoundedShapeObject,
    MovableBoundedShape,
    ResizableRectObject
} from "../bounded_shape";
import {JSONExporter} from "../exporters/json";

const RectShapeName = "RectShape"
interface RectShape extends Component {
}
export class RectShapeObject implements RectShape {
    name: string;
    constructor() {
        this.name = RectShapeName
    }
}
const RectRendererSystemName = 'RectRendererSystemName'
export class RectRendererSystem implements RenderingSystem {
    constructor() {
        this.name = RectRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(BoundedShapeName) && node.has_component(RectShapeName)) {
            let bd: BoundedShape = node.get_component(BoundedShapeName) as BoundedShape
            let rect = bd.get_bounds()

            if (node.has_component(FilledShapeName)) {
                ctx.fillStyle = (node.get_component(FilledShapeName) as FilledShape).get_color()
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
        }
    }

    name: string;
}

export class RectSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = 'RectSVGExporter'
    }



    canExport(node: TreeNode): boolean {
        return node.has_component(BoundedShapeName) && node.has_component(RectShapeName)
    }

    toSVG(node: TreeNode): string {
        let rect = (node.get_component(BoundedShapeName) as BoundedShape).get_bounds()
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let obj = {
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.w,
            fill:color.get_color()
        }
        // @ts-ignore
        let pairs = Object.keys(obj).map(k => `${k}='${obj[k]}'`)
        return '<rect ' + pairs.join(" ") + "/>"
    }

}

export class RectPDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = 'RectPDFExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(BoundedShapeName) && node.has_component(RectShapeName)
    }

    toPDF(node: TreeNode, state:GlobalState, doc:any, scale:number ): void {
        let bd = (node.get_component(BoundedShapeName) as BoundedShape)
        let rect = bd.get_bounds().scale(scale)
        let color: FilledShape = node.get_component(FilledShapeName) as FilledShape
        let obj = {
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.w,
            fill:color.get_color()
        }
        let pdf_color = cssToPdfColor(obj.fill)
        doc.setFillColor(...pdf_color)
        doc.rect(obj.x,obj.y,obj.width,obj.height,"F")
    }

}

export class RectJsonExporter implements JSONExporter {
    name: string;
    constructor() {
        this.name = 'RectJSONExporter'
    }

    toJSON(component: Component, node:TreeNode): any {
        if(component.name === ResizableName) return {name:component.name, empty:true, powerup:'rect'}
        if(component.name === MovableName) return {name:component.name, empty:true, powerup:'rect'}
        if(component.name === RectShapeName) return {name:component.name, empty:true, powerup:'rect'}
        if(component.name === BoundedShapeName) {
            let bd: BoundedShape = component as BoundedShape
            let rect = bd.get_bounds()
            return {
                name: BoundedShapeName,
                x: rect.x,
                y: rect.y,
                width: rect.w,
                height: rect.h,
                powerup: 'rect',
            }
        }
    }

    fromJSON(obj: any, node:TreeNode): Component {
        if(obj.name === RectShapeName) return new RectShapeObject()
        if(obj.name === ResizableName) return new ResizableRectObject(node)
        if(obj.name === MovableName) return new MovableBoundedShape(node)
        if(obj.name === BoundedShapeName) return new BoundedShapeObject(new Rect(obj.x,obj.y,obj.width,obj.height))
        throw new Error(`cannot export json for ${obj.name}`)
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        if(obj.name === RectShapeName && obj.powerup === 'rect') return true
        if(obj.name === ResizableName && obj.powerup==='rect') return true
        if(obj.name === MovableName && obj.powerup==='rect') return true
        if(obj.name === BoundedShapeName && obj.powerup === 'rect') return true
        return false
    }

    canHandleToJSON(comp: any, node: TreeNode): boolean {
        if(comp.name === BoundedShapeName) return true
        if(comp.name === RectShapeName) return true
        if(comp.name === ResizableName && node.has_component(RectShapeName)) return true
        if(comp.name === MovableName && node.has_component(RectShapeName)) return true
        return false;
    }

}

export class RectPowerup implements Powerup {
    init(state: GlobalState) {
        state.renderers.push(new RectRendererSystem())
        state.svgexporters.push(new RectSVGExporter())
        state.pdfexporters.push(new RectPDFExporter())
        state.jsonexporters.push(new RectJsonExporter())
    }
}
