import express from 'express';
import http from 'http';
import GameService from './service/GameService';
import { BACKEND_URL, FRONTEND_URL, PORT } from './static';
import cors from 'cors';
const app = express();
app.use(cors({
    origin: FRONTEND_URL
}));
const server = http.createServer(app);

let gameService = new GameService(server);

app.get('/ping', (req, res) => res.send('OK'));

setInterval(() => {
    fetch(BACKEND_URL);
}, 10 * 60 * 1000);

server.listen(PORT, () => {
    console.log(`Server Running at PORT: ${PORT}`);
});
