import redisClientInstance from '../utils/redis';
import dbClient from '../utils/db';
export default class AppController{
  static getStatus(req, res){
    console.log('AppController.getStats called');
    const isDbAlive = dbClient.isAlive();
    const isRedisAlive = redisClientInstance.isAlive();
    res.status(200).json({ "redis": isDbAlive, "db": isRedisAlive });
  }

  static async getStats(req, res){
    try{
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();
      res.status(200).json({ "users": usersCount, "files": filesCount });
    }catch(err){
      res.status(500).send();
    }
  }

}
