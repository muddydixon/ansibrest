const Path = require("path");
const express = require("express");
const IO = require("socket.io");
const BodyParser = require("body-parser");
const ServeStatic = require("serve-static");
const CookieParser = require("cookie-parser");
const debug = require("debug")("ansibrest:app");
const Handlers = require("./handlers");

module.exports = class Ansibrest {
  constructor(opts){
    this.opts = opts;
    this.websocket = {};
  }

  app(){
    const app = this.app = express();
    app.use((req, res, next)=>{debug(req.originalUrl); return next();});
    app.use(ServeStatic(Path.join(__dirname, "../public"), {index: ["index.html"]}));
    app.use(ServeStatic(Path.join(__dirname, "../node_modules")));
    app.use(BodyParser.urlencoded({extended: true}));
    app.use(BodyParser.json());
    app.use(CookieParser());
    app.disable("x-powered-by");

    const handlers = Handlers(this.opts, this.websocket);
    const baseRouter = this.router(handlers);

    app.use((req, res, next)=>{debug(req.url); next();});
    app.use(`${this.opts.basePath}/api`, baseRouter);

    app.use((err, req, res, next)=>{
      this.opts.logger.error(err.detail);
      if(err.internal) this.opts.logger.error(err.internal);
      res.status(err.code || 500).json({error: err, status: err.status});
    });

    app.use((req, res, next)=>{
      res.status(404).json({error: "Not Found", status: 404});
    });

    return app;
  }

  socket(server){
    const io = this.websocket.io = IO(server);
    io.on("connection", socket =>{
      socket.on("disconnect", ()=>{
      });
    });
  }

  router(handlers){
    const baseRouter      = express.Router();
    const playbookRouter  = express.Router();
    const inventoryRouter = express.Router();
    const configRouter    = express.Router();

    baseRouter.use(`/playbooks`,  playbookRouter);
    baseRouter.use(`/inventories`, inventoryRouter);
    baseRouter.use(`/config`,    configRouter);


    playbookRouter.get("/", handlers.getPlaybooks);
    playbookRouter.get("/:playbook", handlers.getPlaybook);
    playbookRouter.post("/:playbook", handlers.execPlaybook);

    inventoryRouter.get("/", handlers.getInventories);

    configRouter.get("/", handlers.getConfig);
    configRouter.put("/", handlers.setConfig);

    return baseRouter;
  }
};
