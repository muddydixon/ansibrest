import React, {Component} from "react";
import {Router, Route, IndexRoute, hashHistory, PropTypes, Link} from "react-router";
import {render} from "react-dom";
import {Dispatcher} from "flux";
import {Container, ReduceStore} from "flux/utils";

import Header from "./components/header";

import dispatcher from "./dispatcher";

import PlaybookStore from "./stores/playbook-store";
import InventoryStore from "./stores/inventory-store";
import ConfigStore from "./stores/config-store";
import ErrorStore from "./stores/error-store";

import PlaybookAction from "./actions/playbook-action";
import InventoryAction from "./actions/inventory-action";
import ConfigAction from "./actions/config-action";
import ErrorAction from "./actions/error-action";

const socket = io();
socket.on("progress", ({playbook, message})=>{
  PlaybookAction.progress(playbook, message);
});
socket.on("connect_error", (err)=>{
  ErrorAction.catch(err);
});

/*********
 * Components
 */
class Playbook extends Component {
  onPlay(ev){
    const {playbook} = this.props;
    const q = {
      inventory: this.refs.inventory.value.trim(),
      host: this.refs.host.value.trim(),
      startAt: this.refs.startAt.value.trim(),
      extraVars: this.refs.extraVars.value.trim()
    };
    PlaybookAction.play(playbook, q);
  }
  render(){
    const {playbook, inventories} = this.props;
    return <tr>
      <td><Link to={`/playbooks/${playbook.name}`}>{playbook.name}</Link></td>
      <td>
      <select className="form-control" name="inventory" ref="inventory">
      {inventories.map((inventory, idx)=> <option key={idx} value={inventory.name}>{inventory.name}</option>)}
      </select>
      </td>
      <td><input className="form-control" ref="host" /></td>
      <td><input className="form-control" ref="startAt" /></td>
      <td><input className="form-control" ref="extraVars"/></td>
      <td><Link to={`/playbooks/${playbook.name}/results`} className="btn btn-info" onClick={this.onPlay.bind(this)}>Play</Link></td>
      </tr>;
  }
}
Playbook.contextTypes = {router: React.PropTypes.object.isRequired};

class PlaybookDetail extends Component {
  componentWillMount(){
    PlaybookAction.fetch(this.props.params.playbook);
  }
  render(){
    const {error} = this.props.data;
    const playbookName = this.props.params.playbook;
    const playbook = this.props.data.playbooks.find((playbook)=> playbook.name === playbookName);
    if(!playbook) return <div />;

    const content = (error) ?
            <div className="container"><textarea className="form-control" readOnly="readonly" rows={10} defaultValue={error.message} /></div>
            : <table className="table">
            <thead><tr><th>Name</th><th>Host</th><th>Task</th><th>Tags</th></tr></thead>
            <tbody>
            {(playbook.plays || []).map((play, idx)=>{
              return [<tr><td rowSpan={(play.tasks || []).length + 1}>{play.name}</td><td rowSpan={(play.tasks || []).length + 1}>{play.hosts.join(", ")}</td><td/><td>{play.tags.join(", ") || "-" }</td></tr>].concat(
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
    const playbook = this.props.data.playbooks.find((playbook)=> playbook.name === playbookName);
    if(!playbook) return this.context.router.push("/");
    return <div className="container">
      <h2>{playbook.name}</h2>
      <div className="row">
      <pre><code>{(playbook.results || []).join("\n")}</code></pre>
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
        <col width="15%"></col>
        <col width="18%"></col>
        <col width="20%"></col>
        <col width="5%"></col>
      </colgroup>
      <thead>
      <tr><th>Playbook</th><th>Inventory</th><th>Host</th><th>StartAt</th><th>ExtraVars</th><th /></tr>
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
    return <tr><td><Link to={`/inventories/${inventory.name}`}>{inventory.name}</Link></td></tr>;
  }
}

class InventoryDetail extends Component {
  componentWillMount(){
    InventoryAction.fetchAll();
  }
  render(){
    const inventoryName = this.props.params.inventory;
    const {inventories} = this.props.data;
    const inventory = inventories.find((i)=> i.name === inventoryName);
    if(!inventory) return <div />;
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
    ConfigAction.fetch();
  }
  onSubmit(ev){
    ev.preventDefault();
    const config = {
      ansiblePath:   this.refs.ansiblePath.value.trim(),
      inventoryPath: this.refs.inventoryPath.value.trim()
    };
    ConfigAction.update(config).then(()=>{
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
      ErrorStore,
      PlaybookStore,
      InventoryStore,
      ConfigStore
    ];
  }
  static calculateState(state){
    return {
      error:       ErrorStore.getState(),
      playbooks:   PlaybookStore.getState(),
      inventories: InventoryStore.getState(),
      config:      ConfigStore.getState()
    };
  }
  componentWillMount(){
    PlaybookAction.fetchAll();
    InventoryAction.fetchAll();
    ConfigAction.fetch();
  }
  closeError(){
    ErrorAction.close();
  }
  render(){
    const error = this.state.error ?
            <div className="container alert alert-danger" role="alert">
            <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={this.closeError}>
              <span aria-hidden="true">&times;</span>
            </button>
            <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
            <span className="sr-only">Error: </span> {this.state.error.message}</div>: null;
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
         <Route path="playbooks/:playbook" component={PlaybookDetail} />
         <Route path="playbooks/:playbook/results" component={PlaybookResult} />
         <Route path="inventories/:inventory" component={InventoryDetail} />
         <Route path="config" component={Config} />
       </Route>
       </Router>,
       document.getElementById("app"));
