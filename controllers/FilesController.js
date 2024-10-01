import fs from 'fs';
import path from 'path';
import process from 'process';
import {v4 as uuidv4} from 'uuid';
import redisClientInstance from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectID } = require('mongodb');
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
export default class FilesController{
  static async postUpload(req, res){
    console.log('FilesController called');
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
      const userId = new ObjectID(existingUser._id);
      const {name, type, parentId = 0, isPublic = false, data} = req.body;
      if(!name) return res.status(400).json({ error: 'Missing name' });
      if(!type || !['folder', 'file', 'image'].includes(type)){
        return res.status(400).json({error: 'Missing type'});
      }
      if(!data && type !== 'folder') return res.status(400).json('Missing data');
      console.log('fininshed processing req params');

      if(parentId){
        console.log('looking for file paretnId from redis...');
        const parentFile = await dbClient.client.db().collection('files').findOne({ _id: new ObjectID(parentId)});
        if(!parentFile) return res.status(400).json({error: 'Parent not found'});
        if(parentFile.type !== 'folder') return res.status(400).json({error: 'Parent is not a folder'});
      }
      if(type === 'folder'){
        const folderDoc = {userId, name, type, isPublic, parentId};
        console.log('inserting a folder doc into mongodb');
        const folderDocInsertedFeedback = await dbClient.client.db().collection('files').insertOne(folderDoc);
        return res.status(201).json({
          id: folderDocInsertedFeedback.ops[0]._id,
          userId,
          name,
          type,
          isPublic,
          parentId });
      }else{
        console.log('decoding base64 data');
        const base64decodedData = Buffer.from(data, 'base64');
        const localPath = path.join(FOLDER_PATH, uuidv4());
        console.log('writing file data to filesystem ...');
        if(!fs.existsSync(FOLDER_PATH)){
          fs.mkdir(localPath, {recursive: true}, (error)=>{return req.status(500).json(error)});
        }
        fs.writeFile(localPath, base64decodedData, (error)=>{return res.status(500).json({error})});
        const fileDoc = {userId, name, type, isPublic, parentId, localPath};
        const fileDocInsertedFeedback = await dbClient.client.db().collection('files').insertOne(fileDoc);
        return res.status(201).json({
          id: fileDocInsertedFeedback.ops[0]._id,
          userId,
          name,
          type,
          isPublic,
          parentId });
      }

    } catch (error) {
      console.log('we got a problem a tgetMe: ', error);
      return res.status(500).json({ error });
    }
  }
}
