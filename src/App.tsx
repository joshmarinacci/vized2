import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import {
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    GlobalState,
    Point,
    Rect,
    TreeNode,
    TreeNodeImpl
} from "./common";
import {CanvasView} from "./canvas";
import {RectPowerup, RectShapeObject} from "./rect_powerup";
import {
    BoundedShape,
    BoundedShapeName,
    BoundedShapeObject,
    BoundedShapePowerup,
    MovableBoundedShape,
    ResizableRectObject
} from "./bounded_shape";
import {CirclePowerup, CircleShape, CircleShapeObject, MovableCircleObject} from "./circle_powerup";
import {MovableTextObject, TextPowerup, TextShapeObject} from "./text_powerup";
import {MovableSpiralObject, SpiralPowerup, SpiralShapeObject} from "./spiral";
import {export_JSON} from "./exporters/json";

function IDEGrid(props:{title:string, children:any[]}) {
  return <div className={'ide-grid'}>
    {props.children}
  </div>
}
function add_child_to_parent(child:TreeNode, parent:TreeNode):void {
    parent.children.push(child)
    child.parent = parent
}

export function make_default_tree() {
    let root:TreeNode = new TreeNodeImpl()
    root.components.push(new BoundedShapeObject(new Rect(0,0,300,300)))
    root.components.push(new RectShapeObject())
    root.components.push(new FilledShapeObject('white'))

    {
        let rect3 = new TreeNodeImpl()
        rect3.components.push(new RectShapeObject())
        rect3.components.push(new BoundedShapeObject(new Rect(10, 250, 100, 100)))
        rect3.components.push(new FilledShapeObject("#ff8855"))
        rect3.components.push(new MovableBoundedShape(rect3))
        rect3.components.push(new ResizableRectObject(rect3))
        add_child_to_parent(rect3, root)
    }
    {
        let rect1 = new TreeNodeImpl()
        rect1.components.push(new RectShapeObject())
        rect1.components.push(new BoundedShapeObject(new Rect(10, 10, 10, 10)))
        rect1.components.push(new FilledShapeObject("#ff0000"))
        rect1.components.push(new MovableBoundedShape(rect1))
        add_child_to_parent(rect1, root)
    }
    {
        let rect2: TreeNode = new TreeNodeImpl()
        rect2.components.push(new RectShapeObject())
        rect2.components.push(new BoundedShapeObject(new Rect(200, 30, 50, 50)))
        rect2.components.push(new FilledShapeObject('#0000FF'))
        rect2.components.push(new MovableBoundedShape(rect2))
        rect2.components.push(new ResizableRectObject(rect2))
        add_child_to_parent(rect2, root)
    }
    {
        let circ1: TreeNode = new TreeNodeImpl()
        circ1.components.push(new FilledShapeObject('#00FF00'))
        let circle_shape:CircleShape = new CircleShapeObject(new Point(100,100),20)
        circ1.components.push(circle_shape)
        circ1.components.push(new MovableCircleObject(circ1))
        add_child_to_parent(circ1, root)
    }
    {
        let text1 = new TreeNodeImpl() as TreeNode
        text1.components.push(new TextShapeObject("Greetings, Earthling!", 16, "center",'center'))
        text1.components.push(new BoundedShapeObject(new Rect(50,50,200,50)))
        text1.components.push(new MovableTextObject(text1))
        text1.components.push(new ResizableRectObject(text1))
        text1.components.push(new FilledShapeObject('#000000'))
        add_child_to_parent(text1,root)
    }
    {
        let spiral:TreeNode = new TreeNodeImpl()
        spiral.components.push(new FilledShapeObject('#000000'))
        spiral.components.push(new SpiralShapeObject(new Point(100,200),15))
        spiral.components.push(new MovableSpiralObject(spiral))
        add_child_to_parent(spiral,root)
    }

    return root
}

function make_greeting_card_tree():TreeNode {
    let root:TreeNode = new TreeNodeImpl()
    root.components.push(new BoundedShapeObject(new Rect(0,0,300,300)))
    root.components.push(new RectShapeObject())
    root.components.push(new FilledShapeObject('white'))


    return root
}

function TreeItem(props:{node:TreeNode}) {
    return <li onClick={()=>{
        console.log("selected an item")
    }}>
        {props.node.id}
    </li>
}
function TreeView(props:{root:TreeNode}) {
    return <div className={'panel left'}>
        {props.root.id}
        <ul>
            {props.root.children.map((ch,i) => {
                return <TreeItem key={i} node={ch}/>
            })}
        </ul>
    </div>
}

export function setup_state(root:TreeNode):GlobalState {
    let state:GlobalState = new GlobalState()
    state.set_root(root)
    // state.jsonexporters.push(new FilledShapeJSONExporter())
    state.powerups.push(new BoundedShapePowerup())
    state.powerups.push(new CirclePowerup())
    state.powerups.push(new RectPowerup())
    state.powerups.push(new TextPowerup())
    state.powerups.push(new SpiralPowerup())
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

function Toolbar(props:{children:any}) {
    return <div className={'toolbar'}>{props.children}</div>
}


function App() {
    const [root, set_root] = useState(()=> make_default_tree())
    let state = setup_state(root)
    let new_greeting_card = () => set_root(make_greeting_card_tree())
    let export_json = () => export_JSON(root,state);
    return (
        <div className="App">
            <IDEGrid title={"foo"}>
                <Toolbar>
                    <button onClick={new_greeting_card}>new card</button>
                    <button onClick={export_json}>JSON</button>
                </Toolbar>
                <Toolbar>
                    <label>canvas</label>
                </Toolbar>
                <Toolbar>
                    <label>props</label>
                </Toolbar>
                <TreeView root={root}/>
                <CanvasView root={root} state={state}/>
                <PropSheet root={root} state={state}/>
            </IDEGrid>
        </div>
    );
}

export default App;
