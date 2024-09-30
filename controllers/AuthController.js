import dbClient from '../utils/db';
import redisClientInstance from '../utils/redis';
import SHA1 from 'sha1';
import {v4 as uuidv4} from 'uuid';
const { ObjectID } = require('mongodb');


export default class AuthController{
  static async getConnect(req, res){
    const authorizationCredentials = req.get('Authorization');
    if(!authorizationCredentials){
      return res.status(401).send({error: 'Unauthorized'});
    }
    const [auth_type,  sessionTokenInBase64 ] =  authorizationCredentials.split(' ');
    if(auth_type !== 'Basic'){
          return res.status(401).send({error: 'Unauthorized'});
    }
    const [ email, password ] = Buffer.from(sessionTokenInBase64, 'base64').toString().split(':');
      try{

        const existingUser = await dbClient.client.db().collection('users').findOne({'email': email});
        if(!existingUser){
          return res.status(401).send({error: 'Unauthorized'});
        }
        if(SHA1(password) !== existingUser.password){

          console.log(`passwords dont match`);

          return res.status(401).send({error: 'Unauthorized'});
        }
        const randomTOken = uuidv4();
        redisClientInstance.set(`auth_${randomTOken}`, existingUser._id.toString(), 24 * 3600);
        res.cookie('token', randomTOken);
        return res.status(200).json({ "token": randomTOken });
      }catch(error){
        return res.status(500).send({error,});
      }
  }


  static async getDisconnect(req, res){
    const reqCookie = req.get('X-Token');
    if(!reqCookie){
      return res.status(401).json({error: 'Unauthorized'});
    }
    try{
      console.log('awaiting redisClientInstance to get id from cookie key');
      const id = await redisClientInstance.get(`auth_${reqCookie}`);
      console.log('awating redisClientInstance to find user')
      const existingUser = await dbClient.client.db().collection('users').findOne({_id: new ObjectID(id)});
      if(!existingUser){
        return res.status(401).json({error: 'Unauthorized'});
      }
      console.log('awaiting redisClientInstance to delete use')
      await redisClientInstance.del(`auth_${reqCookie}`);
        console.log('exiting, returning 204')
      return res.status(204).send();

    }catch(err){
      return res.status(500).json({error: 'error on server side'});
    }
  }


}
