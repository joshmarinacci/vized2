import {
    BorderedShape,
    BorderedShapeName,
    DefaultPowerup,
    forceDownloadBlob,
    GlobalState,
    System,
    TreeNode
} from "../common";
import {Action} from "../actions";

export function treenode_to_SVG(node: TreeNode, state: GlobalState) {
    let exp = state.svgexporters.find(exp => exp.canExport(node,state))
    return exp ? exp.toSVG(node, state) : ""
}

export function export_SVG(root: TreeNode, state: GlobalState) {
    console.log("exporting to SVG", root)
    let chs = root.children.map(ch => treenode_to_SVG(ch, state))
    let template = `<?xml version="1.0" standalone="no"?>
    <svg width="400" height="400" version="1.1" xmlns="http://www.w3.org/2000/svg">
    ${chs.join("\n")}
    </svg>
    `
    console.log("template output", template)
    let blog = new Blob([template.toString()])
    forceDownloadBlob('demo.svg', blog)
}

export interface SVGExporter extends System {
    canExport(node: TreeNode, state:GlobalState): boolean
    toSVG(node: TreeNode, state:GlobalState): string
}

export class SVGPowerup extends DefaultPowerup {
    override export_actions(): Action[] {
        let action:Action = {
            use_gui: false,
            title:"export SVG",
            fun(node: TreeNode, state: GlobalState): void {
                export_SVG(node,state)
            }
        }
        return [action]
    }
}

export function apply_svg_border(node: TreeNode, obj: any): void {
    if (node.has_component(BorderedShapeName)) {
        let bd: BorderedShape = node.get_component(BorderedShapeName) as BorderedShape
        if (bd.get_border_width() > 0) {
            // @ts-ignore
            obj['stroke'] = bd.get_border_fill()
            // @ts-ignore
            obj['stroke-width'] = bd.get_border_width()
        }
    }
}

export function to_svg(name: string, obj: any) {
    let pairs = Object.keys(obj).map(k => `${k}='${obj[k]}'`)
    return `<${name} ${pairs.join(" ")}/>`
}