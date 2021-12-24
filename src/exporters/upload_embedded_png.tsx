import {Action} from "../actions";
import {
    GlobalState,
    GlobalStateContext,
    TreeNode
} from "../common";
import {useContext, useRef, useState} from "react";
import {DialogContext} from "../dialog";
import {Toolbar} from "../comps";
import {import_png} from "./exportutils";
import {test_from_json} from "./json";

function EmbeddedPNGImport() {
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
        // @ts-ignore
        let file = input.current.files[0]
        import_png(file).then(obj => {
            state.set_root(test_from_json(obj,state))
        })
    }
    return <div className={'dialog vcenter'}>
        <p>choose PNG w/ embedded JSON</p>
        <input ref={input} type={"file"} onChange={file_changed}/>
        <div className={'grow'}/>
        <Toolbar>
            <button onClick={cancel}>cancel</button>
            <button disabled={!valid} onClick={import_selected}>import</button>
        </Toolbar>
    </div>
}

export const import_embedded_png_action:Action = {
    title: "import embedded PNG",
    use_gui: true,
// @ts-ignore
    get_gui(node:TreeNode, state:GlobalState):JSX.Element {
        return <EmbeddedPNGImport/>
    },
    fun(node: TreeNode, state: GlobalState): any {

    }
}

