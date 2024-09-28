import redis from 'redis';

class RedisClient {
  constructor() {
    this.redisClient = redis.createClient();
    this.redisClient.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.redisClient.connected;
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.redisClient.get(key, (err, val) => {
        if (err) {
          reject(err);
        } else {
          resolve(val);
        }
      });
    });
  }

  async set(key, val, duration) {
    return new Promise((resolve, reject) => {
      this.redisClient.set(key, val, 'EX', duration, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.redisClient.del(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}

const redisClientInstance = new RedisClient();
export default redisClientInstance;
