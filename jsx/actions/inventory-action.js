import request from "superagent";
import dispatcher from "../dispatcher";
import Const from "../const";

class InventoryAction {
  fetchAll(){
    return new Promise((resolve, reject)=>{
      request.get(`${Const.basePath}/inventories`).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: Const.CATCH_ERROR, error: res.body.error});
          return reject(err);
        }
        dispatcher.dispatch({type: Const.FETCH_INVENTORIES, inventories: res.body});
        return resolve(res.body);
      });
    });
  }
}
const inventoryAction = new InventoryAction();
export default inventoryAction;
