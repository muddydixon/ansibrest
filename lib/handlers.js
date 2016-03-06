"use strict";

const Fs = require("fs");
const Path = require("path");
const exec = require("child_process").exec;
const debug = require("debug")("handler");
const yaml = require("js-yaml");
const ini = require("./ini");
const cnfPath = Path.join(process.cwd(), ".ansibrest");
const ansibleTasksParser = require("./ansible");

module.exports = (config)=>{
  const ansiblePath = (path)=> Path.join(process.cwd(), path || config.ansiblePath);
  const inventoryPath = (path)=> Path.join(ansiblePath(), path || config.inventoryPath);


  const getPlaybooks = (req, res, next)=>{
    const playbooks = Fs.readdirSync(ansiblePath()).filter((f)=> Path.extname(f) === ".yml");
    res.json(playbooks.map((playbook)=>{ return {name: playbook};}));
  };
  const getPlaybook = (req, res, next)=>{
    const playbook = req.params.playbook;
    const content = Fs.readFileSync(Path.join(ansiblePath(), req.params.playbook), "utf8");
    const inventory = Path.join(inventoryPath(), req.query.inventory || "development");
    exec(`cd ${ansiblePath()} && ansible-playbook -i ${inventory} ${playbook} --list-tasks`, (err, stdout, stderr)=>{
      if(err) return res.status(500).json({error: "invalid Playbook", message: err.message});
      return res.json(ansibleTasksParser(stdout));
    });
  };

  const execPlaybook = (req ,res ,next)=>{
    const playbook = req.params.playbook;
    const inventory = Path.join(inventoryPath(), req.query.inventory || "development");
    const host = req.query.host ? `-l ${req.query.host}` : "";
    const startAt = req.query.startAt ? `--start-at ${req.query.startAt}` : "";
    debug({
      playbook,
      inventory,
      host,
      startAt
    });
    exec(`cd ${ansiblePath()} && ansible-playbook -i ${inventory} ${playbook} ${host} ${startAt}`, (err, stdout, stderr)=>{
      res.json({stdout: stdout, stderr: stderr});
    });
  };

  const getInventories = (req, res, next)=>{
    if(!Fs.existsSync(inventoryPath())) return res.status(404).json({error: "Not Found", status: 404});
    const inventorieFiles = Fs.readdirSync(inventoryPath());
    const inventories = inventorieFiles.map((inventoryFile)=>{
      const body = Fs.readFileSync(Path.join(inventoryPath(), inventoryFile));
      const data = ini.parse(body.toString());

      return {
        name: inventoryFile,
        values:   data
      };
    });
    return res.json(inventories);
  };

  const getConfig = (req, res, next)=>{
    return res.json({
      ansiblePath: config.ansiblePath,
      inventoryPath: config.inventoryPath
    });
  };

  const setConfig = (req, res, next)=>{
    try{
      Fs.statSync(ansiblePath(req.body.ansiblePath));
      config.ansiblePath = req.body.ansiblePath || config.ansiblePath;
    }catch(err){
      console.error(ansiblePath(req.body.ansiblePath));
      return res.status(400).json({error: `${req.body.ansiblePath} is not existing`});
    }
    try{
      Fs.statSync(inventoryPath(req.body.inventoryPath));
      config.inventoryPath = req.body.inventoryPath || config.inventoryPath;
    }catch(err){
      console.error(inventoryPath(req.body.inventoryPath));
      return res.status(400).json({error: `${req.body.ansiblePath} is not existing`});
    }

    Fs.writeFileSync(cnfPath, yaml.dump({
      ansiblePath: config.ansiblePath,
      inventoryPath: config.inventoryPath
    }));
    return res.json({
      ansiblePath: req.body.ansiblePath,
      inventoryPath: req.body.inventoryPath
    });
  };

  return {
    getPlaybooks,
    getPlaybook,
    execPlaybook,
    getInventories,
    getConfig,
    setConfig
  };
};
