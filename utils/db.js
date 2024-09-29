const { MongoClient } = require('mongodb');

let { DB_HOST } = process.env;
let { DB_PORT } = process.env;
let { DB_DATABASE } = process.env;
if (typeof DB_HOST === 'undefined') {
  DB_HOST = 'localhost';
}
if (typeof DB_PORT === 'undefined') {
  DB_PORT = 27017;
}
if (typeof DB_DATABASE === 'undefined') {
  DB_DATABASE = 'files_manager';
}

class DBClient {
  constructor() {
    this.connected = false;
    this.connectToServer();
  }

  async connectToServer() {
    const url = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;
    const options = { useUnifiedTopology: true };
    try {
      this.client = await MongoClient.connect(url, options);
      this.connected = true;
    } catch (err) {
      console.log('error connecting to server: ', err);
    }
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    return new Promise((resolve, reject) => {
      this.client.db().collection('users').countDocuments()
        .then((count) => resolve(count))
        .catch((err) => reject(err));
    });
  }

  async nbFiles() {
    return new Promise((resolve, reject) => {
      this.client.db().collection('files').countDocuments()
        .then((count) => resolve(count))
        .catch((err) => reject(err));
    });
  }
}

const dbClient = new DBClient();
export default dbClient;
