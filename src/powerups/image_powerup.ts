import {
    add_child_to_parent,
    Component,
    DefaultPowerup,
    GlobalState,
    Handle,
    PageName,
    Point,
    Rect,
    RenderingSystem,
    Resizable,
    ResizableName,
    TreeNode,
    TreeNodeImpl
} from "../common"
import {
    BoundedShape,
    BoundedShapeName,
    BoundedShapeObject,
    MovableBoundedShape
} from "../bounded_shape";
import {PDFExporter} from "../exporters/pdf";
import {SVGExporter} from "../exporters/svg";
import {Action} from "../actions";
import {GroupShapeName} from "./group_powerup";

const ImageShapeName = "ImageShapeName"
export interface ImageShape extends Component {
    get_aspect_ratio():number
}

export class ImageShapeObject implements ImageShape {
    name: string;
    private url: any;
    private ow: number;
    private oh: number;
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
            console.log("image loaded",this.dom_image.width,this.dom_image.height)
            this.ow = this.dom_image.width
            this.oh = this.dom_image.height
            this.aspect_ratio = this.ow/this.oh
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
        bdd.w = bdd.h*rat
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

const ImageRendererSystemName = 'ImageRendererSystemName'
export class ImageRendererSystem implements RenderingSystem {
    constructor() {
        this.name = ImageRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(BoundedShapeName) && node.has_component(ImageShapeName)) {
            let bd: BoundedShape = node.get_component(BoundedShapeName) as BoundedShape
            let rect = bd.get_bounds()

            let img:ImageShapeObject = node.get_component(ImageShapeName) as ImageShapeObject
            ctx.fillStyle = 'magenta'
            // ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
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
        let bd: BoundedShape = node.get_component(BoundedShapeName) as BoundedShape
        let img:ImageShapeObject = node.get_component(ImageShapeName) as ImageShapeObject
        let rect = bd.get_bounds().scale(scale)
        let obj = {
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.h,
        }
        // let pdf_color = cssToPdfColor('#ff00ff')
        // doc.setFillColor(...pdf_color)
        // doc.rect(obj.x,obj.y,obj.width,obj.height,"FD")
        doc.addImage(img.dom_image,'JPEG',obj.x,obj.y,obj.width,obj.height,null,0)
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
        let bd: BoundedShape = node.get_component(BoundedShapeName) as BoundedShape
        let rect = bd.get_bounds()

        return `<image x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" href="${img.get_url()}"/>`
    }
}

export function make_image_node(url: string): TreeNode {
    let image: TreeNode = new TreeNodeImpl()
    image.title = 'image'
    image.components.push(new ImageShapeObject(url, 1000, 1000))
    image.components.push(new BoundedShapeObject(new Rect(100, 100, 200, 200)))
    image.components.push(new MovableBoundedShape(image))
    image.components.push(new ResizableImageObject(image))
    return image
}

export const make_image: Action = {
    title: "add image",
    fun(node: TreeNode, state: GlobalState): void {
        let image = make_image_node("https://vr.josh.earth/assets/2dimages/saturnv.jpg")
        add_child_to_parent(image, node)
        state.dispatch('object-changed', {})
    }
}

export class ImagePowerup extends DefaultPowerup{
    init(state: GlobalState) {
        state.renderers.push(new ImageRendererSystem())
        state.svgexporters.push(new ImageSVGExporter())
        state.pdfexporters.push(new ImagePDFExporter())
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(GroupShapeName) || node.has_component(PageName)) {
            return [make_image]
        }
        return [];
    }
}
