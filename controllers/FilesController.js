import fs from 'fs';
export default class FilesController{
  static postUpload(req, res){
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
