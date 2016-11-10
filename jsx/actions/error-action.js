import request from "superagent";
import dispatcher from "../dispatcher";
import Const from "../const";

class ErrorAction {
  catch(err){
    dispatcher.dispatch({type: Const.CATCH_ERROR, error: err});
    return Promise.resolve();
  }
  close(){
    dispatcher.dispatch({type: Const.CLOSE_ERROR});
    return Promise.resolve();
  }

}
const errorAction = new ErrorAction();
export default errorAction;
