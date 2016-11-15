import request from "superagent";
import qs from "querystring";
import dispatcher from "../dispatcher";
import Const from "../const";

class PlaybookAction {
  fetchAll(){
    return new Promise((resolve, reject)=>{
      request.get(`${Const.basePath}/playbooks`).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: Const.CATCH_ERROR, error: res.body.error});
          return reject(err);
        }
        dispatcher.dispatch({type: Const.FETCH_PLAYBOOKS, playbooks: res.body});
        return resolve(res.body);
      });
    });
  }
  fetch(playbook){
    return new Promise((resolve, reject)=>{
      request.get(`${Const.basePath}/playbooks/${playbook}`).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: Const.CATCH_ERROR, error: res.body.error});
          return reject(err);
        }
        dispatcher.dispatch({type: Const.FETCH_PLAYBOOK, playbook: res.body});
        return resolve(res.body);
      });
    });
  }
  play(playbook, query){
    dispatcher.dispatch({type: Const.PLAY_START_PLAYBOOK, playbook});
    return new Promise((resolve, reject)=>{
      request.post(`${Const.basePath}/playbooks/${playbook.name}?${qs.stringify(query)}`).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: Const.CATCH_ERROR, error: res.body.error});
          return reject(err);
        }
        dispatcher.dispatch({type: Const.PLAY_FINISH_PLAYBOOK, playbook, result: res.body});
        return resolve(res.body);
      });
    });
  }
  progress(playbook, msg){
    dispatcher.dispatch({type: Const.PLAY_PROGRESS_PLAYBOOK, playbook, message: msg});
  }
}
const playbookAction = new PlaybookAction();

export default playbookAction;
