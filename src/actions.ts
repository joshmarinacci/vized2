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
