import Server from './lib/server';
import { expressConfig } from './config';
const s = new Server();
s.boot({ port: expressConfig.port });
