import Server from './lib/server';
import config from './config';
const s = new Server();
s.boot({ port: config.port });