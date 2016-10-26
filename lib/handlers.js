const Path = require("path");
const Fs = require("fs");
const yaml = require("js-yaml");
const debug = require("debug")("ansibrest:handler");
const cnfPath = Path.join(process.cwd(), ".ansibrest");
const Ansible = require("./ansible");

module.exports = (config)=>{
  const ansible = new Ansible({
    ansiblePath: Path.join(process.cwd(), config.ansiblePath),
    inventoryPath: Path.join(process.cwd(), config.ansiblePath, config.inventoryPath)
  });

  const getPlaybooks = (req, res, next)=>{
    ansible.fetchAllPlaybooks().then(playbooks =>{
      res.json(playbooks.map((playbook)=>{ return {name: playbook};}));
    }).catch(next);
  };
  const getPlaybook = (req, res, next)=>{
    const playbook = req.params.playbook;
    ansible.fetchPlaybook(playbook, req.query.inventory).then(playbook =>{
      res.json(playbook);
    }).catch(next);
  };

  const execPlaybook = (req ,res ,next)=>{
    const playbook = req.params.playbook;
    const inventory = req.query.inventory || "development";
    const host = req.query.host || "";
    const startAt = req.query.startAt;
    debug({
      playbook,
      inventory,
      host,
      startAt
    });
    ansible.execPlaybook(playbook, inventory, host, startAt).then(({stdout, stderr})=>{
      res.json({stdout, stderr});
    }).catch(next);
  };

  const getInventories = (req, res, next)=>{
    ansible.fetchAllInventories().then(inventories =>{
      debug(inventories);
      res.json(inventories);
    }).catch(next);
  };

  const getConfig = (req, res, next)=>{
    return res.json({
      ansiblePath: ansible.ansiblePath,
      inventoryPath: ansible.inventoryPath
    });
  };

  const setConfig = (req, res, next)=>{
    try{
      if(req.body.ansiblePath) ansible.ansiblePath = req.body.ansiblePath;
      if(req.body.inventoryPath) ansible.inventoryPath = req.body.inventoryPath;
    }catch(err){
      return next(err);
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
