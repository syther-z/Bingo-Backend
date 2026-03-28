import express from 'express';
import http from 'http';
import GameService from './service/GameService';
import { BACKEND_URL, PORT } from './static';

const app = express();
const server = http.createServer(app);

let gameService = new GameService(server);

app.get('/ping', (req, res) => res.send('OK'));

setInterval(() => {
    fetch(BACKEND_URL);
}, 10 * 60 * 1000);

server.listen(PORT, () => {
    console.log(`Server Running at PORT: ${PORT}`);
});
