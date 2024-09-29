import router from './routes/index';
const express = require('express');
const process = require('process');
let PORT = process.env.PORT;
if(typeof PORT  === 'undefined'){
  PORT = 5000;
}

const app = express();
app.use(router);
app.listen(PORT, ()=>console.log(`server listening on port ${PORT}`));

