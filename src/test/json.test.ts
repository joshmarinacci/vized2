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

function local_make_empty_doc(state:GlobalState) {
    let root = make_empty_doc(state)
    let circ = make_std_circle(new Point(100,100),10)
    add_child_to_parent(circ, root)
    return root
}

function test_to_json(root:TreeNodeImpl, state:GlobalState) {
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

        console.log("can't serialize",comp)
        return {
            missing:true,
            name:comp.name
        }
    })
    obj.children = root.children.map(ch => test_to_json(ch as TreeNodeImpl,state))
    return obj
}

function test_from_jsonobj(obj:any, state:GlobalState) {
    let node = new TreeNodeImpl()
    node.id = obj.id
    node.title = obj.title
    obj.components.forEach((def:any) => {
        for(let i=0; i<state.powerups.length; i++) {
            let pow = state.powerups[i]
            if(pow instanceof DefaultPowerup) {
                let dpow = pow as DefaultPowerup
                if(dpow.can_deserialize(def,state)) {
                    node.add_component(dpow.deserialize(def,state))
                    return
                }
            }
        }
        console.log("couldn't deserialize component",def, def.constructor.name)
    })
    node.children = obj.children.map((ch:any) => {
        console.log("deserailzing child",ch)
        return test_from_jsonobj(ch,state)
    })
    return node
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
    console.log("doc before",root1.children)
    let obj = test_to_json(root1,state1)
    console.log("obj is",util.inspect(obj,{depth:20}))

    let root2 = test_from_jsonobj(obj, state1)
    console.log("doc after",root2.children)

    // console.log("is deep equal",deepEqual(root1,root2))
    // assert.deepStrictEqual(root1.children[0],root2.children[0])
    compareNode(root1,root2)

    // assert.deepStrictEqual(root1.all_components(),root2.all_components())

    // let pojo1 = treenode_to_POJO(root1, state1)
    // console.log("pogo1 is",pojo1, pojo1.children[0])
    //
    // let pojo2 = JSON.parse(JSON.stringify(pojo1))
    // let state2 = new GlobalState()
    // let root2 = POJO_to_treenode(pojo2, state2)
    // console.log("root2 is",root2)
})


