import React, {useContext, useState} from 'react';
import './App.css';
import {
    add_child_to_parent,
    DocMarker,
    FilledShapeObject,
    GlobalState,
    GlobalStateContext,
    PageMarker,
    Point,
    Rect,
    TreeNode,
    TreeNodeImpl
} from "./common";
import {CanvasView} from "./canvas";
import {RectPowerup, RectShapeObject} from "./powerups/rect_powerup";
import {
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
import {FilledShapeJSONExporter, JSONPowerup} from "./exporters/json";
import {PDFExportBounds, PDFPowerup} from "./exporters/pdf";
import {SVGPowerup} from "./exporters/svg";
import {PNGPowerup} from "./exporters/png";
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
import {Action} from "./actions";
import {GreetingCardPowerup} from "./powerups/greetingcard";
import {PropSheet} from "./propsheet";

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
    state.powerups.push(new PDFPowerup())
    state.powerups.push(new SVGPowerup())
    state.powerups.push(new PNGPowerup())
    state.powerups.push(new JSONPowerup())
    state.powerups.push(new GreetingCardPowerup())
    state.powerups.forEach(pow => pow.init(state))
    return state
}

function ExportActions(props: {}) {
    let pc = useContext(PopupContext)
    let state = useContext(GlobalStateContext)
    return <button onClick={(e)=>{
        let actions:Action[] = state.powerups.map(pw => pw.export_actions()).flat()
        let menu = <ul className={'menu'}>
            {actions.map((act,i)=>{
                return <li key={i} className={'menu-item'} onClick={()=>{
                    act.fun(state.get_root(),state)
                    pc?.hide()
                }
                }>{act.title}</li>
            })}
        </ul>
        pc?.show(menu,e)
    }
    }>export</button>
}

function NewDocActions(props: { set_root:any }) {
    let pc = useContext(PopupContext)
    let state = useContext(GlobalStateContext)
    return <button onClick={(e)=>{
        let actions:Action[] = state.powerups.map(pw => pw.new_doc_actions()).flat()
        let menu = <ul className={'menu'}>
            {actions.map((act,i)=>{
                return <li key={i} className={'menu-item'} onClick={()=>{
                    let root = act.fun(state.get_root(),state)
                    props.set_root(root)
                    pc?.hide()
                }
                }>{act.title}</li>
            })}
        </ul>
        pc?.show(menu,e)
    }
    }>New Doc</button>
}

function App() {
    const pc = new PopupContextImpl()
    const [root, set_root] = useState(()=> make_default_tree())
    const state = setup_state(root)
    return (
        <PopupContext.Provider value={pc}>
            <GlobalStateContext.Provider value={state}>
        <div className="App">
            <IDEGrid title={"foo"}>
                <Toolbar>
                    <NewDocActions set_root={set_root}/>
                    <ExportActions/>
                </Toolbar>
                <Toolbar>
                    <label>canvas</label>
                </Toolbar>
                <Toolbar>
                    <label>props</label>
                </Toolbar>
                <TreeView/>
                <CanvasView docroot={root} state={state}/>
                <PropSheet/>
            </IDEGrid>
            <PopupContainer/>
        </div>

            </GlobalStateContext.Provider>
        </PopupContext.Provider>
    );
}

export default App;
