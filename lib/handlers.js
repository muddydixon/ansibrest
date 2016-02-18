"use strict";

const Fs = require("fs");
const Path = require("path");
const exec = require("child_process").exec;
const debug = require("debug")("handler");
// const Ansible = require("node-ansible");

module.exports = (config)=>{
  const ansiblePath = ()=> Path.join(process.cwd(), config.ansiblePath);
  const inventoryPath = ()=> Path.join(ansiblePath(), config.inventoryPath);
  return {
    getPlaybooks: (req, res, next)=>{
      const playbooks = Fs.readdirSync(ansiblePath()).filter((f)=> Path.extname(f) === ".yml");
      res.json(playbooks.map((playbook)=>{ return {name: playbook};}));
    },
    getPlaybook: (req, res, next)=>{
      const playbook = req.params.playbook;
      const content = Fs.readFileSync(Path.join(ansiblePath(), req.params.playbook), "utf8");
      const inventory = Path.join(inventoryPath(), req.query.inventory || "development");
      res.json({});
    },
    execPlaybook: (req ,res ,next)=>{
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
    },

    getInventories: (req, res, next)=>{
      if(!Fs.existsSync(inventoryPath())) return res.status(404).json({error: "Not Found", status: 404});
      const inventories = Fs.readdirSync(inventoryPath());
      return res.json({inventories});
    },

    getConfig: (req, res, next)=>{
      return res.json({
        ansiblePath: config.ansiblePath,
        inventoryPath: config.inventoryPath
      });
    },
    setConfig: (req, res, next)=>{
      config.ansiblePath = req.body.ansiblePath;
      config.inventoryPath = req.body.inventoryPath;

      return res.json({
        ansiblePath: config.ansiblePath,
        inventoryPath: config.inventoryPath
      });
    }
  };
};
