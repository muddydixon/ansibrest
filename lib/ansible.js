const Fs = require("fs");
const Path = require("path");
const spawn = require("child_process").spawn;
const debug = require("debug")("ansibrest:ansible");
const ini = require("./ini");
const errors = require("./errors");

module.exports = class Ansible {
  constructor(config = {}){
    this.config = config;
  }
  set ansiblePath(path){
    try{
      Fs.statSync(path);
      this.config.ansiblePath = path;
      return this;
    }catch(err){
      throw new errors.AnsiblePathNotFoundError(`${path} is not existing`);
    }
  }
  get ansiblePath(){
    return this.config.ansiblePath;
  }
  set inventoryPath(path){
    try{
      Fs.statSync(Path.join(this.ansiblePath, path));
      this.config.inventoryPath = Path.join(this.ansiblePath, path);
      return this;
    }catch(err){
      throw new errors.InventoryPathNotFoundError(`${path} is not existing`);
    }
  }
  get inventoryPath(){
    return this.config.inventoryPath;
  }

  parseTasks(tasks){
    const lines = tasks.split("\n").filter((l)=> !l.match(/^[\s]*$/)).map((l)=>{
      const m = l.match(/^(\s*)([^\t]+)(\tTAGS:\s+\[(.*)\])?$/);
      if(!m) return null;
      const indentLevel = m[1].length;
      const tags = m[4] ? m[4].split(/\s*,\s*/) : [] ;
      const name = m[2];
      return {name, indentLevel, tags};
    }).filter((l)=>l);

    const playbook = {
      name: null,
      plays: []
    };

    lines.forEach((l)=>{
      if(l.indentLevel === 0){
        playbook.name = l.name.replace(/^playbook:\s+/, "");
      }else if(l.indentLevel === 2){
        const m = l.name.match(/^play\s#(\d)\s\((.+)\):\s*(.+)$/);
        if(!m) return;
        playbook.plays.push({
          name:  m[3],
          hosts: m[2].split(/[,:]/),
          id:    m[1],
          tags:  l.tags,
          tasks: []
        });
      }else if(l.indentLevel === 6){
        playbook.plays[playbook.plays.length - 1].tasks.push({
          name: l.name,
          tags: l.tags
        });
      }
    });
    return playbook;
  }

  execute(cmd, playbook, io){
    const c = cmd.split(/\s+/).shift();
    const args = cmd.split(/\s+/).slice(1).filter(l => l);
    debug(`command "${c}", args: [${args.join(",")}] on ${this.ansiblePath}`);
    const command = spawn(c, args, {cwd: this.ansiblePath});
    const stdout = [];
    const stderr = [];
    command.stdout.on("data", (data)=>{
      if(io) io.emit("progress", {playbook, message: data.toString()});
      stdout.push(data.toString());
    });
    command.stderr.on("data", (data)=>{
      stderr.push(data.toString());
    });
    return new Promise((resolve, reject)=>{
      command.on("close", ()=>{
        console.log({stdout: stdout.join("\n"), stderr: stderr.join("\n")});
        resolve({stdout: stdout.join("\n"), stderr: stderr.join("\n")});
      });
      command.on("error", (err)=>{
        reject(new errors.ExecuteAnsibleError(err.message, {
          detail: stdout.join("\\n")}));
      });
    });
  }

  fetchAllPlaybooks(){
    const playbooks = Fs.readdirSync(this.ansiblePath).filter((f)=> Path.extname(f) === ".yml");
    return Promise.resolve(playbooks);
  }
  fetchPlaybook(playbook, inventory){
    const content = Fs.readFileSync(Path.join(this.ansiblePath, playbook), "utf8");
    inventory = Path.join(this.inventoryPath, inventory || "development");
    const cmd = `ansible-playbook -i ${inventory} ${playbook} --list-tasks`;
    return this.execute(cmd).then(({stdout, stderr})=>{
      return this.parseTasks(stdout);
    }).catch(err =>{
      if(err instanceof errors.ExecuteAnsibleError){
        throw new errors.FetchPlaybookError(`${playbook} fetch failure`, {
          detail: err.message, internal: err.detail});
      }
      throw err;
    });
  }
  execPlaybook(playbook, inventory, host, startAt, io){
    inventory = Path.join(this.inventoryPath, inventory || "development");
    const cmd = `ansible-playbook -i ${inventory} ${playbook} ${host ? `-l ${host}` : ""} ${startAt ? `--start-at ${startAt}` : ""}`;
    return this.execute(cmd, playbook, io).catch(err=>{
      if(err instanceof errors.ExecuteAnsibleError){
        throw new errors.ExecutePlaybookError(`${playbook} execute failure`, {
          detail: err.message, internal: err.detail});
      }
      throw err;
    });
  }

  fetchAllInventories(){
    if(!Fs.existsSync(this.inventoryPath)) return Promise.reject(new errors.InventoryPathNotFoundError(`${this.inventoryPath} Not Found`));
    const inventoryFiles = Fs.readdirSync(this.inventoryPath);
    const inventories = inventoryFiles.map((inventoryFile)=>{
      const body = Fs.readFileSync(Path.join(this.inventoryPath, inventoryFile));
      const data = ini.parse(body.toString());
      return {
        name:  inventoryFile,
        values: data
      };
    });
    return Promise.resolve(inventories);
  }
};
