import React, {Component} from "react";
import {Router, Route, IndexRoute, hashHistory, PropTypes, Link} from "react-router";
import {render} from "react-dom";
import {Dispatcher} from "flux";
import {Container, ReduceStore} from "flux/utils";
import request from "superagent";
import qs from "querystring";

import Header from "./components/header";

const dispatcher = new Dispatcher();

// Store
class PlaybookStore extends ReduceStore {
  getInitialState(){
    return [];
  }
  reduce(state, action){
    switch(action.type){
    case "FETCH_PLAYBOOKS":
      return action.playbooks;
    case "FETCH_PLAYBOOK":
      return state.map((playbook)=>{
        if(playbook.name === action.playbook.name){
          playbook.plays = action.playbook.plays || [];
          return playbook;
        }
        return playbook;
      });
    case "PLAY_PLAYBOOK":
      return state.map((playbook)=>{
        if(playbook !== action.playbook) return playbook;
        if(!playbook.results) playbook.results = [];
        playbook.results.push(action.result);
        return playbook;
      });
    default:
      return state;
    }
  }
};
const playbookStore = new PlaybookStore(dispatcher);

class InventoryStore extends ReduceStore {
  getInitialState(){
    return [];
  }
  reduce(state, action){
    switch(action.type){
    case "FETCH_INVENTORIES":
      return action.inventories;
    default:
      return state;
    }
  }
};
const inventoryStore = new InventoryStore(dispatcher);

class ConfigStore extends ReduceStore {
  getInitialState(){
    return {};
  }
  reduce(state, action){
    switch(action.type){
    case "FETCH_CONFIG":
      return action.config;
    case "UPDATE_CONFIG":
      return action.config;
    default:
      return state;
    }
  }
};
const configStore = new ConfigStore(dispatcher);

class ErrorStore extends ReduceStore {
  getInitialState(){
    return null;
  }
  reduce(state, action){
    switch(action.type){
    case "CATCH_ERROR":
      return action.error;
    default:
      return state;
    }
  }
};
const errorStore = new ErrorStore(dispatcher);

// Action
class PlaybookAction {
  fetchAll(){
    return new Promise((resolve, reject)=>{
      request.get("/api/playbook").end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: "CATCH_ERROR", error: res.body});
          return reject(err);
        }
        dispatcher.dispatch({type: "FETCH_PLAYBOOKS", playbooks: res.body});
        return resolve(res.body);
      });
    });
  }
  fetch(playbook){
    return new Promise((resolve, reject)=>{
      request.get(`/api/playbook/${playbook}`).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: "CATCH_ERROR", error: res.body});
          return reject(err);
        }
        dispatcher.dispatch({type: "FETCH_PLAYBOOK", playbook: res.body});
        return resolve(res.body);
      });
    });
  }
  play(playbook, query){
    return new Promise((resolve, reject)=>{
      request.post(`/api/playbook/${playbook.name}?${qs.stringify(query)}`).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: "CATCH_ERROR", error: res.body});
          return reject(err);
        }
        dispatcher.dispatch({type: "PLAY_PLAYBOOK", playbook, result: res.body});
        return resolve(res.body);
      });
    });
  }
}
const playbookAction = new PlaybookAction();

class InventoryAction {
  fetchAll(){
    return new Promise((resolve, reject)=>{
      request.get("/api/inventory").end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: "CATCH_ERROR", error: res.body});
          return reject(err);
        }
        dispatcher.dispatch({type: "FETCH_INVENTORIES", inventories: res.body});
        return resolve(res.body);
      });
    });
  }
}
const inventoryAction = new InventoryAction();

class ConfigAction {
  fetch(){
    return new Promise((resolve, reject)=>{
      request.get("/api/config").end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: "CATCH_ERROR", error: res.body});
          return reject(err);
        }
        dispatcher.dispatch({type: "FETCH_CONFIG", config: res.body});
        return resolve(res.body);
      });
    });
  }
  update(config){
    return new Promise((resolve, reject)=>{
      request.put("/api/config").send(config).end((err, res)=>{
        if(err){
          dispatcher.dispatch({type: "CATCH_ERROR", error: res.body});
          return reject(err);
        }
        dispatcher.dispatch({type: "UPDATE_CONFIG", config: res.body});
        return resolve(res.body);
      });
    });
  }
}
const configAction = new ConfigAction();

/*********
 * Components
 */
class Playbook extends Component {
  onPlay(ev){
    ev.preventDefault();
    const {playbook} = this.props;

    const q = {
      inventory: this.refs.inventory.value.trim(),
      host: this.refs.host.value.trim(),
      startAt: this.refs.startAt.value.trim()
    };
    playbookAction.play(playbook, q).then(()=>{
      this.context.router.push(`/playbook/${playbook.name}/results`);
    });
  }
  render(){
    const {playbook, inventories} = this.props;
    return <tr>
      <td><Link to={`/playbook/${playbook.name}`}>{playbook.name}</Link></td>
      <td>
      <select className="form-control" name="inventory" ref="inventory">
      {inventories.map((inventory, idx)=> <option key={idx} value={inventory.name}>{inventory.name}</option>)}
      </select>
      </td>
      <td><input className="form-control" ref="host" /></td>
      <td><input className="form-control" ref="startAt" /></td>
      <td><button className="btn btn-info" onClick={this.onPlay.bind(this)}>Play</button></td>
      </tr>;
  }
}
Playbook.contextTypes = {router: React.PropTypes.object.isRequired};

class PlaybookDetail extends Component {
  componentWillMount(){
    playbookAction.fetch(this.props.params.playbook);
  }
  render(){
    const {error} = this.props.data;
    const playbookName = this.props.params.playbook;
    const playbooks = this.props.data.playbooks.filter((playbook)=> playbook.name === playbookName);
    if((typeof playbooks === "undefined") || (playbooks.length === 0)) return <div />;
    const playbook = playbooks[0];

    const content = (error) ?
            <div className="container"><textarea className="form-control" readOnly="readonly" rows={10} defaultValue={error.message} /></div>
            : <table className="table">
            <thead><tr><th>Play</th><th>Task</th><th>Tags</th></tr></thead>
            <tbody>
            {(playbook.plays || []).map((play, idx)=>{
              return [<tr><td rowSpan={(play.tasks || []).length + 1}>{play.name}</td><td/><td>{play.tags.join(", ") || "-" }</td></tr>].concat(
                (play.tasks || []).map((task, idy)=>{
                  return <tr><td>{task.name}</td><td>{task.tags.join(", ") || "-"}</td></tr>;
                }));
            })}
    </tbody>
      </table>;

    return <div className="container">
      <h1>{playbook.name}</h1>
      {content}
      </div>;
  }
}
PlaybookDetail.contextTypes = {router: React.PropTypes.object.isRequired};

class PlaybookResult extends Component {
  render(){
    const playbookName = this.props.params.playbook;
    const playbooks = this.props.data.playbooks.filter((playbook)=> playbook.name === playbookName);
    if((typeof playbooks === "undefined") || (playbooks.length === 0)) return this.context.router.push("/");
    const playbook = playbooks[0];

    return <div className="container">
      <h2>{playbook.name}</h2>
      <div className="row">
      <pre><code>{playbook.results.shift().stdout}</code></pre>
      </div>
    </div>;
  }
}
PlaybookResult.contextTypes = {router: React.PropTypes.object.isRequired};

class Playbooks extends Component {
  render(){
    const {playbooks, inventories} = this.props;
    return <div className="container">
      <table className="table">
      <colgroup>
        <col width="auto"></col>
        <col width="15%"></col>
        <col width="18%"></col>
        <col width="18%"></col>
        <col width="5%"></col>
      </colgroup>
      <thead>
        <tr><th>Playbook</th><th>Inventory</th><th>Host</th><th>StartAt</th><th /></tr>
      </thead>
      <tbody>
        {(playbooks || []).map((playbook, id)=> <Playbook key={id} playbook={playbook} inventories={inventories}/> )}
      </tbody>
      </table>
      </div>;
  }
}

class Inventory extends Component {
  render(){
    const {inventory} = this.props;
    return <tr><td><Link to={`/inventory/${inventory.name}`}>{inventory.name}</Link></td></tr>;
  }
}

class InventoryDetail extends Component {
  componentWillMount(){
    inventoryAction.fetchAll();
  }
  render(){
    const inventoryName = this.props.params.inventory;
    const {inventories} = this.props.data;
    const cands = inventories.filter((i)=> i.name === inventoryName);
    if(cands.length === 0) return <div></div>;
    const inventory = cands[0];
    return <div className="container">
      <h2>{inventoryName}</h2>
      {Object.keys(inventory.values).map((group, id)=>{
        return <div key={id}>
          <h4>{group}</h4>
          <table className="table">
          <tbody>
          {Object.keys(inventory.values[group]).map((attr, idx)=>{
            return <tr key={idx}>
              <th>{attr}</th>
              <td>{attr !== inventory.values[group][attr] ? inventory.values[group][attr] : ""}</td>
              </tr>
          })}
          </tbody>
          </table>
          </div>;
      })}
      </div>
  }
}

class Inventories extends Component {
  render(){
    const {inventories} = this.props;
    return <div className="container">
      <table className="table">
      <colgroup>
        <col width="auto"></col>
      </colgroup>
      <thead>
        <tr><th>InventoryName</th></tr>
      </thead>
      <tbody>
        {(inventories || []).map((inventory, id)=> <Inventory key={id} inventory={inventory} /> )}
      </tbody>
      </table>
      </div>;
  }
}

class Config extends Component {
  componentWillMount(){
    configAction.fetch();
  }
  onSubmit(ev){
    ev.preventDefault();
    const config = {
      ansiblePath:   this.refs.ansiblePath.value.trim(),
      inventoryPath: this.refs.inventoryPath.value.trim()
    };
    configAction.update(config).then(()=>{
      return this.context.router.push("/");
    });
  }
  render(){
    const {config} = this.props.data;
    if(Object.keys(config).length === 0) return <div />;
    return <div className="container">
      <form onSubmit={this.onSubmit.bind(this)} >
      <table className="table">
      <tbody>
      <tr><th>AnsiblePath</th><td>
        <input className="form-control" ref="ansiblePath" defaultValue={config.ansiblePath} /></td></tr>
      <tr><th>InventoryPath</th><td>
        <input className="form-control" ref="inventoryPath" defaultValue={config.inventoryPath} /></td></tr>
      <tr><td><button className="btn btn-info btn-block">Update</button></td><td /></tr>
      </tbody>
      </table>
      </form>
      </div>;
  }
}
Config.contextTypes = {router: React.PropTypes.object.isRequired};

class Main extends Component {
  render(){
    const {playbooks, inventories} = this.props.data;
    return <div>
      <Playbooks playbooks={playbooks} inventories={inventories} />
      <Inventories inventories={inventories} />
      </div>;
  }
}

class App extends Component {
  static getStores(){
    return [
      errorStore,
      playbookStore,
      inventoryStore,
      configStore
    ];
  }
  static calculateState(state){
    return {
      error:       errorStore.getState(),
      playbooks:   playbookStore.getState(),
      inventories: inventoryStore.getState(),
      config:      configStore.getState()
    };
  }
  componentWillMount(){
    playbookAction.fetchAll();
    inventoryAction.fetchAll();
    configAction.fetch();
  }
  render(){
    console.log(this.state.error && this.state.error.error);
    const error = this.state.error ?
            <div className="container alert alert-danger" role="alert">
            <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
            <span className="sr-only">Error: </span> {this.state.error.error}</div>: null;
    console.log(error);
    return <div>
      <Header />
      {error}
      {React.cloneElement(this.props.children, {data: this.state})}
      </div>;
  }
};

render(<Router history={hashHistory}>
       <Route path="/" component={Container.create(App)}>
         <IndexRoute component={Main} />
         <Route path="playbook/:playbook" component={PlaybookDetail} />
         <Route path="playbook/:playbook/results" component={PlaybookResult} />
         <Route path="inventory/:inventory" component={InventoryDetail} />
         <Route path="config" component={Config} />
       </Route>
       </Router>,
       document.getElementById("app"));
