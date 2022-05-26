import {GlobalState, TreeNode, TreeNodeImpl} from "./common";
import {treenode_to_treenode} from "./exporters/json";
import {make_std_group} from "./powerups/group";

export interface Action {
    title: string
    use_gui:boolean
    fun(node: TreeNode, state: GlobalState): any
}

export const delete_node: Action = {
    use_gui: false,
    title: 'delete',
    fun(node: TreeNode, state: GlobalState): void {
        node.parent.children = node.parent.children.filter(ch => ch !== node)
        // @ts-ignore
        node.parent = null
        state.dispatch('object-changed', {})
    }
}
export const nothing: Action = {
    use_gui: false,
    title: "nothing",
    fun(node: TreeNode, state: GlobalState): void {
    }
}

export function delete_selection(state: GlobalState) {
    state.selection.get().forEach(node => {
        node.parent.children = node.parent.children.filter(ch => ch !== node)
        // @ts-ignore
        node.parent = null
    })
    state.selection.clear()
    state.dispatch('object-changed', {})
    state.dispatch('selection-change', {})
}
export const delete_selection_action:Action = {
    use_gui: false,
    title: "delete selection",
    fun(node: TreeNode, state: GlobalState): void {
        delete_selection(state)
    }
}

export const move_to_bottom:Action = {
    use_gui: false,
    title: "move to bottom",
    fun(nodex: TreeNode, state: GlobalState): any {
        let parent = state.selection.get()[0].parent
        state.selection.get().forEach((ch:TreeNode)=>{
            let n = ch.parent.children.indexOf(ch)
            ch.parent.children.splice(n, 1)
        })
        state.selection.get().forEach(ch => {
            ch.parent = parent
            ch.parent.children.unshift(ch)
        })
        state.dispatch("object-changed", {})
    }

}
export const move_to_top:Action = {
    use_gui: false,
    title: "move to top",
    fun(node: TreeNode, state: GlobalState): any {
        let parent = state.selection.get()[0].parent
        state.selection.get().forEach((ch:TreeNode)=>{
            let n = ch.parent.children.indexOf(ch)
            ch.parent.children.splice(n, 1)
        })
        state.selection.get().forEach(ch => {
            ch.parent = parent
            ch.parent.children.push(ch)
        })
        state.dispatch("object-changed", {})
    }

}

export const move_up:Action = {
    use_gui: false,
    title: "move up",
    fun(node: TreeNode, state: GlobalState): any {
        state.selection.get().forEach((ch:TreeNode)=>{
            let n = ch.parent.children.indexOf(ch)
            if(n < ch.parent.children.length-1) {
                ch.parent.children.splice(n, 1)
                ch.parent.children.splice(n +1, 0, ch)
            }
        })
        state.dispatch("object-changed", {})
    }
}

export const move_down:Action = {
    use_gui: false,
    title: "move down",
    fun(node: TreeNode, state: GlobalState): any {
        state.selection.get().forEach((ch:TreeNode)=>{
            let n = ch.parent.children.indexOf(ch)
            if(n > 0) {
                ch.parent.children.splice(n, 1)
                ch.parent.children.splice(n - 1, 0, ch)
            }
        })
        state.dispatch("object-changed", {})
    }
}

export const duplicate:Action = {
    use_gui:false,
    title:'duplicate',
    fun(node: TreeNode, state: GlobalState): any {
        state.selection.get().forEach((ch:TreeNode) => {
            console.log("duplicating ", ch)
            let dupe = treenode_to_treenode(ch, state)
            dupe.id = "tree_node_" + Math.floor(Math.random() * 1000000)
            console.log('got the dupe',dupe)
            ch.parent.children.push(dupe)
            dupe.parent = ch.parent
        })
        state.dispatch("object-changed",{})
    },
}

export const selection_to_group:Action = {
    use_gui:false,
    title:'move into group',
    fun(node: TreeNode, state: GlobalState): any {
        let group = make_std_group()
        let parent:TreeNodeImpl
        state.selection.get().forEach((ch:TreeNode) => {
            console.log("moving ", ch)
            parent = ch.parent as TreeNodeImpl
            group.add_child(ch)
        })
        // @ts-ignore
        parent.add_child(group)
        state.dispatch("object-changed",{})
    },
}