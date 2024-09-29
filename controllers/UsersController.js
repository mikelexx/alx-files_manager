import dbClient from '../utils/db';
import SHA1 from 'sha1';

export default class UsersController{

  static async postNew(req, res){
    const email = req.body.email;
    const password = req.body.password;

    if(!email){
      return res.status(400).json({error: 'Missing email' });
    }
    if(!password){
      return res.status(400).send({error: 'Missing password' });
    }
    if(!dbClient.isAlive()){
      return res.status(500).send({error: 'DATABASE NOT COONNECTED!' });
    }

    try{
      const existingUser = await dbClient.client.db().collection('users').findOne({'email': email})
      if(!existingUser){
        const dbInsertFeedback = await dbClient.client.db().collection('users').insertOne({'email': email, 'password': SHA1(password)});
        return res.status(201).json({'id': dbInsertFeedback.insertedId, 'email': email});
      }
      else{
        return res.status(400).send({error: 'Already exist' });
      }

    } catch(err){
      return res.status(500).send(err);
    }
  }
}
