import {
    add_child_to_parent,
    GlobalState,
    TreeNodeImpl,
    Point, DefaultPowerup,
} from "../common";
import {make_empty_doc, StandardPowerup} from "../powerups/standard";
import {RectPowerup} from "../powerups/rect_powerup";
import {
    BoundedShapePowerup
} from "../bounded_shape";
import {CirclePowerup, make_std_circle} from "../powerups/circle";
import {PDFPowerup} from "../exporters/pdf";
import assert from "assert";
import * as util from "util";
import {test_from_jsonobj, test_to_json} from "../exporters/json";

function local_make_empty_doc(state:GlobalState) {
    let root = make_empty_doc(state)
    let circ = make_std_circle(new Point(100,100),10)
    add_child_to_parent(circ, root)
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

    if(root1.children.length ! === root2.children.length) {
        console.log("different length children!")
        return false
    }
    for(let i=0; i<root1.children.length;   i++) {
        let c1 = root1.children[i]
        let c2 = root2.children[i]
        console.log("comparing ch",c1,c2)
        compareNode(c1 as TreeNodeImpl,c2 as TreeNodeImpl)
    }


}

test('tojson',()=> {
    let state1 = new GlobalState()
    state1.powerups.push(new StandardPowerup())
    state1.powerups.push(new BoundedShapePowerup())
    state1.powerups.push(new CirclePowerup())
    state1.powerups.push(new RectPowerup())
    state1.powerups.push(new PDFPowerup())
    state1.powerups.forEach(pow => pow.init(state1))

    let root1 = local_make_empty_doc(state1)
    // console.log("doc before",root1.children)
    let obj = test_to_json(root1,state1)
    // console.log("obj is",util.inspect(obj,{depth:20}))

    let root2 = test_from_jsonobj(obj, state1)
    // console.log("doc after",root2.children)
    compareNode(root1,root2)
})


