"use strict";

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

class AppStore extends ReduceStore {
  getInitialState(){
    return {};
  }
  reduce(state, action){
    switch(action.type){
    case "FETCH_APP":
      return action.app;
    case "UPDATE_APP":
      return action.app;
    default:
      return state;
    }
  }
};
const appStore = new AppStore(dispatcher);

// Action
class PlaybookAction {
  fetchAll(){
    return new Promise((resolve, reject)=>{
      request.get("/api/playbook").end((err, res)=>{
        if(err) return reject(err);
        dispatcher.dispatch({type: "FETCH_PLAYBOOKS", playbooks: res.body});
        return resolve(res.body);
      });
    });
  }
  play(playbook, query){
    console.log(query);
    return new Promise((resolve, reject)=>{
      request.post(`/api/playbook/${playbook.name}?${qs.stringify(query)}`).end((err, res)=>{
        if(err) return reject(err);
        dispatcher.dispatch({type: "PLAY_PLAYBOOK", playbook, result: res.body});
        return resolve(res.body);
      });
    });
  }
}
const playbookAction = new PlaybookAction();

class AppAction {
  fetch(){
    return new Promise((resolve, reject)=>{
      request.get("/api/config").end((err, res)=>{
        if(err) return reject(err);
        dispatcher.dispatch({type: "FETCH_APP", app: res.body});
        return resolve(res.body);
      });
    });
  }
  update(){
    return new Promise((resolve, reject)=>{
      request.get("/api/config").end((err, res)=>{
        if(err) return reject(err);
        dispatcher.dispatch({type: "UPDATE_APP", app: res.body});
        return resolve(res.body);
      });
    });
  }
}
const appAction = new AppAction();

// Components
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
    const {playbook} = this.props;
    return <tr>
      <td><Link to={`/playbook/${playbook.name}`}>{playbook.name}</Link></td>
      <td>
      <select className="form-control" name="inventory" ref="inventory">
      <option value="development">development</option>
      <option value="staging">staging</option>
      <option value="production">production</option>
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
  render(){
    const playbookName = this.props.params.playbook;
    const playbooks = this.props.data.playbooks.filter((playbook)=> playbook.name === playbookName);
    if((typeof playbooks === "undefined") || (playbooks.length === 0)) return this.context.router.push("/");
    const playbook = playbooks[0];

    return <div className="container">
      <h1>{playbook.name}</h1>
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
  componentWillMount(){
    playbookAction.fetchAll();
    appAction.fetch();
  }
  render(){
    const {playbooks} = this.props.data;
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
        {playbooks.map((playbook, id)=> <Playbook key={id} playbook={playbook} /> )}
      </tbody>
      </table>
      </div>;
  }
}

class Config extends Component {
  constructor(props){
    super(props);
  }
  componentWillMount(){
    appAction.fetch();
  }
  onSubmit(ev){
    ev.preventDefault();
    const app = {
      ansiblePath:   this.refs.ansiblePath.value.trim(),
      inventoryPath: this.refs.inventoryPath.value.trim()
    };
    appAction.update(app);
  }
  render(){
    const {app} = this.props.data;
    if(Object.keys(app).length === 0) return <div />;
    return <div className="container">
      <form onSubmit={this.onSubmit.bind(this)} >
      <table className="table">
      <tbody>
      <tr><th>AnsiblePath</th><td>
        <input className="form-control" ref="ansiblePath" defaultValue={app.ansiblePath} /></td></tr>
      <tr><th>InventoryPath</th><td>
        <input className="form-control" ref="inventoryPath" defaultValue={app.inventoryPath} /></td></tr>
      <tr><td><button className="btn btn-block">Update</button></td><td /></tr>
      </tbody>
      </table>
      </form>
      </div>;
  }
}

class App extends Component {
  static getStores(){
    return [
      playbookStore,
      appStore
    ];
  }
  static calculateState(state){
    return {
      playbooks: playbookStore.getState(),
      app: appStore.getState()
    };
  }
  render(){
    return <div>
      <Header />
      {React.cloneElement(this.props.children, {data: this.state})}
      </div>;
  }
};

render(<Router history={hashHistory}>
       <Route path="/" component={Container.create(App)}>
         <IndexRoute component={Playbooks} />
         <Route path="playbook/:playbook" component={PlaybookDetail} />
         <Route path="playbook/:playbook/results" component={PlaybookResult} />
         <Route path="config" component={Config} />
       </Route>
       </Router>,
       document.getElementById("app"));
