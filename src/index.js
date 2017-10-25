import app from './App';
import config from './config';

// start server....
app.server.listen(config.port);
console.log(`Iniciado na port ${config.port}`);