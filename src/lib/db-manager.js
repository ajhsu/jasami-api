require('babel-polyfill');

// MongoDB Driver
const mongo = require('mongodb').MongoClient;

class Database {
  constructor() {
    this.dbConnection = null;
    this.mongodbUri = null;
    this._connected = false;
  }
  get connected() {
    return this._connected;
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
      if (!this.mongodbUri) n(`The database hasn't been setup yet.`);
      mongo.connect(this.mongodbUri, opt, (err, db) => {
        if (err) {
          n(err);
        } else {
          this.dbConnection = db;
          this._connected = true;
          y(this.dbConnection);
          console.log('MongoDB connected');
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
    if (this.dbConnection && this._connected) {
      console.log('MongoDB is going to close..');
      return this.dbConnection.close();
    }
    return Promise.resolve('No connection');
  }
}
const instance = new Database();
export default instance;
