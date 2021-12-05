import {GlobalState, TreeNode} from "./common";

export interface Action {
    title: string
    fun(node: TreeNode, state: GlobalState): any
}

export const delete_node: Action = {
    title: 'delete',
    fun(node: TreeNode, state: GlobalState): void {
        node.parent.children = node.parent.children.filter(ch => ch !== node)
        // @ts-ignore
        node.parent = null
        state.dispatch('object-changed', {})
    }
}
export const nothing: Action = {
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
    title: "delete selection",
    fun(node: TreeNode, state: GlobalState): void {
        delete_selection(state)
    }
}

export const move_to_bottom:Action = {
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
