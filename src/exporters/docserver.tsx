import {Action} from "../actions";
import {Doc, DocName, GlobalState, GlobalStateContext, TreeNode, TreeNodeImpl} from "../common";
import {Toolbar} from "../comps";
import {useContext, useEffect, useState} from "react";
import {DialogContext} from "../dialog";
import {test_from_json, test_to_json} from "./json";
import {DBObj, DBObjAPI, make_logger, RPCClient} from "josh_util";

const log = make_logger("docserver")

async function make_rpc():Promise<DBObjAPI> {
    let rpc = new RPCClient()
    let api = await rpc.connect("http://localhost:8765/api", {
        type: "userpass",
        username: "josh",
        password: "pass",
    })
    log.info('we are connected')
    return api
}

function ServerDocImport() {
    let dc = useContext(DialogContext)
    let state = useContext(GlobalStateContext)
    let [docs, set_docs] = useState<DBObj[]>([])
    const cancel = () => {
        dc.hide()
    }
    const load = (d:DBObj) => {
        log.info("Loading the obj",d)
        state.set_root(test_from_json(d.data,state))
        dc.hide()
    }
    useEffect(() => {
        make_rpc().then(api => {
            return api.search({type:"vized"})
        }).then((r) => {
            log.info("search results",r)
            if(r.success) {
                set_docs(r.data)
            }
        })
    },[])
    return <div className={'dialog vcenter'}>
        opening from the server here
        <ul className={"doclist"}>
            {docs.map((d,i) => {
                let title = "unnamed"
                let dm = d.data.components.filter((c:any) => c.klass === 'DocMarker')
                if(dm.length > 0 && dm[0].title) {
                    title = dm[0].title
                }
                return <li key={i} onClick={()=>load(d)}>{title}</li>
            })}
        </ul>
        <Toolbar>
            <button onClick={cancel}>cancel</button>
        </Toolbar>
    </div>
}

export const import_server_png_action:Action = {
    title: "Load from Server",
    use_gui: true,
    // @ts-ignore
    get_gui(node:TreeNode, state:GlobalState):JSX.Element {
        return <ServerDocImport/>
    },
    fun(node: TreeNode, state: GlobalState): any {
        console.log("doing nothing here in docserver loading")
    }
}
export const export_server_png_action:Action = {
    title:"save to server",
    use_gui:false,
    fun(node: TreeNode, state: GlobalState): any {
        let obj = test_to_json(node as TreeNodeImpl,state)
        console.log("saving obj",obj)
        make_rpc().then(rpc => {
            return rpc.create({
                type:'vized',
                data:obj,
            })
        }).then((d)=>{
            console.log("result of it is",d)
        })
    }
}

