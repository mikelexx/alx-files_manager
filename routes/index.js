import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import express from 'express';
const router = express.Router();
router.get('/status', (req, res)=>AppController.getStatus(req, res));
router.get('/stats', (req, res)=>AppController.getStats(req, res));
router.post('/users', async (req, res)=>UsersController.postNew(req, res));
export default router;
