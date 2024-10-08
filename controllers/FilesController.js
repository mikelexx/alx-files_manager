import fs from 'fs';
import path from 'path';
import process from 'process';
import {v4 as uuidv4} from 'uuid';
import redisClientInstance from '../utils/redis';
import dbClient from '../utils/db';
import { promisify } from 'util';

const Queue = require('bull');
const { ObjectID } = require('mongodb');
const mime = require('mime-types');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const fileQueue = new Queue('fileQueue');
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
export default class FilesController{
  static async getFile(req, res){
    const token = req.get('X-Token');
    let {id, size} = req.params;

    try {
      let userId = await redisClientInstance.get(`auth_${token}`);
      userId?userId = new ObjectID(userId): userId = '';


      if(!ObjectID.isValid(id)) return res.status(401).json({error: 'Not found'});
      id = new ObjectID(id);

      const existingUserFile = await dbClient.client.db().collection('files').findOne({_id: id});

      if(!existingUserFile) return res.status(404).json({error: 'Not found'});
      if(existingUserFile && existingUserFile.userId.toString() !== userId.toString() && !existingUserFile.isPublic) return res.status(404).json({error: 'Not found'});
      if(existingUserFile.type === 'folder') return res.status(400).json({error: "A folder doesn't have content"});

      let {name, localPath} = existingUserFile;
      if(size) localPath = localPath + `_${size}`;

      if(!fs.existsSync(localPath)) return res.status(404).json({error: 'Not found'});
      const mimeType = mime.lookup(name);

      const data = await readFile(localPath);
      return res.status(200).set('Content-Type', mimeType).send(data);
    }catch(error){
      console.log('Error in getFile: ', error);
      return res.status(500).json({error});
    }
  }

  static async putUnpublish(req, res){


    const token = req.get('X-Token');
    let {id} = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {

      let userId = await redisClientInstance.get(`auth_${token}`);

      userId = new ObjectID(userId);
      const existingUser = await dbClient.client.db().collection('users').findOne({_id: userId});

      if (!existingUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }


      if(!ObjectID.isValid(id)) return res.status(401).json({error: 'Not found'});
      id = new ObjectID(id);
      const existingUserFile = await dbClient.client.db().collection('files').findOne({_id: id, userId});

      if(!existingUserFile) return res.status(404).json({error: 'Not found'});

      await dbClient.client.db().collection('files').updateOne({_id: id, userId}, { $set : {isPublic: false}});

      const {_id, localPath, isPublic, ...rest} = existingUserFile;
      return res.status(200).json({id: _id, isPublic: false, ...rest});


    }catch(error){
      console.log('error in FilesController.putPublish: ', error);
      return res.status(500).json(error);
    }
  }


  static async putPublish(req, res){

    console.log('FilesController.putPublish called');
    const token = req.get('X-Token');
    let {id} = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {

      let userId = await redisClientInstance.get(`auth_${token}`);

      userId = new ObjectID(userId);
      const existingUser = await dbClient.client.db().collection('users').findOne({_id: userId});

      if (!existingUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }


      if(!ObjectID.isValid(id)) return res.status(401).json({error: 'Not found'});
      id = new ObjectID(id);
      const existingUserFile = await dbClient.client.db().collection('files').findOne({_id: id, userId});

      if(!existingUserFile) return res.status(404).json({error: 'Not found'});

      await dbClient.client.db().collection('files').updateOne({_id: id, userId}, {$set:  {isPublic: true} });

      const {_id, localPath, isPublic,  ...rest} = existingUserFile;
      return res.status(200).json({id: _id, isPublic: true, ...rest});


    }catch(error){
      console.log('error in FilesController.putPublish: ', error);
      return res.status(500).json(error);
    }
  }

  static async getIndex(req, res){
    const token = req.get('X-Token');
    const {parentId=0, page=0} = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      let userId = await redisClientInstance.get(`auth_${token}`);
      if(!ObjectID.isValid(userId)) return res.status(401).json({error: 'Unauthorized'});
      userId = new ObjectID(userId);
      const existingUser = await dbClient.client.db().collection('users').findOne({ _id: userId});

      if (!existingUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // const matchParentId = { $and: [{ parentId }] };
      // const pipeline = [{ $match: matchParentId }, { $skip: page * 20 }, { $limit: 20 }];
      const existingUserFiles = await dbClient.client.db().collection('files').find({userId, parentId}, {limit: 20, skip: page * 20}).toArray();
      //const existingUserFiles = await dbClient.client.db().collection('files').aggregate(pipeline).toArray();
      const formattedResults = existingUserFiles.map(fileDoc=>{
        const {_id, localPath, ...rest} = fileDoc;
        return {id : _id, ...rest};
      })
      return res.status(200).json(formattedResults);

    }catch(error){
      console.log(error);
      return res.status(500).json({error});
    }
  }


  static async getShow(req, res){
    try {
      const token = req.get('X-Token');
      let {id} = req.params;
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }


      let userId = await redisClientInstance.get(`auth_${token}`);
      if(!ObjectID.isValid(userId)) return res.status(401).json({error: 'Unauthorized'});
      userId = new ObjectID(userId);
      const existingUser = await dbClient.client.db().collection('users').findOne({_id: userId});

      if (!existingUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if(!ObjectID.isValid(id)) return res.status(404).json({error: 'Not found'});
      id = new ObjectID(id);
      const existingFile = await dbClient.client.db().collection('files').findOne({userId, _id: id});

      if(!existingFile) return res.status(404).json({error: 'Not found'});
      const {_id,localPath, ...rest} = existingFile;
      return res.status(200).json({id: _id, ...rest});

    }catch(error){
      console.log(error);
      return res.status(500).json({error});
    }
  }

  static async postUpload(req, res){
    console.log('FilesController called');
    const token = req.get('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const id = await redisClientInstance.get(`auth_${token}`);
      if(!ObjectID.isValid(id)) return res.status(401).json({error: 'Unauthorized'});
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
      if(!data && type !== 'folder') return res.status(400).json({error: 'Missing data'});
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
          id: folderDocInsertedFeedback.insertedId,
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

        await mkdir(FOLDER_PATH, {recursive: true});
        await writeFile(localPath, base64decodedData);

        const fileDoc = {userId, name, type, isPublic, parentId, localPath};

        const fileDocInsertedFeedback = await dbClient.client.db().collection('files').insertOne(fileDoc);
        fileQueue.add('generate ImageThumbnail', {fileId: fileDocInsertedFeedback.insertedId, userId});
        return res.status(201).json({
          id: fileDocInsertedFeedback.insertedId,
          userId,
          name,
          type,
          isPublic,
          parentId });
      }

    } catch (error) {
      console.log('we got a problem at postUpload func: ', error);
      return res.status(500).json({ error });
    }
  }
}
