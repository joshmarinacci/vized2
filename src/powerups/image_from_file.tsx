import {Action} from "../actions";
import {
    add_child_to_parent,
    GlobalState,
    GlobalStateContext, Rect,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {useContext, useRef, useState} from "react";
import {PopupContext} from "../popup";
import {ImageShapeObject, make_image_node, ResizableImageObject} from "./image_powerup";
import {BoundedShapeObject, MovableBoundedShape} from "../bounded_shape";

function ImageFileUpload() {
    let input = useRef<HTMLInputElement>(null)
    let pm = useContext(PopupContext)
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
        pm?.hide()
    }
    const import_selected = () => {
        pm?.hide()
        let image: TreeNode = new TreeNodeImpl()
        image.title = 'image'
        let iso = new ImageShapeObject()
        let bds = new BoundedShapeObject(new Rect(100, 100, 200, 200))
        // @ts-ignore
        let file = input.current.files[0]
        state.add_image_from_file(file).then(img => {
            iso.sync(img)
            bds.get_bounds().w = img.width
            bds.get_bounds().h = img.height
        })
        image.components.push(iso)
        image.components.push(bds)
        image.components.push(new MovableBoundedShape(image))
        image.components.push(new ResizableImageObject(image))
        add_child_to_parent(image, state.get_root())
        state.dispatch('object-changed', {})
    }
    return <div className={'dialog'}>
        upload your image here
        <input ref={input} type={"file"}
               onChange={file_changed}/>
        <button onClick={cancel}>cancel</button>
        <button disabled={!valid} onClick={import_selected}>import</button>
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
