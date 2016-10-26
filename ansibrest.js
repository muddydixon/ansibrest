#!/usr/bin/env node

const http = require("http");
const commander = require("commander");
const Fs = require("fs");
const Path = require("path");
const yaml = require("js-yaml");
const log4js = require("log4js");

const Ansibrest = require("./lib/ansibrest");

const cnfPath = Path.join(process.cwd(), ".ansibrest");
const config = yaml.safeLoad(Fs.readFileSync(cnfPath, "utf8")) || {};

const program = commander
        .option("-p,--port <PORT>", "PORT", Number, config.port || 2400)
        .option("--base-path <BASE_PATH>", "BASE_PATH", String, config.base_path || "")
        .option("--ansible-path <ANSIBLE_PATH>", "ANSIBLE_PATH", String, config.ansible_path || "ansible")
        .option("--inventory-path <INVENTORY_PATH>", "INVENTORY_PATH", String, config.inventory_path || "inventories")
        .option("--log-dir <LOG_DIR>", "LOG_DIR", String, config.log_dir)
        .parse(process.argv);

const getLogger = ()=>{
  const getLogConfig = ()=>{
    if(!program.logDir || program.logDir === ""){
      return {
        category: "ansibrest",
        type: "console"
      };
    }else{
      const logDir = Path.join(__dirname, program.logDir);
      try{
        Fs.statSync(logDir);
      }catch(err){
        Fs.mkdirSync(logDir);
      }
      return {
        category: "ansibrest",
        type: "dateFile",
        filename: `${program.logDir}/ansibrest.log`,
        pattern: ".yyyyMMdd"
      };
    }
  };
  log4js.configure({appenders: [getLogConfig()]});
  return log4js.getLogger("ansibrest");
};

const logger = program.logger = getLogger();
const ansibrest = new Ansibrest(program);
const server = http.createServer(ansibrest.app());
server.listen(program.port);
server.on("listening", ()=>{
  logger.info(`ansibrest start on ${program.port}`);
});
server.on("error", (err)=>{
  logger.error(err.stack);
  process.exit(-1);
});
server.on("uncaughtException", (err)=>{
  logger.error(err.stack);
  process.exit(-1);
});
