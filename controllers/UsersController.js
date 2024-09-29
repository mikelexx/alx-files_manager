import dbClient from '../utils/db';
import SHA1 from 'sha1';

export default class UsersController{

  static async postNew(req, res){
    const email = req.body.email;
    const password = req.body.password;

    if(typeof email === 'undefined'){
      return res.status(400).send('Missing email');
    }
    if(typeof password === 'undefined'){
      return res.status(400).send('Missing password');
    }

    if(!dbClient.isAlive()){
      return res.status(500).send('DATABASE NOT COONNECTED!');
    }

    try{
      const existingUser = await dbClient.client.db().collection('users').findOne({'email': email})
      if(!existingUser){
        const dbInsertFeedback = await dbClient.client.db().collection('users').insertOne({email: email, password: SHA1(password)});
        return res.status(201).json({'id': dbInsertFeedback.insertedId, 'email': email});
      }
      else{
        return res.status(400).send(`Already exist`);
      }

    } catch(err){
      return res.status(500).send(err);
    }
  }
}
