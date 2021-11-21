import React from 'react';
import './App.css';
import {FilledShapeObject, GlobalState, Point, Rect, TreeNode, TreeNodeImpl} from "./common";
import {CanvasView} from "./canvas";
import {RectPowerup, RectShapeObject} from "./rect_powerup";
import {
    BoundedShapeObject,
    BoundedShapePowerup,
    MovableBoundedShape,
    ResizableRectObject
} from "./bounded_shape";
import {CirclePowerup, CircleShape, CircleShapeObject, MovableCircleObject} from "./circle_powerup";
import {MovableTextObject, TextPowerup, TextShapeObject} from "./text_powerup";
import {MovableSpiralObject, SpiralPowerup, SpiralShapeObject} from "./spiral";

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

export function setup_state():GlobalState {
    let state:GlobalState = new GlobalState()
    // state.props_renderers.push(new FilledShapePropRenderer(state))
    // state.jsonexporters.push(new FilledShapeJSONExporter())
    state.powerups.push(new BoundedShapePowerup())
    state.powerups.push(new CirclePowerup())
    state.powerups.push(new RectPowerup())
    state.powerups.push(new TextPowerup())
    state.powerups.push(new SpiralPowerup())
    state.powerups.forEach(pow => pow.init(state))
    return state
}


function App() {
    let root = make_default_tree()
    let state = setup_state()
    return (
        <div className="App">
            <IDEGrid title={"foo"}>
                <TreeView root={root}/>
                <CanvasView root={root} state={state}/>
                <div className={'panel right'}>three</div>
            </IDEGrid>
        </div>
    );
}

export default App;
