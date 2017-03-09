import express from 'express';
import cors from 'cors';
import requestPromise from 'request-promise';
import morgan from 'morgan';
import config from './config';
import routes from './middlewares/routes';

class Server {
  constructor() {
    this.express = null;
    this.expressRunningInstance = null;
    this.init();
  }
  init() {
    this.express = express();
    this.express.use(cors());
    this.express.use(morgan('dev'));
    this.express.use(routes);
  }
  boot() {
    this.expressRunningInstance = this.express.listen(config.port, () => {
      console.log(`Node-server start to listen on port ${config.port}..`);
    });
  }
  shutdown() {
    console.log('Node-server is going to shutdown..');
    this.expressRunningInstance.close();
  }
}

export default Server;
