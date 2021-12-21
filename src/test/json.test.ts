import {add_child_to_parent, GlobalState, Rect} from "../common";
import {FilledShapeJSONExporter, POJO_to_treenode, treenode_to_POJO} from "../exporters/json";
import {make_empty_doc, StandardPowerup} from "../powerups/standard";
import {make_std_rect} from "../powerups/rect_powerup";

test('tojson',()=> {
    let state1 = new GlobalState()
    state1.jsonexporters.push(new FilledShapeJSONExporter())
    state1.powerups.push(new StandardPowerup())
    state1.powerups.forEach(pow => pow.init(state1))

    let root1 = make_empty_doc(state1)
    add_child_to_parent(make_std_rect(new Rect(10,10,10,10)),root1)
    let pojo1 = treenode_to_POJO(root1, state1)
    console.log("pogo1 is",pojo1, pojo1.children[0])
    //
    // let pojo2 = JSON.parse(JSON.stringify(pojo1))
    // let state2 = new GlobalState()
    // let root2 = POJO_to_treenode(pojo2, state2)
    // console.log("root2 is",root2)
})


