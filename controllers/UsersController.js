import SHA1 from 'sha1';
import dbClient from '../utils/db';
import redisClientInstance from '../utils/redis';
const { ObjectID } = require('mongodb');

export default class UsersController {
  static async getMe(req, res) {
    const token = req.get('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const id = await redisClientInstance.get(`auth_${token}`);
      const existingUser = await dbClient.client.db().collection('users').findOne({ _id: new ObjectID(id)});
      if (!existingUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({email: existingUser.email, id: existingUser. _id});
    } catch (error) {
      console.log('we got a problem a tgetMe: ', error);
      return res.status(500).json({ error });
    }
  }

  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    if (!dbClient.isAlive()) {
      return res.status(500).send({ error: 'DATABASE NOT COONNECTED!' });
    }

    try {
      const existingUser = await dbClient.client.db().collection('users').findOne({ email });
      if (!existingUser) {
        const dbInsertFeedback = await dbClient.client.db().collection('users').insertOne({ email, password: SHA1(password) });
        return res.status(201).json({ id: dbInsertFeedback.insertedId, email });
      }
      return res.status(400).send({ error: 'Already exist' });
    } catch (err) {
      return res.status(500).send(err);
    }
  }
}
