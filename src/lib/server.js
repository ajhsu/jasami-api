import express from 'express';
import cors from 'cors';
import requestPromise from 'request-promise';
import morgan from 'morgan';
import routes from './middlewares/routes';
import database from './db-manager';
import bodyParser from 'body-parser';

class Server {
  constructor() {
    this.express = null;
    this.expressRunningInstance = null;
    this.init();
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
  boot({ port = 3000 }) {
    return new Promise((y, n) => {
      const mongodbConfig = {
        address: 'localhost',
        port: 27017,
        dbName: 'jasami_test_db'
      };
      database.init(mongodbConfig);
      database
        .connect()
        .then(() => {
          this.expressRunningInstance = this.express.listen(port, () => {
            console.log(`Node-server start to listen on port ${port}..`);
            y('ok');
          });
        })
        .catch(err => {
          throw new Error(err);
        });
    });
  }
  shutdown() {
    if (database) {
      console.log('Database connection is going to close..');
      database.close();
    }
    if (this.expressRunningInstance) {
      console.log('Node-server is going to shutdown..');
      this.expressRunningInstance.close();
    }
  }
}

export default Server;
