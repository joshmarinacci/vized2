import {Action} from "../actions";
import {
    Component,
    Doc,
    DocName,
    GlobalState,
    GlobalStateContext,
    TreeNode,
    TreeNodeImpl
} from "../common";
import {Toolbar} from "../comps";
import {useContext, useEffect, useState} from "react";
import {DialogContext} from "../dialog";
import {test_from_json, test_to_json} from "./json";
import {DBID, DBObj, DBObjAPI, make_logger, RPCClient, Status} from "josh_util";
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

export const DocServerMarkerName = "DocServerMarkerName"
export interface DocServerMarker extends Component {
    get_id():string
    set_id(id:string):void
}
export class DockServerMarkerImpl implements DocServerMarker {
    name: string
    _id: string
    constructor(id:string) {
        this.name = DocServerMarkerName
        this._id = id
    }

    get_id(): string {
        return this._id
    }
    set_id(id: string):void {
        this._id = id
    }

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
    let form_data = new FormData()
    form_data.set("thumb",blob)

    if(node.has_component(DocServerMarkerName)) {
        let dm = node.get_component(DocServerMarkerName) as DocServerMarker
        console.log("re-saving doing replace instead")
        form_data.append('old',JSON.stringify({
            type:'vized',
            id:dm.get_id(),
        }))
        form_data.append('replacement',JSON.stringify(data))
        let url = `http://localhost:8765/api/replace_with_attachment`
        let res = await fetch(url,{
            method:'POST',
            headers:{
                'db-username': 'josh',
                'db-password': 'pass',
            },
            body:form_data,
        })
        let status = await res.json() as Status
        if(status.success) {
            console.log('status is', status.data[0].id)
            let dm = new DockServerMarkerImpl(status.data[0].id);
            // dm.set_id(status.data[0].id);
            (node as TreeNodeImpl).add_component(dm);
            console.log("dm is",dm)
            return status
        }
    } else {
        form_data.append('data',JSON.stringify(data))
        let url = `http://localhost:8765/api/create_with_attachment`
        let res = await fetch(url,{
            method:'POST',
            headers:{
                'db-username': 'josh',
                'db-password': 'pass',
            },
            body:form_data,
        })
        let status = await res.json() as Status
        if(status.success) {
            console.log('status is', status.data[0].id)
            let dm = new DockServerMarkerImpl(status.data[0].id);
            // dm.set_id(status.data[0].id);
            (node as TreeNodeImpl).add_component(dm)
            console.log("dm is",dm)
            return status
        }
    }
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

