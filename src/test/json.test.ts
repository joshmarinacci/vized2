import {
    add_child_to_parent,
    GlobalState,
    TreeNodeImpl,
    Point, Rect,
} from "../common";
import {make_empty_doc, StandardPowerup} from "../powerups/standard";
import {make_std_rect, RectPowerup} from "../powerups/rect_powerup";
import {
    BoundedShapePowerup
} from "../bounded_shape";
import {CirclePowerup, make_std_circle} from "../powerups/circle";
import {PDFPowerup} from "../exporters/pdf";
import assert from "assert";
import {test_from_json, test_to_json} from "../exporters/json";
import * as util from "util";

function make_simple_doc(state:GlobalState) {
    let root = make_empty_doc(state)
    let circ = make_std_circle(new Point(100,100),10)
    add_child_to_parent(circ, root)
    let rect = make_std_rect(new Rect(10,20,30,40))
    add_child_to_parent(rect,root)
    return root
}

function compareNode(root1:TreeNodeImpl, root2:TreeNodeImpl) {
    assert.deepStrictEqual(root1.id,root2.id,"same id")

    let comps1 = root1.all_components()
    let comps2 = root2.all_components()
    for(let i=0; i<comps1.length; i++) {
        let c1 = comps1[i]
        let c2 = comps2[i]
        console.log("comparing comps",c1,c2)
        assert.deepStrictEqual(c1,c2)
    }

    if(root1.children.length !== root2.children.length) {
        console.error("different length children!", root1.children.length, root2.children.length)
        console.error(root1.children)
        console.error(root2.children)
        return false
    }
    for(let i=0; i<root1.children.length;   i++) {
        let c1 = root1.children[i]
        let c2 = root2.children[i]
        console.log("comparing ch",c1,c2)
        compareNode(c1 as TreeNodeImpl,c2 as TreeNodeImpl)
    }


}

test('tojson_simple',()=> {
    let state1 = new GlobalState()
    state1.powerups.push(new StandardPowerup())
    state1.powerups.push(new BoundedShapePowerup())
    state1.powerups.push(new CirclePowerup())
    state1.powerups.push(new RectPowerup())
    state1.powerups.push(new PDFPowerup())
    state1.powerups.forEach(pow => pow.init(state1))

    // make test doc
    let root1 = make_simple_doc(state1)
    // console.log("doc before",root1.children)
    let obj = test_to_json(root1,state1)
    // console.log("obj is",util.inspect(obj,{depth:20}))

    let root2 = test_from_json(obj, state1)
    // console.log("doc after",root2.children)
    compareNode(root1,root2)
})

test('tojson_border',()=> {
    let state1 = new GlobalState()
    state1.powerups.push(new StandardPowerup())
    state1.powerups.push(new BoundedShapePowerup())
    state1.powerups.push(new CirclePowerup())
    state1.powerups.push(new RectPowerup())
    state1.powerups.push(new PDFPowerup())
    state1.powerups.forEach(pow => pow.init(state1))

    // make test doc
    let root1 = make_empty_doc(state1)
    let circ = make_std_circle(new Point(100,100),10)
    add_child_to_parent(circ, root1)
    let obj = test_to_json(root1,state1)
    // console.log("obj is",util.inspect(obj,{depth:20}))
    let root2 = test_from_json(obj, state1)
    compareNode(root1,root2)
})

