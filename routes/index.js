import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import express from 'express';
const router = express.Router();
router.get('/status', (req, res)=>AppController.getStatus(req, res));
router.get('/stats', (req, res)=>AppController.getStats(req, res));
router.post('/users', async (req, res)=>UsersController.postNew(req, res));
router.get('/connect', async (req, res)=>AuthController.getConnect(req, res));
router.get('/disconnect', async (req, res)=>AuthController.getDisconnect(req, res));
router.get('/users/me', (req, res)=>UsersController.getMe(req, res));
router.get('/files/:id', async (req, res)=>FilesController.getShow(req, res));
router.get('/files', async (req, res)=>FilesController.getIndex(req, res));
router.post('/files', async (req, res)=>FilesController.postUpload(req, res));
router.put('/files/:id/publish', async (req, res)=>FilesController.putPublish(req, res));
router.put('/files/:id/unpublish', async (req, res)=>FilesController.putUnpublish(req, res));

export default router;
