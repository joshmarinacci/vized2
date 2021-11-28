import {
    Component, GlobalState, Handle,
    Point, Powerup,
    RenderingSystem, Resizable, ResizableName, TreeNode
} from "./common"
import {BoundedShape, BoundedShapeName} from "./bounded_shape";
import {cssToPdfColor, PDFExporter} from "./exporters/pdf";
import {SVGExporter} from "./exporters/svg";

const ImageShapeName = "ImageShapeName"
export interface ImageShape extends Component {
    get_aspect_ratio():number
}

export class ImageShapeObject implements ImageShape {
    name: string;
    private url: any;
    private ow: any;
    private oh: any;
    dom_image: HTMLImageElement;
    aspect_ratio: number;
    constructor(url:string,w:number,h:number) {
        this.name = ImageShapeName
        this.url = url
        this.ow = w
        this.oh = h
        this.aspect_ratio = w/h
        this.dom_image = new Image()
        this.dom_image.crossOrigin = "anonymous"
        this.dom_image.addEventListener('load',()=>{
            console.log("image loaded",this.dom_image)
        })
        this.dom_image.src = this.url
    }

    get_size():Point {
        return new Point(this.ow,this.oh)
    }

    get_aspect_ratio(): number {
        return this.aspect_ratio;
    }

    get_url() {
        return this.url
    }
}

export class ImageShapeHandle extends Handle {
    private node: TreeNode;
    constructor(node:TreeNode) {
        super(0,0);
        this.node = node
    }
    override moveBy(diff: Point) {
        this.x += diff.x
        this.y += diff.y
        this.update_to_node()
    }
    update_from_node() {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        this.x = bd.get_bounds().x + bd.get_bounds().w - 5
        this.y = bd.get_bounds().y + bd.get_bounds().h - 5
    }

    private update_to_node() {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        let bdd = bd.get_bounds()
        bdd.w = this.x - bdd.x + this.w / 2
        bdd.h = this.y - bdd.y + this.h / 2
        let img = this.node.get_component(ImageShapeName) as ImageShape
        let rat = img.get_aspect_ratio()
        bdd.h = bdd.w*rat
    }
}

export class ResizableImageObject implements Resizable {
    name: string;
    private node: TreeNode;
    private handle: ImageShapeHandle;
    constructor(node:TreeNode) {
        this.node = node
        this.name = ResizableName
        this.handle = new ImageShapeHandle(this.node)
    }

    get_handle(): Handle {
        this.handle.update_from_node()
        return this.handle
    }

}

// export class ImagePropRendererSystem implements PropRenderingSystem {
//     name: string;
//     private state: GlobalState;
//     constructor(state:GlobalState) {
//         this.state = state
//     }
//
//     render_view(comp: Component): HTMLElement {
//         let image = (comp as ImageShapeObject)
//         let x = LABEL("w")
//         let xbox = NUMBER_INPUT(image.get_size().x)
//         let y = LABEL("h")
//         let ybox = NUMBER_INPUT(image.get_size().y)
//         let url_lable = LABEL("url")
//         let url_box = STRING_INPUT(image.get_url())
//         return DIV(["prop-group"],[x,xbox,y,ybox,url_lable,url_box])
//     }
//
//     supports(name: string): any { return (name === ImageShapeName)  }
//
// }

const ImageRendererSystemName = 'ImageRendererSystemName'
export class ImageRendererSystem implements RenderingSystem {
    constructor() {
        this.name = ImageRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(BoundedShapeName) && node.has_component(ImageShapeName)) {
            let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
            let rect = bd.get_bounds()

            let img:ImageShapeObject = node.get_component(ImageShapeName) as ImageShapeObject
            ctx.fillStyle = 'magenta'
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            ctx.drawImage(img.dom_image,rect.x,rect.y,rect.w,rect.h)
            // console.log('aspect ratio',img.aspect_ratio)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
        }
    }

    name: string;
}

export class ImagePDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = 'ImagePDFExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(BoundedShapeName) && node.has_component(ImageShapeName)
    }

    toPDF(node: TreeNode, state:GlobalState, doc: any,scale:number): void {
        let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
        let img:ImageShapeObject = node.get_component(ImageShapeName) as ImageShapeObject
        let rect = bd.get_bounds().scale(scale)
        let obj = {
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.h,
        }
        let pdf_color = cssToPdfColor('#ff00ff')
        doc.setFillColor(...pdf_color)
        doc.rect(obj.x,obj.y,obj.width,obj.height,"FD")
        doc.addImage(img.dom_image,'JPEG',obj.x,obj.y,obj.width,obj.height,'NONE',0)

    }

}


class ImageSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = 'ImageSVGExporter'
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(BoundedShapeName) && node.has_component(ImageShapeName)
    }

    toSVG(node: TreeNode): string {
        let img:ImageShapeObject = node.get_component(ImageShapeName) as ImageShapeObject
        let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
        let rect = bd.get_bounds()

        return `<image x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" href="${img.get_url()}"/>`
    }
}

export class ImagePowerup implements Powerup {
    init(state: GlobalState) {
        state.renderers.push(new ImageRendererSystem())
        // state.props_renderers.push(new ImagePropRendererSystem(state))
        state.svgexporters.push(new ImageSVGExporter())
        state.pdfexporters.push(new ImagePDFExporter())
        // state.jsonexporters.push(new RectJsonExporter())
    }
}
