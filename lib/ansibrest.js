const Path = require("path");
const express = require("express");
const BodyParser = require("body-parser");
const ServeStatic = require("serve-static");
const CookieParser = require("cookie-parser");
const debug = require("debug")("ansibrest:app");
const Handlers = require("./handlers");

module.exports = class Ansibrest {
  constructor(opts){
    this.opts = opts;
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

    const handlers = Handlers(this.opts);
    const router = express.Router();
    this.mountHandlers(router, handlers);
    app.use(`${this.opts.basePath}`, router);

    app.route((err, req, res, next)=>{
      res.status(500).json({error: err, status: err.status});
    });

    app.route((req, res, next)=>{
      res.status(404).json({error: "Not Found", status: 404});
    });
    return app;
  }

  mountHandlers(router, handlers){
    router.get(`/api/playbook`, handlers.getPlaybooks);

    router.get(`/api/playbook/:playbook`, handlers.getPlaybook);
    router.post(`/api/playbook/:playbook`, handlers.execPlaybook);

    router.get(`/api/inventory`, handlers.getInventories);

    router.get(`/api/config`, handlers.getConfig);
    router.put(`/api/config`, handlers.setConfig);
  }
};
