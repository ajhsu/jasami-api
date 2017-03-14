require('babel-polyfill');

// MongoDB Driver
const mongo = require('mongodb').MongoClient;

class Database {
  constructor() {
    this.dbConnection = null;
    this.mongodbUri = null;
  }
  init(
    {
      address,
      port,
      dbName
    }
  ) {
    this.mongodbUri = `mongodb://${address}:${port}/${dbName}`;
  }
  connect() {
    const opt = {
      poolSize: 10,
      ssl: false
    };
    return new Promise((y, n) => {
      if (!this.mongodbUri)
        throw new Error(`The database hasn't been setup yet.`);
      mongo.connect(this.mongodbUri, opt, (err, db) => {
        if (err) {
          throw new Error(err);
        } else {
          this.dbConnection = db;
          y(this.dbConnection);
        }
      });
    });
  }
  get query() {
    if (!this.dbConnection)
      throw new Error('MongoDB has not been connected yet.');
    return this.dbConnection;
  }
  close() {
    this.dbConnection.close();
  }
}
const instance = new Database();
export default instance;
