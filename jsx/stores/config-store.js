import {ReduceStore} from "flux/utils";
import dispatcher from "../dispatcher";
import Const from "../const";

class ConfigStore extends ReduceStore {
  getInitialState(){
    return {};
  }
  reduce(state, action){
    switch(action.type){
    case Const.FETCH_CONFIG:
      return action.config;
    case Const.UPDATE_CONFIG:
      return action.config;
    default:
      return state;
    }
  }
};
const configStore = new ConfigStore(dispatcher);

export default configStore;
