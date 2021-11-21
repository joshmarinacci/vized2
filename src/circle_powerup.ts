import {
    Component,
    FilledShape,
    FilledShapeName, GlobalState,
    Movable,
    MovableName, PDFExporter,
    // PDFExporter,
    PickingSystem,
    Point,
    Powerup,
    PropRenderingSystem,
    RenderingSystem, SVGExporter,
    // SVGExporter,
    TreeNode
} from "./common";
// import {JSONExporter} from "./exporters/json.js";
// import {cssToPdfColor} from "./exporters/pdf.js";

const CircleShapeName = "CircleShapeName"
export interface CircleShape extends Component {
    get_position():Point
    get_radius():number
    set_radius(v:number): void;
}
export class CircleShapeObject implements CircleShape {
    name: string;
    private pos: Point;
    private radius: number;
    constructor(pos:Point, radius:number) {
        this.name = CircleShapeName
        this.pos = pos
        this.radius = radius
    }

    get_position(): Point {
        return this.pos
    }

    get_radius(): number {
        return this.radius
    }

    set_radius(v:number) {
        this.radius = v
    }

}

export const CircleRendererSystemName = 'CircleRendererSystemName'
export class CircleRendererSystem implements RenderingSystem {
    name: string

    constructor() {
        this.name = CircleRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state:GlobalState): void {
        if(node.has_component(CircleShapeName)) {
            let shape:CircleShape = <CircleShape>node.get_component(CircleShapeName)
            if(node.has_component(FilledShapeName)) {
                let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)
                ctx.fillStyle = color.get_color()
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.beginPath()
            ctx.arc(shape.get_position().x, shape.get_position().y,shape.get_radius(),0,Math.PI*2)
            ctx.fill()
            if(state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.stroke()
            }

        }
    }

}


const CirclePickSystemName = 'CirclePickSystemName';
export class CirclePickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = CirclePickSystemName
    }

    pick(pt: Point, state: GlobalState): TreeNode[] {
        let picked:TreeNode[] = []
        this._test_node(pt,state.get_root(),picked)
        return picked
    }

    private _test_node(pt:Point, node: TreeNode, collect:TreeNode[]) {
        if(node.has_component(CircleShapeName)) {
            let circle = (<CircleShape> node.get_component(CircleShapeName))
            let dist = circle.get_position().subtract(pt)
            if(dist.magnitude() < circle.get_radius()) {
                collect.push(node)
            }
        }
        node.children.forEach((ch:TreeNode) => {
            this._test_node(pt,ch,collect)
        })
    }
}


export class MovableCircleObject implements Movable {
    name: string;
    private readonly node: TreeNode;
    constructor(node:TreeNode) {
        this.node = node
        this.name = MovableName
    }
    moveBy(pt: Point): void {
        let circle:CircleShape = <CircleShape>this.node.get_component(CircleShapeName)
        circle.get_position().x += pt.x
        circle.get_position().y += pt.y
    }
}


export class CirclePropRendererSystem implements PropRenderingSystem {
    name: string;
    private state: GlobalState;
    constructor(state:GlobalState) {
        this.name = ""
        this.state = state
    }

    // render_view(comp: Component): HTMLElement {
        // let circle = (comp as CircleShape)
        // let x = LABEL("x")
        // let xbox = NUMBER_INPUT(circle.get_position().x,(v)=>{
        //     circle.get_position().x = v
        //     this.state.dispatch("refresh", {})
        // })
        // let y = LABEL("y")
        // let ybox = NUMBER_INPUT(circle.get_position().y,(v)=>{
        //     circle.get_position().y = v
        //     this.state.dispatch("refresh", {})
        // })
        // let r = LABEL("radius")
        // let rbox = NUMBER_INPUT(circle.get_radius(),(v)=>{
        //     circle.set_radius(v)
        //     this.state.dispatch("refresh", {})
        // })
        // return DIV(["prop-group"],[x,xbox,y,ybox,r,rbox])
    // }

    supports(name: string): any {
        if(name === CircleShapeName) return true
        return false
    }

}


export class CircleSVGExporter implements SVGExporter {
    name: string;
    constructor() {
        this.name = "CircleSVGExporter"
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(CircleShapeName)
    }

    toSVG(node: TreeNode): string {
        let circle: CircleShape = <CircleShape>node.get_component(CircleShapeName)
        let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)
        let obj:any = {
            cx:circle.get_position().x,
            cy:circle.get_position().y,
            r:circle.get_radius(),
            fill:color.get_color()
        }
        let pairs = Object.keys(obj).map(k => `${k}='${obj[k]}'`)
        return '<circle ' + pairs.join(" ") + "/>"
    }

}

export class CirclePDFExporter implements PDFExporter {
    name: string;
    constructor() {
        this.name = "CirclePDFExporter"
    }

    canExport(node: TreeNode): boolean {
        return node.has_component(CircleShapeName)
    }

    toPDF(node: TreeNode, doc:any): void {
        let circle: CircleShape = <CircleShape>node.get_component(CircleShapeName)
        let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)

        let obj = {
            cx:circle.get_position().x,
            cy:circle.get_position().y,
            r:circle.get_radius(),
            fill:color.get_color()
        }
        // let pdf_color = cssToPdfColor(obj.fill)
        // doc.setFillColor(...pdf_color)
        doc.circle(obj.cx,obj.cy, obj.r, "FD");
    }
}

export class CirclePowerup implements Powerup {
    init(state: GlobalState) {
        // state.props_renderers.push(new CirclePropRendererSystem(state))
        state.pickers.push(new CirclePickSystem())
        state.renderers.push(new CircleRendererSystem())
        // state.svgexporters.push(new CircleSVGExporter())
        // state.pdfexporters.push(new CirclePDFExporter())
        // state.jsonexporters.push(new CircleShapeJSONExporter())
    }

}

// export class CircleShapeJSONExporter implements JSONExporter {
//     name: string;
//
//     toJSON(component: Component, node:TreeNode): any {
//         if(component.name === MovableName) return {name:component.name, empty:true, powerup:'circle'}
//         let circle = component as CircleShape
//         return {
//             name:circle.name,
//             position:circle.get_position(),
//             radius:circle.get_radius(),
//         }
//     }
//
//     fromJSON(obj: any, node:TreeNode): Component {
//         if(obj.name === MovableName) return new MovableCircleObject(node)
//         if(obj.name === CircleShapeName) return new CircleShapeObject((new Point(0,0)).from_object(obj.position),obj.radius)
//     }
//
//     canHandleFromJSON(obj: any, node: TreeNode): boolean {
//         if(obj.name === MovableName && obj.powerup === 'circle') return true
//         return obj.name === CircleShapeName
//     }
//
//     canHandleToJSON(comp: any, node: TreeNode): boolean {
//         if(comp.name === MovableName && node.has_component(CircleShapeName)) return true
//         return comp.name === CircleShapeName
//     }
//
// }
