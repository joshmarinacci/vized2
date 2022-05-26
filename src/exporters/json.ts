import {
    Component,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    forceDownloadBlob,
    TreeNode,
    TreeNodeImpl,
    GlobalState, DefaultPowerup, add_child_to_parent
} from "../common";
import {Action} from "../actions";
import {export_png} from "./exportutils";
import {export_PNG} from "./png";

export interface JSONExporter extends Component {
    canHandleToJSON(comp:Component, node:TreeNode):boolean
    canHandleFromJSON(obj:any, node:TreeNode):boolean
    toJSON(component:Component,node:TreeNode):any
    fromJSON(obj:any,node:TreeNode):Component
}

export function treenode_to_treenode(src: TreeNode, state: GlobalState):TreeNode {
    let obj = test_to_json(src as TreeNodeImpl,state)
    let str = JSON.stringify(obj, null, '  ')
    let obj2 = JSON.parse(str)
    let new_node = test_from_json(obj2,state)
    return new_node
}

export function export_JSON(root: TreeNode, state:GlobalState) {
    console.log("exporting to JSON", root)
    let obj = test_to_json(root as TreeNodeImpl,state)
    let str = JSON.stringify(obj, null, '  ')
    console.log(str)
    forceDownloadBlob('demo.json', new Blob([str]))
}


export class FilledShapeJSONExporter implements JSONExporter {
    name: string;
    constructor() {
        this.name = 'FilledShapeJSONExporter'
    }


    toJSON(component: Component): any {
        let filled = component as FilledShape
        return {
            name:filled.name,
            type:filled.get_fill_type(),
            color:filled.get_fill()
        }
    }

    fromJSON(obj: any): Component {
        return new FilledShapeObject(obj.color)
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        return obj.name === FilledShapeName
    }

    canHandleToJSON(comp: Component, node: TreeNode): boolean {
        console.log("comp is",comp)
        return comp.name === FilledShapeName
    }

}

export class JSONPowerup extends DefaultPowerup {
    override export_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"export JSON",
            fun(node: TreeNode, state: GlobalState): void {
                export_JSON(node,state)
            }
        }
        let action2:Action = {
            title: "export and reimport JSON",
            use_gui: false,
            fun(node: TreeNode, state: GlobalState): any {
                let obj = test_to_json(node as TreeNodeImpl,state)
                let str = JSON.stringify(obj, null, '  ')
                let obj2 = JSON.parse(str)
                let new_node = test_from_json(obj2,state)
                state.set_root(new_node)
            }
        }
        let export_embedded_PNG:Action = {
            title:"export embedded PNG",
            use_gui:false,
            fun(node:TreeNode, state:GlobalState):void {
                let obj = test_to_json(node as TreeNodeImpl,state)
                let canvas = export_PNG(node,state)
                export_png(canvas,obj,'filename.png').then(()=>{})
                console.log("done exporting")
            }
        }
        return [action, action2, export_embedded_PNG]
    }
}
export function test_to_json(root:TreeNodeImpl, state:GlobalState) {
    let obj:any = {
    }
    obj.id = root.id
    obj.title = root.title
    obj.components = root.all_components().map(comp => {
        for(let i=0; i<state.powerups.length; i++) {
            let pow = state.powerups[i]
            if(pow instanceof DefaultPowerup) {
                let dpow = pow as DefaultPowerup
                if(dpow.can_serialize(comp,root,state)) {
                    return dpow.serialize(comp,root,state)
                }
            }
        }

        console.error("can't serialize",comp)
        return {
            missing:true,
            name:comp.name
        }
    })
    obj.children = root.children.map(ch => test_to_json(ch as TreeNodeImpl,state))
    return obj
}

export function test_from_json(obj:any, state:GlobalState):TreeNodeImpl {
    let node = new TreeNodeImpl()
    node.id = obj.id
    node.title = obj.title
    obj.components.forEach((def:any) => {
        for(let i=0; i<state.powerups.length; i++) {
            let pow = state.powerups[i]
            if(pow instanceof DefaultPowerup) {
                let dpow = pow as DefaultPowerup
                if(dpow.can_deserialize(def,state)) {
                    node.add_component(dpow.deserialize(def,node,state))
                    return
                }
            }
        }
        console.log("couldn't deserialize component",def, def.constructor.name)
    })
    node.children = obj.children.map((ch:any) => {
        // console.log("deserializing child",ch)
        let chh = test_from_json(ch,state)
        add_child_to_parent(chh,node)
        return chh
    })
    return node
}
