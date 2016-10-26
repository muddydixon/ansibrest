import {ReduceStore} from "flux/utils";
import dispatcher from "../dispatcher";
import Const from "../const";

class ErrorStore extends ReduceStore {
  getInitialState(){
    return null;
  }
  reduce(state, action){
    switch(action.type){
    case Const.CATCH_ERROR:
      return action.error;
    case Const.CLOSE_ERROR:
      return null;
    default:
      return state;
    }
  }
};
const errorStore = new ErrorStore(dispatcher);

export default errorStore;
