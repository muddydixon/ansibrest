#!/usr/bin/env node
"use strict";

const http = require("http");
const express = require("express");
const Fs = require("fs");
const yaml = require("js-yaml");
const Path = require("path");
const commander = require("commander");
const BodyParser = require("body-parser");
const ServeStatic = require("serve-static");
const CookieParser = require("cookie-parser");
const log4js = require("log4js");
const debug = require("debug")("ansibrest");
const Handlers = require("./handlers");

const cnfPath = Path.join(process.cwd(), ".ansibrest");
const config = yaml.safeLoad(Fs.readFileSync(cnfPath, "utf8")) || {};
const program = commander
        .option("-p,--port <PORT>", "PORT", Number, config.port || 2400)
        .option("--endpoint <ENDPOINT>", "ENDPOINT", String, config.endpoint || "")
        .option("--ansible-path <ANSIBLE_PATH>", "ANSIBLE_PATH", String, config.ansible_path || "ansible")
        .option("--inventory-path <INVENTORY_PATH>", "INVENTORY_PATH", String, config.inventory_path || "inventories")
        .parse(process.argv);

config.ansiblePath =   program.ansiblePath;
config.inventoryPath = program.inventoryPath;
const app = express();

app.use(ServeStatic(Path.join(__dirname, "../public"), {index: ["index.html"]}));
app.use(ServeStatic(Path.join(__dirname, "../node_modules")));
app.use(BodyParser.urlencoded({extended: true}));
app.use(BodyParser.json());
app.use(CookieParser());
app.use((req, res, next)=>{
  res.set("X-Powered-By", null);
  next();
});

const handlers = Handlers(config);
app.route(`${program.endpoint}/api/playbook`)
  .get(handlers.getPlaybooks);

app.route(`${program.endpoint}/api/playbook/:playbook`)
  .post(handlers.execPlaybook)
  .get(handlers.getPlaybook);

app.route(`${program.endpoint}/api/inventory`)
  .get(handlers.getInventories);

app.route(`${program.endpoint}/api/config`)
  .get(handlers.getConfig)
  .put(handlers.setConfig);

app.route((err, req, res, next)=>{
  res.json({error: err, status: err.status});
});

app.route((req, res, next)=>{
  res.status(404).json({error: "Not Found", status: 404});
});

const server = http.createServer(app);
server.listen(program.port);
server.on("listening", ()=>{
  console.log(`server start on ${program.port}`);
});
server.on("error", (err)=>{
  console.log(err);
  process.exit(-1);
});
process.on("uncaughtException", (err)=>{
  console.log(err);
  process.exit(-1);
});
