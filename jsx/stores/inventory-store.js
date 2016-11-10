import {ReduceStore} from "flux/utils";
import dispatcher from "../dispatcher";
import Const from "../const";

class InventoryStore extends ReduceStore {
  getInitialState(){
    return [];
  }
  reduce(state, action){
    switch(action.type){
    case Const.FETCH_INVENTORIES:
      return action.inventories;
    default:
      return state;
    }
  }
};
const inventoryStore = new InventoryStore(dispatcher);

export default inventoryStore;
