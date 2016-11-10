import request from "superagent";
import dispatcher from "../dispatcher";
import Const from "../const";

class ConfigAction {
  fetch(){
    return new Promise((resolve, reject)=>{
      request.get(`${Const.basePath}/config`).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: Const.CATCH_ERROR, error: res.body.error});
          return reject(err);
        }
        dispatcher.dispatch({type: Const.FETCH_CONFIG, config: res.body});
        return resolve(res.body);
      });
    });
  }
  update(config){
    return new Promise((resolve, reject)=>{
      request.put(`${Const.basePath}/config`).send(config).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: Const.CATCH_ERROR, error: res.body.error});
          return reject(err);
        }
        dispatcher.dispatch({type: Const.UPDATE_CONFIG, config: res.body});
        return resolve(res.body);
      });
    });
  }
}
const configAction = new ConfigAction();
export default configAction;
