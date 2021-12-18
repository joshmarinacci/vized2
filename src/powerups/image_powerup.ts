import {
    add_child_to_parent,
    Component,
    DefaultPowerup,
    GlobalState,
    Handle, ImageReference,
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
import {make_image_file} from "./image_from_file";

const ImageShapeName = "ImageShapeName"
export interface ImageShape extends Component {
    get_aspect_ratio():number
}

export class ImageShapeObject implements ImageShape {
    name: string;
    private ow: number;
    private oh: number;
    aspect_ratio: number;
    imageid: string | null;
    url:string | null
    constructor() {
        this.name = ImageShapeName
        this.ow = 0
        this.oh = 0
        this.imageid = null
        this.aspect_ratio = 0
        this.url = null
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

    sync(img: ImageReference) {
        this.imageid = img.id
        this.ow = img.width
        this.oh = img.height
        this.aspect_ratio = this.ow/this.oh
        this.url = img.url
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
            if(state.image_ready(img.imageid)) {
                ctx.drawImage(state.get_DomImage(img.imageid), rect.x, rect.y, rect.w, rect.h)
            }
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
        if(state.image_ready(img.imageid)) {
            doc.addImage(state.get_DomImage(img.imageid), 'JPEG', obj.x, obj.y, obj.width, obj.height, null, 0)
        }
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

export function make_image_node(url: string, state:GlobalState): TreeNode {
    let image = new TreeNodeImpl()
    image.title = 'image'
    let iso = new ImageShapeObject()
    let bds = new BoundedShapeObject(new Rect(100, 100, 200, 200))
    state.add_image_from_url(url).then(img => {
        iso.sync(img)
        bds.get_bounds().w = img.width
        bds.get_bounds().h = img.height
    })
    image.add_component(iso)
    image.add_component(bds)
    image.add_component(new MovableBoundedShape(image))
    image.add_component(new ResizableImageObject(image))
    return image
}

export const make_image: Action = {
    use_gui: false,
    title: "add image",
    fun(node: TreeNode, state: GlobalState): void {
        let image = make_image_node("https://vr.josh.earth/assets/2dimages/saturnv.jpg",state)
        add_child_to_parent(image, node)
        state.dispatch('object-changed', {})
    }
}

export class ImagePowerup extends DefaultPowerup {
    init(state: GlobalState) {
        state.renderers.push(new ImageRendererSystem())
        state.svgexporters.push(new ImageSVGExporter())
        state.pdfexporters.push(new ImagePDFExporter())
    }

    child_options(node: TreeNode): Action[] {
        if(node.has_component(GroupShapeName) || node.has_component(PageName)) {
            return [make_image, make_image_file]
        }
        return [];
    }
}
