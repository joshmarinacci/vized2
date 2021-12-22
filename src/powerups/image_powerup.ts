import {
    add_child_to_parent,
    Component,
    DefaultPowerup,
    GlobalState,
    Handle, ImageReference, Movable, MovableName, MultiComp,
    PageName, ParentLikeName,
    Point,
    Rect, RenderBounds, RenderBoundsName,
    RenderingSystem,
    Resizable,
    ResizableName,
    TreeNode,
    TreeNodeImpl
} from "../common"
import {
    BoundedShape,
    BoundedShapeName
} from "../bounded_shape";
import {PDFContext, PDFExporter} from "../exporters/pdf";
import {SVGExporter} from "../exporters/svg";
import {Action} from "../actions";
import {make_image_file} from "./image_from_file";

const ImageShapeName = "ImageShapeName"
export interface ImageShape extends Component {
    get_aspect_ratio():number
}

export class ImageShapeObject implements MultiComp, ImageShape, BoundedShape, RenderBounds, Movable {
    name: string;
    private position:Point
    img: ImageReference
    private scale:number
    constructor() {
        this.name = ImageShapeName
        this.position = new Point(0,0)
        this.scale = 1
        // @ts-ignore
        this.img = null
    }

    //multi
    isMulti(): boolean {
        return true
    }
    supports(): string[] {
        return [ImageShapeName, BoundedShapeName, RenderBoundsName, MovableName]
    }

    // image
    setImage(img: ImageReference) {
        this.img = img
    }
    get_aspect_ratio(): number {
        return this.img.width/this.img.height
    }

    //bounded & render bounds
    get_bounds(): Rect {
        if(!this.img) return new Rect(this.position.x,this.position.y,10,10)
        return new Rect(this.position.x,this.position.y,this.img.width*this.scale,this.img.height*this.scale)
    }

    //movable
    moveBy(pt: Point): void {
        this.position = this.position.add(pt)
    }

    set_scale(scale: number) {
        this.scale = scale
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
        let bd = (this.node.get_component(ImageShapeName) as ImageShapeObject).get_bounds()
        this.x = bd.x + bd.w - 5
        this.y = bd.y + bd.h - 5
    }

    private update_to_node() {
        let iso = this.node.get_component(ImageShapeName) as ImageShapeObject
        let w = this.x - iso.get_bounds().x
        let scale = w/iso.img.width
        iso.set_scale(scale)
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
            let img = node.get_component(ImageShapeName) as ImageShapeObject
            let rect = img.get_bounds()
            ctx.fillStyle = 'magenta'
            // ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            if(img.img && state.image_ready(img.img.id)) {
                ctx.drawImage(state.get_DomImage(img.img.id), rect.x, rect.y, rect.w, rect.h)
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

    toPDF(ctx:PDFContext, node: TreeNode, state:GlobalState): void {
        let bd: BoundedShape = node.get_component(BoundedShapeName) as BoundedShape
        let img:ImageShapeObject = node.get_component(ImageShapeName) as ImageShapeObject
        let rect = bd.get_bounds().scale(ctx.scale)
        // let obj = {
        //     x:rect.x,
        //     y:rect.y,
        //     width:rect.w,
        //     height:rect.h,
        // }
        // let pdf_color = cssToPdfColor('#ff00ff')
        // doc.setFillColor(...pdf_color)
        // doc.rect(obj.x,obj.y,obj.width,obj.height,"FD")
        // if(state.image_ready(img.imageid)) {
            // ctx.currentPage.addImage(state.get_DomImage(img.imageid), 'JPEG', obj.x, obj.y, obj.width, obj.height, null, 0)
        // }
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
        return `<image x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" href="${img.img.url}"/>`
    }
}

export function make_image_node(url: string, state:GlobalState, initalScale:number = 1.0): TreeNode {
    let image = new TreeNodeImpl()
    image.title = 'image'
    let iso = new ImageShapeObject()
    iso.set_scale(initalScale)
    state.add_image_from_url(url).then(img => iso.setImage(img))
    image.add_component(iso)
    image.add_component(new ResizableImageObject(image))
    return image
}

export const make_image: Action = {
    use_gui: false,
    title: "add image",
    fun(node: TreeNode, state: GlobalState): void {
        let image = make_image_node("https://vr.josh.earth/assets/2dimages/saturnv.jpg",state, 0.2)
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
        if(node.has_component(ParentLikeName) || node.has_component(PageName)) {
            return [make_image, make_image_file]
        }
        return [];
    }
}
