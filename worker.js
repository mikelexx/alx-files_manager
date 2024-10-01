import dbClient from './utils/db';
const imageThumbnail = require('image-thumbnail');
const Queue = require('bull');
const fileQueue = new Queue('fileQueue');
const writeFile = promisify(fs.writeFile);
fileQueue.process('fileQueue', async (job, done)=>{
  const {fileId, userId} = job;

  if(!fileId) throw new Error('Missing fileId');
  if(!userId) throw new Error('Missing userId');

  const existingUserFile = await dbClient.client.db().collection('files').findOne({_id: id, userId});
  if(!existingUserFile) throw new Error('File not found');
  const {localPath} = existingUserFile;
  try{
    const thumbnail500 =  await imageThumbnail(localPath, {width: 500});
    const thumbnail250 =  await imageThumbnail(localPath, {width: 250});
    const thumbnail100 =  await imageThumbnail(localPath, {width: 100});
    await writeFile(localPath + '_500', thumbnail500);
    await writeFile(localPath + '_250', thumbnail250);
    await writeFile(localPath + '_100', thumbnail100);
    done();
  }catch(error){
    console.log('worker process error: ', error);
    done(error);
  }

});
