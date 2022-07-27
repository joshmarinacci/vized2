import {Action} from "../actions";
import {Doc, DocName, GlobalState, GlobalStateContext, TreeNode, TreeNodeImpl} from "../common";
import {Toolbar} from "../comps";
import {useContext, useEffect, useState} from "react";
import {DialogContext} from "../dialog";
import {test_from_json, test_to_json} from "./json";
import {DBObj, DBObjAPI, make_logger, RPCClient, Status} from "josh_util";
import {canvasToPNGBlob, export_PNG} from "./png";

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

async function do_atts_save(node:TreeNode, state:GlobalState) {
    let obj = test_to_json(node as TreeNodeImpl,state)
    let data = {
        type:'vized',
        data:obj,
    }
    let can = export_PNG(node,state)
    console.log("canvas is",can)
    let blob:Blob = await canvasToPNGBlob(can)
    let url = `http://localhost:8765/api/create_with_attachment`
    let form_data = new FormData()
    form_data.append('data',JSON.stringify(data))
    form_data.set("thumb",blob)
    let res = await fetch(url,{
        method:'POST',
        headers:{
            'db-username': 'josh',
            'db-password': 'pass',
        },
        body:form_data,
    })
    return await res.json() as Status
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
                let img_url = `http://localhost:8765/api/get/${d.id}/attachment/thumb`
                return <li key={i} onClick={()=>load(d)}>
                    <b>{title}</b>
                    <img alt={"thumb"} src={img_url} width="64"/>
                </li>
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
        do_atts_save(node, state).then((d)=>{
            console.log("result of it is",d)
        })
    }
}

