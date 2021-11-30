import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import {
    add_child_to_parent,
    DocMarker,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    GlobalState,
    PageMarker,
    Point,
    Rect,
    TreeNode,
    TreeNodeImpl
} from "./common";
import {CanvasView} from "./canvas";
import {RectPowerup, RectShapeObject} from "./powerups/rect_powerup";
import {
    BoundedShape,
    BoundedShapeName,
    BoundedShapeObject,
    BoundedShapePowerup,
    MovableBoundedShape,
    ResizableRectObject
} from "./bounded_shape";
import {
    CirclePowerup,
    CircleShape,
    CircleShapeObject,
    MovableCircleObject
} from "./powerups/circle_powerup";
import {TextPowerup, TextShapeObject} from "./powerups/text_powerup";
import {MovableSpiralObject, SpiralPowerup, SpiralShapeObject} from "./powerups/spiral";
import {export_JSON, FilledShapeJSONExporter} from "./exporters/json";
import {export_PDF, PDFExportBounds} from "./exporters/pdf";
import {export_SVG} from "./exporters/svg";
import {export_PNG} from "./exporters/png";
import {
    GroupParentTranslate,
    GroupPowerup,
    GroupShapeObject,
    MovableGroupShape
} from "./powerups/group_powerup";
import {ImagePowerup, ImageShapeObject, ResizableImageObject} from "./powerups/image_powerup";
import {Toolbar} from "./comps";
import {TreeView} from "./treeview";
import {PopupContainer, PopupContext, PopupContextImpl} from "./popup";
import {make_image_node} from "./actions";

function IDEGrid(props:{title:string, children:any[]}) {
  return <div className={'ide-grid'}>
    {props.children}
  </div>
}

export function make_default_tree() {
    let root:TreeNode = new TreeNodeImpl()
    root.title = 'root'
    root.components.push(new DocMarker())
    root.components.push(new PageMarker())
    root.components.push(new BoundedShapeObject(new Rect(0,0,8.5*100,11*100)))
    root.components.push(new PDFExportBounds("in",1/100))
    root.components.push(new RectShapeObject())
    root.components.push(new FilledShapeObject('white'))

    let group1 = new TreeNodeImpl()
    group1.title = 'group'
    group1.components.push(new GroupShapeObject(group1, new Point(100,50)))
    group1.components.push(new GroupParentTranslate(group1))
    group1.components.push(new MovableGroupShape(group1))
    add_child_to_parent(group1,root)

    {
        let rect1 = new TreeNodeImpl()
        rect1.title = 'rect'
        rect1.components.push(new RectShapeObject())
        rect1.components.push(new BoundedShapeObject(new Rect(10, 10, 10, 10)))
        rect1.components.push(new FilledShapeObject("#ff0000"))
        rect1.components.push(new MovableBoundedShape(rect1))
        add_child_to_parent(rect1, group1)
    }
    {
        let rect2: TreeNode = new TreeNodeImpl()
        rect2.title = 'rect'
        rect2.components.push(new RectShapeObject())
        rect2.components.push(new BoundedShapeObject(new Rect(200, 30, 50, 50)))
        rect2.components.push(new FilledShapeObject('#0000FF'))
        rect2.components.push(new MovableBoundedShape(rect2))
        rect2.components.push(new ResizableRectObject(rect2))
        add_child_to_parent(rect2, group1)
    }
    {
        let rect3: TreeNode = new TreeNodeImpl()
        rect3.title = 'rect'
        rect3.components.push(new RectShapeObject())
        rect3.components.push(new BoundedShapeObject(new Rect(50, 200, 50, 50)))
        rect3.components.push(new FilledShapeObject('#00FF00'))
        rect3.components.push(new MovableBoundedShape(rect3))
        rect3.components.push(new ResizableRectObject(rect3))
        add_child_to_parent(rect3, root)
    }
    {
        let circ1: TreeNode = new TreeNodeImpl()
        circ1.title = 'circle'
        circ1.components.push(new FilledShapeObject('#00FF00'))
        let circle_shape:CircleShape = new CircleShapeObject(new Point(100,100),20)
        circ1.components.push(circle_shape)
        circ1.components.push(new MovableCircleObject(circ1))
        add_child_to_parent(circ1, root)
    }
    {
        let spiral:TreeNode = new TreeNodeImpl()
        spiral.title = 'spiral'
        spiral.components.push(new FilledShapeObject('#000000'))
        spiral.components.push(new SpiralShapeObject(new Point(100,200),15))
        spiral.components.push(new MovableSpiralObject(spiral))
        add_child_to_parent(spiral,root)
    }

    {
        let image:TreeNode = new TreeNodeImpl()
        image.title = 'image'
        let url = "https://vr.josh.earth/assets/2dimages/saturnv.jpg"
        image.components.push(new ImageShapeObject(url,1000,1000))
        image.components.push(new BoundedShapeObject(new Rect(100,100,200,200)))
        image.components.push(new MovableBoundedShape(image))
        image.components.push(new ResizableImageObject(image))
        add_child_to_parent(image,root)
    }

    {
        let text1 = new TreeNodeImpl() as TreeNode
        text1.title = 'text1'
        text1.components.push(new TextShapeObject("Jesse", 16, "center",'center'))
        text1.components.push(new BoundedShapeObject(new Rect(50,150,200,200)))
        text1.components.push(new MovableBoundedShape(text1))
        text1.components.push(new ResizableRectObject(text1))
        text1.components.push(new FilledShapeObject('#000000'))
        add_child_to_parent(text1,root)
    }
    return root
}

function make_greeting_card_tree():TreeNode {
    let root:TreeNode = new TreeNodeImpl()
    root.title = 'root'
    root.components.push(new DocMarker())

    {
        let page1: TreeNode = new TreeNodeImpl()
        page1.title = 'front page'
        page1.components.push(new PageMarker())
        page1.components.push(new BoundedShapeObject(new Rect(0, 0, 8.5 * 100 / 2, 11 * 100 / 2)))
        page1.components.push(new PDFExportBounds("in", 1 / 100))
        page1.components.push(new RectShapeObject())
        page1.components.push(new FilledShapeObject('white'))
        add_child_to_parent(page1, root)

        let text1 = new TreeNodeImpl() as TreeNode
        text1.title = "Text: merry christmas"
        text1.components.push(new TextShapeObject("Merry Christmas", 30, "center", 'center'))
        text1.components.push(new BoundedShapeObject(new Rect(0, 100, 8.5 * 100 / 2, 200)))
        text1.components.push(new MovableBoundedShape(text1))
        text1.components.push(new ResizableRectObject(text1))
        text1.components.push(new FilledShapeObject('#00CC00'))
        add_child_to_parent(text1, page1)

        let img = make_image_node("https://vr.josh.earth/assets/2dimages/santa.png")
        add_child_to_parent(img,page1)

    }

    {
        let page2: TreeNode = new TreeNodeImpl()
        page2.title = 'front page'
        page2.components.push(new PageMarker())
        page2.components.push(new BoundedShapeObject(new Rect(0, 0, 8.5 * 100 / 2, 11 * 100 / 2)))
        page2.components.push(new PDFExportBounds("in", 1 / 100))
        page2.components.push(new RectShapeObject())
        page2.components.push(new FilledShapeObject('white'))
        add_child_to_parent(page2, root)

        let text2 = new TreeNodeImpl() as TreeNode
        text2.title = "Text: Happy NY"
        text2.components.push(new TextShapeObject("Happy NY", 30, "center", 'center'))
        text2.components.push(new BoundedShapeObject(new Rect(0, 250, 8.5 * 100 / 2, 200)))
        text2.components.push(new MovableBoundedShape(text2))
        text2.components.push(new ResizableRectObject(text2))
        text2.components.push(new FilledShapeObject('#00CC00'))
        add_child_to_parent(text2, page2)

        let img = make_image_node("https://vr.josh.earth/assets/2dimages/holly-leaves.png")
        add_child_to_parent(img,page2)
    }

    return root
}

export function setup_state(root:TreeNode):GlobalState {
    let state:GlobalState = new GlobalState()
    state.set_root(root)
    state.jsonexporters.push(new FilledShapeJSONExporter())
    state.powerups.push(new BoundedShapePowerup())
    state.powerups.push(new CirclePowerup())
    state.powerups.push(new RectPowerup())
    state.powerups.push(new TextPowerup())
    state.powerups.push(new SpiralPowerup())
    state.powerups.push(new GroupPowerup())
    state.powerups.push(new ImagePowerup())
    state.powerups.forEach(pow => pow.init(state))
    return state
}


function BoundedShapeEditor(props: { comp: BoundedShape, state:GlobalState }) {
    let rect = props.comp.get_bounds()
    return <div className={"prop-grid"}>
        <h3>Bounded Shape</h3>
        <label>x</label>
        <input value={rect.x}/>
        <label>y</label>
        <input value={rect.y}/>
        <label>w</label>
        <input value={rect.w}/>
        <label>h</label>
        <input value={rect.h}/>
    </div>
}

function FilledShapeEditor(props: { comp: FilledShape, state:GlobalState }) {
    let canvas = useRef<HTMLCanvasElement>(null)
    let size = 20
    let w = 100
    let wrap = Math.floor(w/size)
    const colors = [
        '#ff00ff','#ff0000',
        '#ffff00','#00ff00',
        '#00ffff','#0000ff',
        '#ffffff','#000000']

    const n2xy = (n:number) => ({
        x:n%wrap * size,
        y:Math.floor(n/wrap) * 20
    })
    const xy2n = (xy:Point) => {
        let x = Math.floor(xy.x/size)
        let y = Math.floor(xy.y/size)
        return x + y*wrap
    }
    const redraw = () => {
        if(canvas.current) {
            let can = canvas.current as HTMLCanvasElement
            let ctx = can.getContext('2d') as CanvasRenderingContext2D
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, can.width, can.height)
            colors.forEach((color,i)=>{
                ctx.fillStyle = color
                let pt = n2xy(i)
                ctx.fillRect(pt.x,pt.y,20,20)
                if(color === props.comp.get_color()) {
                    ctx.strokeStyle = 'black'
                    ctx.strokeRect(pt.x,pt.y,20,20)
                }
            })
        }
    }
    useEffect(()=>{
        redraw()
    })
    return <div className={"prop-grid"}>
        <h3>Filled Shape</h3>
        <canvas ref={canvas} width={100} height={60}
                onClick={(e)=>{
                    let target: HTMLElement = e.target as HTMLElement
                    let bounds = target.getBoundingClientRect()
                    let pt = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
                    let n = xy2n(pt)
                    if(n >= 0 && n < colors.length) {
                        let color = colors[n]
                        props.comp.set_color(color)
                        props.state.dispatch("prop-change", {})
                        redraw()
                    }
                }
            }
        />
    </div>
}

function PropSheet(props: { root: TreeNode, state: GlobalState }) {
    const [node, set_node] = useState<TreeNode|null>(null)
    useEffect(()=>{
        let op = () => {
            if(props.state.selection.isEmpty()) {
                set_node(null)
            } else {
                // @ts-ignore
                set_node(props.state.selection.get()[0])
            }
        }
        props.state.on("selection-change", op)
        return () => {
            props.state.off("selection-change",op)
        }
    })
    if(!node) {
        return <div className={'panel right'}>
            nothing selected
        </div>
    }

    return <div className={'panel right'}>
        {node.components.map((comp,i) => {
            if(comp.name === BoundedShapeName) return <BoundedShapeEditor key={i} comp={comp as BoundedShape} state={props.state}/>
            if(comp.name === FilledShapeName)  return <FilledShapeEditor  key={i} comp={comp as FilledShape}  state={props.state}/>
            return <div key={i}>component</div>
        })}
    </div>
}


function App() {
    const pc = new PopupContextImpl()
    const [root, set_root] = useState(()=> make_default_tree())
    let state = setup_state(root)
    let new_greeting_card = () => set_root(make_greeting_card_tree())
    let export_json = () => export_JSON(root,state);
    let export_pdf = () => export_PDF(root,state);
    let export_png = () => export_PNG(root,state);
    let export_svg = () => export_SVG(root,state);
    return (
        <PopupContext.Provider value={pc}>
        <div className="App">
            <IDEGrid title={"foo"}>
                <Toolbar>
                    <button onClick={new_greeting_card}>new card</button>
                    <button onClick={export_json}>JSON</button>
                    <button onClick={export_pdf}>PDF</button>
                    <button onClick={export_png}>PNG</button>
                    <button onClick={export_svg}>SVG</button>
                </Toolbar>
                <Toolbar>
                    <label>canvas</label>
                </Toolbar>
                <Toolbar>
                    <label>props</label>
                </Toolbar>
                <TreeView root={root} state={state}/>
                <CanvasView docroot={root} state={state}/>
                <PropSheet root={root} state={state}/>
            </IDEGrid>
            <PopupContainer/>
        </div>
        </PopupContext.Provider>
    );
}

export default App;
