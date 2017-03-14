import express from 'express';
import cors from 'cors';
import requestPromise from 'request-promise';
import morgan from 'morgan';
import routes from './middlewares/routes';
import dbManager from './db-manager';
import bodyParser from 'body-parser';

class Server {
  constructor() {
    this.express = null;
    this.expressRunningInstance = null;
    this.init();
    console.log('Server created');
  }
  init() {
    this.express = express();
    // to support JSON-encoded bodies
    this.express.use(bodyParser.json());
    // to support URL-encoded bodies
    this.express.use(
      bodyParser.urlencoded({
        extended: true
      })
    );
    this.express.use(cors());
    this.express.use(morgan('dev'));
    this.express.use(routes);
  }
  _startExpressServer(port) {
    return new Promise((y, n) => {
      this.expressRunningInstance = this.express.listen(port, () => {
        console.log(`Node-server start to listen on port ${port}..`);
        y(port);
      });
    });
  }
  boot({ port = 3000 }) {
    const mongodbConfig = {
      address: 'localhost',
      port: 27017,
      dbName: 'jasami_test_db'
    };
    dbManager.init(mongodbConfig);
    return dbManager
      .connect()
      .then(db => this._startExpressServer(port));
  }
  async shutdown() {
    try {
      await dbManager.close();
      if (this.expressRunningInstance) {
        console.log('Node-server is going to shutdown..');
        this.expressRunningInstance.close();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

export default Server;
