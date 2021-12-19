import React, {useContext} from 'react';
import './App.css';
import './fonts.css'
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
import {CirclePowerup, make_std_circle} from "./powerups/circle";
import {TextPowerup, TextShapeObject} from "./powerups/text_powerup";
import {make_std_spiral, SpiralPowerup} from "./powerups/spiral";
import {FilledShapeJSONExporter, JSONPowerup} from "./exporters/json";
import {PDFExportBounds, PDFPowerup} from "./exporters/pdf";
import {SVGPowerup} from "./exporters/svg";
import {PNGPowerup} from "./exporters/png";
import {GroupPowerup, make_std_group} from "./powerups/group";
import {ImagePowerup} from "./powerups/image_powerup";
import {Toolbar} from "./comps";
import {TreeView} from "./treeview";
import {PopupContainer, PopupContext, PopupContextImpl} from "./popup";
import {Action} from "./actions";
import {GreetingCardPowerup} from "./powerups/greetingcard";
import {PropSheet} from "./propsheet";
import {make_image_file} from "./powerups/image_from_file";
import {DialogContainer, DialogContext, DialogContextImpl} from "./dialog";
import {PresentationPowerup} from "./powerups/presentation";
import {BookmarkPowerup} from "./powerups/bookmark";
import {SnowflakePowerup} from "./powerups/snowflake";
import {StandardPowerup} from "./powerups/standard";

function IDEGrid(props:{title:string, children:any[]}) {
  return <div className={'ide-grid'}>
    {props.children}
  </div>
}

export function make_default_tree(state: GlobalState) {
    let root:TreeNodeImpl = new TreeNodeImpl()
    root.title = 'root'
    root.add_component(new DocMarker())
    root.add_component(new PageMarker())
    root.add_component(new BoundedShapeObject(new Rect(0,0,4*100,5*100)))
    root.add_component(new PDFExportBounds("in",1/100))
    root.add_component(new RectShapeObject())
    root.add_component(new FilledShapeObject('white'))


    let group1 = make_std_group()
    add_child_to_parent(group1,root)

    {
        let rect1 = new TreeNodeImpl()
        rect1.title = 'rect'
        rect1.add_component(new RectShapeObject())
        rect1.add_component(new BoundedShapeObject(new Rect(10, 10, 10, 10)))
        rect1.add_component(new FilledShapeObject("#ff0000"))
        rect1.add_component(new MovableBoundedShape(rect1))
        add_child_to_parent(rect1, group1)
    }
    {
        let rect2 = new TreeNodeImpl()
        rect2.title = 'rect'
        rect2.add_component(new RectShapeObject())
        rect2.add_component(new BoundedShapeObject(new Rect(200, 30, 50, 50)))
        rect2.add_component(new FilledShapeObject('#0000FF'))
        rect2.add_component(new MovableBoundedShape(rect2))
        rect2.add_component(new ResizableRectObject(rect2))
        add_child_to_parent(rect2, group1)
    }
    {
        let circ1 = make_std_circle(new Point(100,100),10)
        add_child_to_parent(circ1,group1)
    }
    {
        let rect3 = new TreeNodeImpl()
        rect3.title = 'rect'
        rect3.add_component(new RectShapeObject())
        rect3.add_component(new BoundedShapeObject(new Rect(50, 200, 50, 50)))
        rect3.add_component(new FilledShapeObject('#00FF00'))
        rect3.add_component(new MovableBoundedShape(rect3))
        rect3.add_component(new ResizableRectObject(rect3))
        add_child_to_parent(rect3, root)
    }
    {
        let circ1 = make_std_circle(new Point(100,300),30)
        add_child_to_parent(circ1, root)
    }
    {
        let spiral = make_std_spiral(new Point(100,200),15)
        add_child_to_parent(spiral,root)
    }
/*
    {
        let url = "https://vr.josh.earth/assets/2dimages/saturnv.jpg"
        let image = make_image_node(url,state)
        add_child_to_parent(image,root)
    }
*/
    {
        let text1 = new TreeNodeImpl()
        text1.title = 'text1'
        text1.add_component(new TextShapeObject("Jesse is a\nsilly head", 20, "center",'center'))
        text1.add_component(new BoundedShapeObject(new Rect(50,150,150,100)))
        text1.add_component(new MovableBoundedShape(text1))
        text1.add_component(new ResizableRectObject(text1))
        text1.add_component(new FilledShapeObject('#000000'))
        add_child_to_parent(text1,root)
    }
    return root
}


export function setup_state():GlobalState {
    let state:GlobalState = new GlobalState()
    state.set_root(make_default_tree(state))
    state.jsonexporters.push(new FilledShapeJSONExporter())
    state.powerups.push(new StandardPowerup())
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
    state.powerups.push(new BookmarkPowerup())
    state.powerups.push(new PresentationPowerup())
    state.powerups.push(new SnowflakePowerup())
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
                    pc.hide()
                }
                }>{act.title}</li>
            })}
        </ul>
        pc.show(menu,e)
    }
    }>export</button>
}

function NewDocActions(props: {}) {
    let pc = useContext(PopupContext)
    let state = useContext(GlobalStateContext)
    return <button onClick={(e)=>{
        let actions:Action[] = state.powerups.map(pw => pw.new_doc_actions()).flat()
        let menu = <ul className={'menu'}>
            {actions.map((act,i)=>{
                return <li key={i} className={'menu-item'} onClick={()=>{
                    let root:TreeNode = act.fun(state.get_root(),state) as TreeNode
                    state.set_root(root)
                    pc.hide()
                }
                }>{act.title}</li>
            })}
        </ul>
        pc.show(menu,e)
    }
    }>New Doc</button>
}

function ImportActions(props: {}) {
    let pc = useContext(PopupContext)
    let dc = useContext(DialogContext)
    let state = useContext(GlobalStateContext)
    return <button onClick={(e)=>{
        let actions:Action[] = [make_image_file]
        let menu = <ul className={'menu'}>
            {actions.map((act,i)=>{
                return <li key={i} className={'menu-item'} onClick={()=>{
                    if(act.use_gui) {
                        pc.hide()
                        // @ts-ignore
                        dc.show(act.get_gui())
                    } else {
                        let root: TreeNode = act.fun(state.get_root(), state) as TreeNode
                        state.set_root(root)
                        pc.hide()
                    }
                }
                }>{act.title}</li>
            })}
        </ul>
        pc.show(menu,e)
    }
    }>import</button>
}

function App() {
    const pc = new PopupContextImpl()
    const dc = new DialogContextImpl()
    const state = setup_state()
    return (
        <DialogContext.Provider value={dc}>
            <PopupContext.Provider value={pc}>
                <GlobalStateContext.Provider value={state}>
                    <div className="App">
                        <IDEGrid title={"foo"}>
                            <Toolbar>
                                <NewDocActions/>
                                <ImportActions/>
                                <ExportActions/>
                            </Toolbar>
                            <Toolbar>
                                <label>canvas</label>
                            </Toolbar>
                            <Toolbar>
                                <label>props</label>
                            </Toolbar>
                            <TreeView/>
                            <CanvasView/>
                            <PropSheet/>
                        </IDEGrid>
                        <PopupContainer/>
                        <DialogContainer/>
                    </div>
                </GlobalStateContext.Provider>
            </PopupContext.Provider>
        </DialogContext.Provider>
    );
}

export default App;
