import {Action} from "../actions";
import {
    add_child_to_parent,
    GlobalState,
    GlobalStateContext, Rect,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {useContext, useRef, useState} from "react";
import {ImageShapeObject, ResizableImageObject} from "./image_powerup";
import {BoundedShapeObject, MovableBoundedShape} from "../bounded_shape";
import {DialogContext} from "../dialog";
import {Toolbar} from "../comps";

function ImageFileUpload() {
    let input = useRef<HTMLInputElement>(null)
    let dc = useContext(DialogContext)
    let state = useContext(GlobalStateContext)
    const [valid, set_valid] = useState(false)
    const file_changed = () => {
        // @ts-ignore
        if(input.current && input.current.files.length > 0) {
            // @ts-ignore
            let file = input.current.files[0]
            console.log("files are",file)
            if(file.type && file.type.startsWith("image")) {
                console.log("it's an image!")
                set_valid(true)
            }
        }
    }
    const cancel = () => {
        dc.hide()
    }
    const import_selected = () => {
        dc.hide()
        let image = new TreeNodeImpl()
        image.title = 'image'
        let iso = new ImageShapeObject()
        iso.set_scale(1.0)
        // @ts-ignore
        let file = input.current.files[0]
        state.add_image_from_file(file).then(img => iso.setImage(img))
        image.add_component(iso)
        // image.add_component(new MovableBoundedShape(image))
        image.add_component(new ResizableImageObject(image))
        add_child_to_parent(image, state.get_root())
        state.dispatch('object-changed', {})
    }
    return <div className={'dialog vcenter'}>
            <p>upload your image here</p>
            <input ref={input} type={"file"} onChange={file_changed}/>
            <div className={'grow'}></div>
            <Toolbar>
                <button onClick={cancel}>cancel</button>
                <button disabled={!valid} onClick={import_selected}>import</button>
            </Toolbar>
    </div>
}

export const make_image_file: Action = {
    use_gui: true,
    title: "add image from local file",
// @ts-ignore
    get_gui(node:TreeNode, state:GlobalState):JSX.Element {
        console.log("returning a GUI")
        return <ImageFileUpload/>
    },
    fun(node: TreeNode, state: GlobalState): void {
        // let image = make_image_node("https://vr.josh.earth/assets/2dimages/saturnv.jpg",state)
        // add_child_to_parent(image, node)
        // state.dispatch('object-changed', {})
    }
}
